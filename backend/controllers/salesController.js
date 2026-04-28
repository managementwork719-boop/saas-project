import Lead from '../models/Lead.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Company from '../models/Company.js';
import * as xlsx from 'xlsx';
import { recalculateClientStats } from './clientController.js';
import { createActivityLog } from '../utils/logger.js';

export const importLeads = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
       return res.status(200).json({ status: 'success', message: 'Excel file is empty' });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Validate Mandatory Headers
    if (rawData.length > 0) {
      const firstRowKeys = Object.keys(rawData[0]).map(k => k.toLowerCase().trim());
      const mandatoryFields = ['id', 'name', 'phone'];
      const missingFields = mandatoryFields.filter(field => !firstRowKeys.includes(field));
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          status: 'fail', 
          message: `Invalid Excel format. Missing required columns: ${missingFields.join(', ')}` 
        });
      }
    }

    // Prepare normalization and check for existing leads in one go
    const allLeadIds = rawData.map(row => {
      const keys = Object.keys(row);
      const idKey = keys.find(k => k.toLowerCase().trim() === 'id');
      return idKey ? row[idKey] : null;
    }).filter(id => id);

    // Fetch existing leads to avoid duplicates
    const existingLeads = await Lead.find({ companyId, leadId: { $in: allLeadIds } }).select('leadId').lean();
    const existingIdsSet = new Set(existingLeads.map(l => l.leadId));

    // Cache for clients to avoid duplicate hits
    const clientCache = new Map();
    const existingClients = await Client.find({ companyId }).lean();
    existingClients.forEach(c => clientCache.set(c.phone, c._id));

    let addedCount = 0;
    let skippedCount = 0;
    const leadsToCreate = [];
    const newClientsToCreate = [];

    // Collect new clients to create them in batch
    const newClientsData = [];
    const phonesToCreate = new Set();

    // Pass 1: Identify truly new clients from the rawData
    for (const row of rawData) {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.toLowerCase().trim()] = row[key];
      });

      const getVal = (keys) => {
        for (const k of keys) {
           if (normalizedRow[k]) return normalizedRow[k];
        }
        return '';
      };

      const phone = String(getVal(['phone', 'mobile', 'contact']) || '').trim();
      if (phone && !clientCache.has(phone) && !phonesToCreate.has(phone)) {
        newClientsData.push({
          name: getVal(['name', 'full name', 'fullname']) || 'Unknown',
          phone,
          email: String(getVal(['email', 'e-mail', 'mail id']) || '').trim().toLowerCase(),
          companyId
        });
        phonesToCreate.add(phone);
      }
    }

    // Bulk create new clients
    if (newClientsData.length > 0) {
      const createdClients = await Client.insertMany(newClientsData);
      createdClients.forEach(c => clientCache.set(c.phone, c._id));
    }

    // Pass 2: Prepare Bulk Operations
    const bulkOps = rawData.map(row => {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.toLowerCase().trim()] = row[key];
      });

      const leadId = normalizedRow['id'];
      if (!leadId) return null;

      const getVal = (keys) => {
        for (const k of keys) {
           if (normalizedRow[k]) return normalizedRow[k];
        }
        return '';
      };

      const phone = String(getVal(['phone', 'mobile', 'contact']) || '').trim();
      const clientId = phone ? clientCache.get(phone) : null;
      const fileName = req.file.originalname ? req.file.originalname.split('.')[0] : 'Excel Import';
      const customCampaign = req.body.campaignName || '';

      const leadData = {
        name: getVal(['name', 'full name', 'fullname']) || 'Unknown',
        phone,
        email: String(getVal(['email', 'e-mail', 'mail id']) || '').trim().toLowerCase(),
        source: getVal(['source', 'origin']) || customCampaign || fileName,
        campaign: customCampaign || getVal(['campaign', 'ads']) || fileName,
        requirement: getVal(['requirement', 'needs', 'service']),
        budget: parseFloat(getVal(['budget', 'cost', 'price']) || 0),
        location: getVal(['location', 'city', 'address']),
        companyId,
        month: currentMonth,
        status: 'origin',
        clientId
      };

      return {
        updateOne: {
          filter: { companyId, leadId: String(leadId) },
          update: { 
            $set: leadData, 
            $setOnInsert: { leadId: String(leadId) } 
          },
          upsert: true
        }
      };
    }).filter(op => op !== null);

    if (bulkOps.length > 0) {
      await Lead.bulkWrite(bulkOps);
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully processed ${rawData.length} rows. Leads Added/Updated: ${bulkOps.length}`,
    });

    createActivityLog(req, {
      action: 'Import Leads',
      module: 'Sales',
      description: `Imported ${bulkOps.length} leads from Excel file`
    });
  } catch (err) {
    next(err);
  }
};

export const getSalesDashboard = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear().toString();

    // Fetch company registration year
    const company = await Company.findById(companyId).select('createdAt');
    const registrationYear = company?.createdAt ? new Date(company.createdAt).getFullYear() : 2026;
    
    // Base match query with year filter (month starting with the year string)
    let matchQuery = { 
      companyId,
      month: { $regex: `^${currentYear}` }
    };
    
    // If user is sales-team, they see their own performance data + all origin (unassigned) leads
    if (req.user.role === 'sales-team') {
      matchQuery.$or = [
        { status: 'origin' },
        { convertedBy: req.user.name }
      ];
    }

    const isSalesTeam = req.user.role === 'sales-team';

    // Aggregate by month (Monthly Breakdown)
    const monthlyData = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$month',
          revenue: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ['$status', 'converted'] }, 
                  isSalesTeam ? { $eq: ['$convertedBy', req.user.name] } : { $eq: [1, 1] } 
                ]}, 
                { $cond: [{ $gt: ['$totalAmount', 0] }, '$totalAmount', '$budget'] }, 
                0
              ] 
            } 
          },
          received: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ['$status', 'converted'] }, 
                  isSalesTeam ? { $eq: ['$convertedBy', req.user.name] } : { $eq: [1, 1] }
                ]}, 
                '$advanceAmount', 
                0
              ] 
            } 
          },
          leads: { 
            $sum: { $cond: [isSalesTeam ? { $eq: ['$convertedBy', req.user.name] } : { $eq: [1, 1] }, 1, 0] } 
          },
          available: { 
            $sum: { $cond: [{ $eq: ['$status', 'origin'] }, 1, 0] } 
          },
          converted: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ['$status', 'converted'] }, 
                  isSalesTeam ? { $eq: ['$convertedBy', req.user.name] } : { $eq: [1, 1] }
                ]}, 
                1, 
                0
              ] 
            } 
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Total Stats (Personal context)
    let totalRevenue = 0;
    let totalReceived = 0;
    let totalLeads = 0;
    let totalConverted = 0;

    monthlyData.forEach(m => {
      totalRevenue += (m.revenue || 0);
      totalReceived += (m.received || 0);
      totalLeads += (m.leads || 0);
      totalConverted += (m.converted || 0);
    });

    res.status(200).json({
      status: 'success',
      data: {
        total: {
          revenue: totalRevenue,
          received: totalReceived,
          leads: totalLeads,
          converted: totalConverted,
          conversionRate: totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : 0
        },
        months: monthlyData,
        registrationYear
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyLeads = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const name = req.user.name;

    const [followUp, converted, notConverted] = await Promise.all([
      Lead.find({ 
        companyId, 
        convertedBy: name,
        status: 'follow-up' 
      }).sort({ nextFollowUp: 1 }).lean(),
      Lead.find({ 
        companyId, 
        convertedBy: name,
        status: 'converted' 
      }).sort({ updatedAt: -1 }).lean(),
      Lead.find({ 
        companyId, 
        convertedBy: name,
        status: 'not-converted' 
      }).sort({ updatedAt: -1 }).lean(),
    ]);

    res.status(200).json({
      status: 'success',
      data: { followUp, converted, notConverted }
    });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyOverview = async (req, res, next) => {
  try {
    const { month, page = 1, limit = 10, search = '', status = 'origin', teamMember, member, campaign } = req.query; // format YYYY-MM
    const companyId = req.user.companyId;
    const selectedMember = member || teamMember || '';

    let query = { month, companyId, status };

    // Support for dynamic campaign filtering
    if (campaign) {
      query.campaign = campaign;
    }

    if (req.user.role === 'sales-team') {
      // Sales team sees all unassigned 'origin' leads or leads assigned to them in other statuses
      if (status === 'origin') {
         query = { ...query, status: 'origin' };
      } else {
         query = { ...query, status, convertedBy: req.user.name };
      }
    } else if (selectedMember) {
      // Admin/Manager filtering by a specific team member
      if (status !== 'origin') {
         query.convertedBy = selectedMember;
      } else {
         query = { ...query, status: 'origin' };
      }
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { name: searchRegex },
            { phone: searchRegex },
            { leadId: searchRegex },
            { source: searchRegex },
            { campaign: searchRegex }
          ]
        }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const isSalesTeam = req.user.role === 'sales-team';
    let statsMatchQuery = { month, companyId };

    if (campaign) {
      statsMatchQuery.campaign = campaign;
    }

    if (isSalesTeam) {
      statsMatchQuery.$or = [
        { status: 'origin' },
        { convertedBy: req.user.name }
      ];
    } else if (selectedMember) {
      statsMatchQuery.convertedBy = selectedMember;
      delete statsMatchQuery.$or;
    }

    // Fetch unique campaigns for dynamic tabs
    const campaigns = await Lead.distinct('campaign', { month, companyId });

    // Separate stats calculation (Aggregation) - stats for the WHOLE month (not paginated)
    const statsPromise = Lead.aggregate([
      { $match: statsMatchQuery }, 
      {
        $group: {
          _id: null,
          revenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'converted'] }, 
                { $cond: [{ $gt: ['$totalAmount', 0] }, '$totalAmount', '$budget'] }, 
                0
              ] 
            } 
          },
          received: { 
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, '$advanceAmount', 0] } 
          },
          count: { 
            $sum: { $cond: [isSalesTeam ? { $eq: ['$convertedBy', req.user.name] } : true, 1, 0] } 
          },
          originCount: {
            $sum: { $cond: [{ $eq: ['$status', 'origin'] }, 1, 0] }
          },
          converted: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ['$status', 'converted'] },
                  isSalesTeam ? { $eq: ['$convertedBy', req.user.name] } : true
                ]}, 
                1, 
                0
              ] 
            } 
          },
          followUpCount: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ['$status', 'follow-up'] },
                  isSalesTeam ? { $eq: ['$convertedBy', req.user.name] } : true
                ]}, 
                1, 
                0
              ] 
            } 
          },
          notConvertedCount: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ['$status', 'not-converted'] },
                  isSalesTeam ? { $eq: ['$convertedBy', req.user.name] } : true
                ]}, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    // Paginated leads fetch
    const leadsPromise = Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const countPromise = Lead.countDocuments(query);

    const [statsResult, leads, totalLeads] = await Promise.all([statsPromise, leadsPromise, countPromise]);
    
    const stats = statsResult[0] || { 
      revenue: 0, received: 0, count: 0, converted: 0, 
      originCount: 0, followUpCount: 0, notConvertedCount: 0 
    };
    stats.profit = stats.revenue * 0.6;

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        leads,
        campaigns: campaigns.filter(c => c), // Remove nulls
        pagination: {
          totalLeads,
          totalPages: Math.ceil(totalLeads / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const companyId = req.user.companyId;

    // Fetch lead once for all checks
    const lead = await Lead.findOne({ _id: id, companyId });
    if (!lead) {
      return res.status(404).json({ status: 'fail', message: 'Lead not found' });
    }

    // Calculate pending amount if total and advance are present
    if (updateData.totalAmount !== undefined || updateData.advanceAmount !== undefined) {
      const total = updateData.totalAmount !== undefined ? updateData.totalAmount : lead.totalAmount;
      const advance = updateData.advanceAmount !== undefined ? updateData.advanceAmount : lead.advanceAmount;
      updateData.pendingAmount = total - advance;
    }

    // Auto-set next follow-up date to tomorrow if switching to follow-up and date is empty
    if (updateData.status === 'follow-up' && !lead.nextFollowUp && !updateData.nextFollowUp) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // Default to 9:00 AM
      updateData.nextFollowUp = tomorrow;
    }

    // Check if status is becoming converted
    if (updateData.status === 'converted' && lead.status !== 'converted' && !lead.clientId && lead.phone) {
      let client = await Client.findOne({ phone: lead.phone, companyId });
      if (!client) {
        client = await Client.create({
          name: lead.name,
          phone: lead.phone,
          companyId
        });
      }
      updateData.clientId = client._id;
    }

    // Logic for 'not-converted' cleanup (REMOVED: We now keep the client profile for future re-engagement)
    /* 
    if (updateData.status === 'not-converted' && lead.clientId) {
      ...
    }
    */

    // Update the lead with new data
    Object.assign(lead, updateData);
    await lead.save();

    res.status(200).json({
      status: 'success',
      data: { lead }
    });

    createActivityLog(req, {
      action: 'Update Lead',
      module: 'Sales',
      description: `Updated lead details for ${lead.name} (${lead.leadId})${updateData.status && updateData.status !== lead.status ? ` - Status changed to ${updateData.status}` : ''}`
    });
  } catch (err) {
    next(err);
  }
};
export const createLead = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { 
      leadId, name, phone, email, address, source, campaign, requirement, budget, location, date 
    } = req.body;

    // Check if leadId already exists for this company
    const existing = await Lead.findOne({ leadId, companyId });
    if (existing) {
      return res.status(400).json({ message: 'Lead ID already exists' });
    }

    const leadDate = date ? new Date(date) : new Date();
    const month = leadDate.toISOString().slice(0, 7);

    // Sync with Client
    let clientId = null;
    if (phone) {
      let client = await Client.findOne({ phone, companyId });
      if (!client) {
        client = await Client.create({ name, phone, email, companyId });
      }
      clientId = client._id;
    }

    const lead = await Lead.create({
      leadId: leadId || `ML-${Math.floor(Math.random() * 900000 + 100000)}`,
      name,
      phone,
      email,
      address,
      source,
      campaign,
      requirement,
      budget,
      location,
      date: leadDate,
      month,
      companyId,
      status: 'origin',
      clientId
    });

    res.status(201).json({
      status: 'success',
      data: { lead }
    });

    createActivityLog(req, {
      action: 'Create Lead',
      module: 'Sales',
      description: `Manually created new lead: ${lead.name} (${lead.leadId})`
    });
  } catch (err) {
    next(err);
  }
};

export const getTeamStats = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const { year } = req.query;
    const currentYearFilter = year || new Date().getFullYear().toString();

    // Aggregation match: Filter by company AND optional year (month prefix)
    const matchStage = { 
      companyId, 
      month: { $regex: `^${currentYearFilter}` }
    };

    const [stats, salesTeam] = await Promise.all([
      Lead.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$convertedBy',
            totalRevenue: { 
              $sum: { 
                $cond: [
                  { $eq: ['$status', 'converted'] }, 
                  { $cond: [{ $gt: ['$totalAmount', 0] }, '$totalAmount', '$budget'] }, 
                  0
                ] 
              } 
            },
            totalReceived: { 
              $sum: { $cond: [{ $eq: ['$status', 'converted'] }, '$advanceAmount', 0] } 
            },
            totalLeads: { $sum: 1 },
            convertedCount: { 
              $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } 
            }
          }
        }
      ]),
      User.find({ companyId, role: 'sales-team' }).select('name email profilePic').lean()
    ]);

    // Map stats back to users
    const teamStats = salesTeam.map(user => {
      const userStat = stats.find(s => s._id === user.name) || { totalRevenue: 0, totalLeads: 0, convertedCount: 0 };
      const conversionRate = userStat.totalLeads > 0 
        ? ((userStat.convertedCount / userStat.totalLeads) * 100).toFixed(1) 
        : 0;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        stats: {
          totalRevenue: userStat.totalRevenue,
          totalReceived: userStat.totalReceived || 0,
          totalLeads: userStat.totalLeads,
          converted: userStat.convertedCount,
          conversionRate
        }
      };
    });

    res.status(200).json({
      status: 'success',
      data: { teamStats }
    });
  } catch (err) {
    next(err);
  }
};

export const getMemberLeads = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { name } = req.params;

    const [followUp, converted, notConverted, monthlyStats] = await Promise.all([
      Lead.find({ 
        companyId, 
        convertedBy: name,
        status: 'follow-up' 
      }).sort({ nextFollowUp: 1 }).lean(),
      Lead.find({ 
        companyId, 
        convertedBy: name,
        status: 'converted' 
      }).sort({ updatedAt: -1 }).limit(10).lean(),
      Lead.find({ 
        companyId, 
        convertedBy: name,
        status: 'not-converted' 
      }).sort({ updatedAt: -1 }).limit(10).lean(),
      Lead.aggregate([
        { $match: { companyId, convertedBy: name, status: 'converted' } },
        {
          $group: {
            _id: '$month', // format YYYY-MM
            revenue: { 
              $sum: { $cond: [{ $gt: ['$totalAmount', 0] }, '$totalAmount', '$budget'] } 
            },
            received: { $sum: '$advanceAmount' },
            converted: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: { followUp, converted, notConverted, monthlyStats }
    });
  } catch (err) {
    next(err);
  }
};

export const addLeadNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const author = req.user.name;

    const lead = await Lead.findOneAndUpdate(
      { _id: id, companyId: req.user.companyId },
      { 
        $push: { 
          conversationLogs: { 
            note, 
            author, 
            timestamp: new Date() 
          } 
        } 
      },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ status: 'fail', message: 'Lead not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { logs: lead.conversationLogs }
    });

    createActivityLog(req, {
      action: 'Add Note',
      module: 'Sales',
      description: `Added a note to lead: ${lead.name}`
    });
  } catch (err) {
    next(err);
  }
};

export const addLeadPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, method, note, date } = req.body;
    const receivedBy = req.user.name;

    const lead = await Lead.findOne({ _id: id, companyId: req.user.companyId });
    if (!lead) {
      return res.status(404).json({ status: 'fail', message: 'Lead not found' });
    }

    // Add to history
    lead.paymentHistory.push({
      amount,
      method,
      note,
      date: date || new Date(),
      receivedBy
    });

    // Recalculate totals
    const totalPaid = lead.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    lead.advanceAmount = totalPaid;
    lead.pendingAmount = (lead.totalAmount || lead.budget || 0) - totalPaid;

    // Update status
    if (lead.pendingAmount <= 0) {
      lead.paymentStatus = 'received';
    } else {
      lead.paymentStatus = 'partial';
    }

    await lead.save();

    // Update client stats if linked
    if (lead.clientId) {
      await recalculateClientStats(lead.clientId);
    }

    res.status(200).json({
      status: 'success',
      data: { 
        paymentHistory: lead.paymentHistory,
        advanceAmount: lead.advanceAmount,
        pendingAmount: lead.pendingAmount,
        paymentStatus: lead.paymentStatus
      }
    });

    createActivityLog(req, {
      action: 'Receive Payment',
      module: 'Sales',
      description: `Received payment of ₹${amount} for lead: ${lead.name}`
    });
  } catch (err) {
    next(err);
  }
};
export const deleteCampaign = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { month } = req.query; // Ensure we only delete for a specific month
    const companyId = req.user.companyId;

    if (!name) {
      return res.status(400).json({ status: 'fail', message: 'Campaign name is required' });
    }

    const result = await Lead.deleteMany({ 
      campaign: name, 
      companyId,
      month: month || { $exists: true } // Delete for current month if provided, otherwise all
    });

    res.status(200).json({
      status: 'success',
      message: `Successfully deleted ${result.deletedCount} leads from campaign: ${name}`
    });

    createActivityLog(req, {
      action: 'Delete Campaign',
      module: 'Sales',
      description: `Deleted campaign: ${name} (${result.deletedCount} leads removed)`
    });
  } catch (err) {
    next(err);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    res.status(204).json({
      status: 'success',
      data: null
    });

    createActivityLog(req, {
      action: 'Delete Lead',
      module: 'Sales',
      description: `Deleted lead: ${lead.name} (${lead.leadId})`
    });
  } catch (err) {
    next(err);
  }
};
export const getOverdueProjects = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const now = new Date();

    // Find converted leads where deadline has passed and not completed
    const overdueLeads = await Lead.find({
      companyId,
      status: 'converted',
      deliveryStatus: { $ne: 'completed' },
      deadline: { $lt: now }
    })
    .sort({ deadline: 1 })
    .select('name requirement date deadline convertedBy phone leadId')
    .lean();

    res.status(200).json({
      status: 'success',
      results: overdueLeads.length,
      data: { overdueProjects: overdueLeads }
    });
  } catch (err) {
    next(err);
  }
};
