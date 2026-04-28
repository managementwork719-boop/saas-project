import Client from '../models/Client.js';
import Lead from '../models/Lead.js';
import mongoose from 'mongoose';
import { createActivityLog } from '../utils/logger.js';

export const getAllClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 8, search = '' } = req.query;
    const companyId = req.user.companyId;
    
    let query = { companyId };
    
    // If sales-team, filter clients by leads they have handled
    if (req.user.role === 'sales-team') {
      const handledClientIds = await Lead.find({ 
        companyId, 
        convertedBy: req.user.name,
        clientId: { $exists: true, $ne: null }
      }).distinct('clientId');
      
      query._id = { $in: handledClientIds };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch clients with pagination and field projection to exclude large fields if any
    const [clients, totalClients] = await Promise.all([
      Client.find(query)
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Client.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      pagination: {
        totalClients,
        totalPages: Math.ceil(totalClients / limit),
        currentPage: parseInt(page)
      },
      data: { clients }
    });
  } catch (err) {
    next(err);
  }
};

export const getClientProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Run queries in parallel for speed
    const [client, leads] = await Promise.all([
      Client.findOne({ _id: id, companyId }).lean(),
      Lead.find({ clientId: id, companyId }).sort({ date: -1 }).lean()
    ]);

    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client not found' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        client,
        leads
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const client = await Client.findOneAndUpdate(
      { _id: id, companyId: req.user.companyId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { client }
    });

    createActivityLog(req, {
      action: 'Update Client',
      module: 'Clients',
      description: `Updated profile for client: ${client.name}`
    });
  } catch (err) {
    next(err);
  }
};

export const syncClients = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    
    // Find leads that are not yet linked to a client
    const leads = await Lead.find({ companyId, clientId: { $exists: false } }).lean();
    if (leads.length === 0) {
      return res.status(200).json({ status: 'success', message: 'All leads are already synced.' });
    }

    const phoneSet = new Set(leads.map(l => l.phone).filter(p => p));
    const phones = Array.from(phoneSet);

    // Fetch all existing clients for these phones in one hit
    const existingClients = await Client.find({ phone: { $in: phones }, companyId }).lean();
    const clientCache = new Map(existingClients.map(c => [c.phone, c._id]));

    const newClientsData = [];
    for (const phone of phones) {
      if (!clientCache.has(phone)) {
        // Find one lead to get the name for this phone number
        const leadForName = leads.find(l => l.phone === phone);
        newClientsData.push({
          name: leadForName?.name || 'Unknown',
          phone,
          companyId
        });
      }
    }

    // Bulk create truly new clients
    if (newClientsData.length > 0) {
      const createdClients = await Client.insertMany(newClientsData);
      createdClients.forEach(c => clientCache.set(c.phone, c._id));
    }

    // Prepare Bulk Update for Leads
    const bulkLeadOps = leads.map(lead => {
      const clientId = lead.phone ? clientCache.get(lead.phone) : null;
      if (!clientId) return null;
      return {
        updateOne: {
          filter: { _id: lead._id },
          update: { $set: { clientId } }
        }
      };
    }).filter(op => op);

    if (bulkLeadOps.length > 0) {
      await Lead.bulkWrite(bulkLeadOps);
    }

    // Finally, recalculate stats for all affected clients in parallel (or just trigger a global sync)
    const affectedClientIds = Array.from(clientCache.values());
    await Promise.all(affectedClientIds.map(id => recalculateClientStats(id)));

    res.status(200).json({
      status: 'success',
      message: `Sync complete. Processed ${leads.length} leads across ${affectedClientIds.length} clients.`
    });
  } catch (err) {
    next(err);
  }
};

export const recalculateClientStats = async (clientId) => {
  const stats = await Lead.aggregate([
    { $match: { clientId: new mongoose.Types.ObjectId(clientId) } },
    {
      $group: {
        _id: null,
        totalWorks: { $sum: 1 },
        totalRevenue: { 
          $sum: { 
            $cond: [
              { $eq: ['$status', 'converted'] }, 
              { $cond: [{ $gt: ['$totalAmount', 0] }, '$totalAmount', '$budget'] }, 
              0
            ] 
          } 
        }
      }
    }
  ]);

  if (stats.length > 0) {
    await Client.findByIdAndUpdate(clientId, {
      totalWorks: stats[0].totalWorks,
      totalRevenue: stats[0].totalRevenue,
      lastActivity: new Date()
    });
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const client = await Client.findOneAndDelete({ _id: id, companyId });

    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client not found' });
    }

    // Unlink leads from this client (optional but safer than orphaned IDs)
    await Lead.updateMany({ clientId: id, companyId }, { $unset: { clientId: 1 } });

    res.status(204).json({
      status: 'success',
      data: null
    });

    createActivityLog(req, {
      action: 'Delete Client',
      module: 'Clients',
      description: `Deleted client record: ${client.name}`
    });
  } catch (err) {
    next(err);
  }
};
