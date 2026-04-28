import ActivityLog from '../models/ActivityLog.js';

export const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, module, role, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = { companyId: req.user.companyId };

    // Role-based visibility
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      if (req.user.role.endsWith('-manager')) {
        // Manager sees their department
        const department = req.user.role.split('-')[0].charAt(0).toUpperCase() + req.user.role.split('-')[0].slice(1);
        query.department = department;
      } else {
        // Team member sees only their own
        query.user = req.user._id;
      }
    }

    // Filters
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } }
      ];
    }
    if (module) query.module = module;
    if (role) query.role = role;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean for better read performance

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: logs.length,
      total,
      data: {
        logs,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const getLogInsights = async (req, res) => {
  try {
    // Aggregations
    const [moduleStats, userStats, statusStats, activityTrend] = await Promise.all([
      // 1. Logs by Module
      ActivityLog.aggregate([
        { $match: { companyId: req.user.companyId } },
        { $project: { module: 1 } },
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // 2. Top Users
      ActivityLog.aggregate([
        { $match: { companyId: req.user.companyId } },
        { $project: { userName: 1 } },
        { $group: { _id: '$userName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      // 3. Success vs Failure
      ActivityLog.aggregate([
        { $match: { companyId: req.user.companyId } },
        { $project: { status: 1 } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // 4. Activity Trend (Last 7 Days)
      ActivityLog.aggregate([
        { 
          $match: { 
            companyId: req.user.companyId, 
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
          } 
        },
        { $project: { timestamp: 1 } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        moduleStats,
        userStats,
        statusStats,
        activityTrend
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const exportLogs = async (req, res) => {
  try {
    const { search, module, role, startDate, endDate } = req.query;
    let query = { companyId: req.user.companyId };

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } }
      ];
    }
    if (module) query.module = module;
    if (role) query.role = role;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const logs = await ActivityLog.find(query).sort({ timestamp: -1 }).lean();

    let csv = 'Timestamp,Actor,Role,Module,Action,Description,IP Address,Status\n';
    logs.forEach(log => {
      csv += `"${new Date(log.timestamp).toLocaleString()}","${log.userName}","${log.role}","${log.module}","${log.action}","${log.description.replace(/"/g, '""')}","${log.ipAddress}","${log.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
