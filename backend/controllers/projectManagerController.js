import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Approval from '../models/Approval.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { getCache, setCache, deleteCache } from '../utils/cache.js';
import { createActivityLog } from '../utils/logger.js';

// ─── DASHBOARD ─────────────────────────────────────────────────────────────

export const getDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const cacheKey = `pm_dashboard:${companyId}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json({ status: 'success', source: 'cache', data: cached });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeProjects,
      totalProjects,
      delayedProjects,
      totalTasks,
      completedTasks,
      teamMembers,
      pendingApprovals,
      urgentApprovals,
      recentProjects,
      tasksByMember,
      recentActivity,
      todayLogs,
    ] = await Promise.all([
      Project.countDocuments({ companyId, status: 'active' }),
      Project.countDocuments({ companyId }),
      Project.countDocuments({ companyId, riskStatus: 'delayed' }),
      Task.countDocuments({ companyId }),
      Task.countDocuments({ companyId, status: 'completed' }),
      User.find({ companyId, role: 'project-team' }).select('name email profilePic role').lean(),
      Approval.countDocuments({ companyId, status: 'pending' }),
      Approval.countDocuments({ companyId, status: 'pending', isUrgent: true }),
      // Projects overview (latest 10)
      Project.find({ companyId })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('manager', 'name profilePic')
        .lean(),
      // Tasks per member for workload
      Task.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: '$assignedTo',
            name: { $first: '$assignedToName' },
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            active: { $sum: { $cond: [{ $in: ['$status', ['todo', 'in-progress', 'review']] }, 1, 0] } },
            hoursLogged: { $sum: '$hoursLogged' },
          },
        },
        { $sort: { active: -1 } },
      ]),
      // Activity feed – project department logs (project-team)
      ActivityLog.find({ companyId, department: 'Project' })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
      // Today's logs per member
      ActivityLog.find({ companyId, department: 'Project', timestamp: { $gte: today } })
        .sort({ timestamp: -1 })
        .lean(),
    ]);

    // Team utilization = (active tasks / totalCapacity) * 100
    const teamCount = teamMembers.length || 1;
    const totalCapacity = teamCount * 25; // assume 25 tasks per member capacity
    const activeTasks = totalTasks - completedTasks;
    const teamUtilization = Math.min(Math.round((activeTasks / totalCapacity) * 100), 100);

    // Team performance from tasks
    const teamPerformance = teamMembers.map((member) => {
      const memberTasks = tasksByMember.find((t) => t._id?.toString() === member._id?.toString());
      const total = memberTasks?.total || 0;
      const done = memberTasks?.completed || 0;
      const completion = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        _id: member._id,
        name: member.name,
        role: member.role,
        profilePic: member.profilePic,
        email: member.email,
        completion,
        tasksDone: done,
        totalTasks: total,
        hoursLogged: memberTasks?.hoursLogged || 0,
      };
    }).sort((a, b) => b.completion - a.completion);

    // Workload per member
    const teamWorkload = teamMembers.map((member) => {
      const memberTasks = tasksByMember.find((t) => t._id?.toString() === member._id?.toString());
      const active = memberTasks?.active || 0;
      const total = memberTasks?.total || 0;
      const pct = total > 0 ? Math.min(Math.round((active / 25) * 100), 100) : 0;
      return {
        _id: member._id,
        name: member.name,
        profilePic: member.profilePic,
        activeTasks: active,
        totalTasks: total,
        workloadPct: pct,
        hoursLogged: memberTasks?.hoursLogged || 0,
        status: pct >= 85 ? 'overloaded' : pct <= 30 ? 'underutilized' : 'normal',
      };
    }).sort((a, b) => b.workloadPct - a.workloadPct);

    // Daily tracker - today's unique members who logged
    const dailyMap = {};
    todayLogs.forEach((log) => {
      if (!dailyMap[log.userName]) {
        dailyMap[log.userName] = {
          name: log.userName,
          task: log.description,
          module: log.module,
          hoursLogged: teamWorkload.find((m) => m.name === log.userName)?.hoursLogged || 0,
          lastActivity: log.timestamp,
        };
      }
    });
    const dailyTracker = Object.values(dailyMap).slice(0, 8);

    // Pending approvals list
    const approvalsList = await Approval.find({ companyId, status: 'pending' })
      .sort({ isUrgent: -1, createdAt: -1 })
      .limit(5)
      .lean();

    const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const dashboardData = {
      stats: {
        activeProjects,
        totalTasks,
        delayedTasks: delayedProjects,
        teamUtilization,
        pendingApprovals,
        urgentApprovals,
      },
      projects: recentProjects,
      teamPerformance: {
        overallCompletion,
        totalTasksDone: completedTasks,
        members: teamPerformance,
      },
      approvals: approvalsList,
      activityFeed: recentActivity,
      teamWorkload,
      dailyTracker,
    };

    await setCache(cacheKey, dashboardData, 120); // 2 min cache
    res.status(200).json({ status: 'success', data: dashboardData });
  } catch (err) {
    console.error('PM Dashboard Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── PROJECTS ──────────────────────────────────────────────────────────────

export const getProjects = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      riskStatus, 
      priority, 
      manager, 
      startDate, 
      endDate, 
      search 
    } = req.query;
    
    const companyId = req.user.companyId;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { companyId };
    
    if (status) query.status = status;
    if (riskStatus) query.riskStatus = riskStatus;
    if (priority) query.priority = priority;
    if (manager) query.managerName = manager;
    
    if (startDate || endDate) {
      query.deadline = {};
      if (startDate) query.deadline.$gte = new Date(startDate);
      if (endDate) query.deadline.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { client: { $regex: search, $options: 'i' } },
        { managerName: { $regex: search, $options: 'i' } },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('manager', 'name profilePic')
        .populate('teamMembers', 'name profilePic')
        .lean(),
      Project.countDocuments(query),
    ]);

    res.status(200).json({
      status: 'success',
      data: { 
        projects, 
        pagination: { 
          total, 
          totalPages: Math.ceil(total / limit), 
          currentPage: parseInt(page),
          limit: parseInt(limit)
        } 
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { 
      name, client, key, type, category, description, startDate, deadline, 
      priority, riskStatus, budget, currency, visibility, status, tags, milestones, teamMembers 
    } = req.body;
    const companyId = req.user.companyId;

    const project = await Project.create({
      name, client, key, type, category, description, startDate, deadline, 
      priority, riskStatus, budget, currency, visibility, status, tags, milestones, teamMembers,
      companyId,
      manager: req.user._id,
      managerName: req.user.name,
      createdBy: req.user._id,
    });

    await deleteCache(`pm_dashboard:${companyId}`);

    createActivityLog(req, {
      action: 'Create Project',
      module: 'Projects',
      description: `Created project: ${name} for client ${client}`,
    });

    res.status(201).json({ status: 'success', data: { project } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ status: 'fail', message: 'Project not found' });

    await deleteCache(`pm_dashboard:${req.user.companyId}`);

    createActivityLog(req, {
      action: 'Update Project',
      module: 'Projects',
      description: `Updated project: ${project.name}`,
    });

    res.status(200).json({ status: 'success', data: { project } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ status: 'fail', message: 'Project not found' });

    await deleteCache(`pm_dashboard:${req.user.companyId}`);

    createActivityLog(req, {
      action: 'Delete Project',
      module: 'Projects',
      description: `Deleted project: ${project.name}`,
    });

    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ─── TASKS ─────────────────────────────────────────────────────────────────

export const getTasks = async (req, res) => {
  try {
    const { project, assignedTo, status, page = 1, limit = 20 } = req.query;
    const companyId = req.user.companyId;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { companyId };
    if (project) query.project = project;
    if (assignedTo) query.assignedToName = { $regex: assignedTo, $options: 'i' };
    if (status) query.status = status;

    const [tasks, total] = await Promise.all([
      Task.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Task.countDocuments(query),
    ]);

    res.status(200).json({
      status: 'success',
      data: { tasks, pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) } },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, projectName, assignedToId, assignedToName, priority, dueDate } = req.body;
    const companyId = req.user.companyId;

    const task = await Task.create({
      title, description, priority, dueDate,
      project: projectId,
      projectName,
      assignedTo: assignedToId,
      assignedToName,
      assignedBy: req.user._id,
      companyId,
    });

    await deleteCache(`pm_dashboard:${companyId}`);

    createActivityLog(req, {
      action: 'Create Task',
      module: 'Projects',
      description: `Created task "${title}" assigned to ${assignedToName}`,
    });

    res.status(201).json({ status: 'success', data: { task } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status === 'completed') updates.completedAt = new Date();

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      updates,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ status: 'fail', message: 'Task not found' });

    await deleteCache(`pm_dashboard:${req.user.companyId}`);

    createActivityLog(req, {
      action: 'Update Task',
      module: 'Projects',
      description: `Updated task "${task.title}" to status: ${task.status}`,
    });

    res.status(200).json({ status: 'success', data: { task } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ─── APPROVALS ─────────────────────────────────────────────────────────────

export const getApprovals = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const companyId = req.user.companyId;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { companyId };
    if (status !== 'all') query.status = status;

    const [approvals, total] = await Promise.all([
      Approval.find(query).sort({ isUrgent: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Approval.countDocuments(query),
    ]);

    res.status(200).json({
      status: 'success',
      data: { approvals, pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) } },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const createApproval = async (req, res) => {
  try {
    const { title, description, type, projectId, projectName, amount, isUrgent } = req.body;
    const companyId = req.user.companyId;

    const approval = await Approval.create({
      title, description, type, amount, isUrgent: isUrgent || false,
      project: projectId,
      projectName,
      requestedBy: req.user._id,
      requestedByName: req.user.name,
      companyId,
    });

    await deleteCache(`pm_dashboard:${companyId}`);
    res.status(201).json({ status: 'success', data: { approval } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const actionOnApproval = async (req, res) => {
  try {
    const { action, reviewNote } = req.body; // action: 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid action' });
    }

    const approval = await Approval.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId, status: 'pending' },
      { status: action, reviewNote, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    if (!approval) return res.status(404).json({ status: 'fail', message: 'Approval not found or already actioned' });

    await deleteCache(`pm_dashboard:${req.user.companyId}`);

    createActivityLog(req, {
      action: action === 'approved' ? 'Approve Request' : 'Reject Request',
      module: 'Projects',
      description: `${action === 'approved' ? 'Approved' : 'Rejected'} approval: ${approval.title}`,
    });

    res.status(200).json({ status: 'success', data: { approval } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ─── TEAM ──────────────────────────────────────────────────────────────────

export const getTeam = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const members = await User.find({ 
      companyId, 
      role: 'project-team' 
    })
      .select('name email profilePic role designation department createdAt')
      .lean();

    const memberIds = members.map((m) => m._id);
    const taskStats = await Task.aggregate([
      { $match: { companyId, assignedTo: { $in: memberIds } } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          hoursLogged: { $sum: '$hoursLogged' },
        },
      },
    ]);

    const team = members.map((m) => {
      const stats = taskStats.find((t) => t._id?.toString() === m._id?.toString()) || {};
      const total = stats.total || 0;
      const done = stats.completed || 0;
      return {
        ...m,
        stats: {
          total,
          completed: done,
          inProgress: stats.inProgress || 0,
          hoursLogged: stats.hoursLogged || 0,
          completion: total > 0 ? Math.round((done / total) * 100) : 0,
        },
      };
    });

    res.status(200).json({ status: 'success', data: { team } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── ANALYTICS ─────────────────────────────────────────────────────────────

export const getAnalytics = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const [projectsByStatus, tasksByStatus, completionTrend] = await Promise.all([
      Project.aggregate([
        { $match: { companyId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { companyId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { companyId, status: 'completed', completedAt: { $exists: true } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    res.status(200).json({
      status: 'success',
      data: { projectsByStatus, tasksByStatus, completionTrend },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
