import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Approval from '../models/Approval.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { getCache, setCache, deleteCache } from '../utils/cache.js';
import { createActivityLog } from '../utils/logger.js';
import { v2 as cloudinary } from 'cloudinary';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary explicitly in the controller
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary Config Status:', {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  hasSecret: !!process.env.CLOUDINARY_API_SECRET
});

// Helper to sign Cloudinary URLs correctly
const signUrl = (originalUrl, publicIdFromDb = null, resourceTypeFromDb = 'raw') => {
  if (!originalUrl) return null;
  
  // Detect actual resource type from original URL to prevent 404s due to DB metadata mismatch
  const detectedResourceType = originalUrl.includes('/raw/upload/') ? 'raw' : 
                               (originalUrl.includes('/video/upload/') ? 'video' : 'image');
  
  // If we have publicId, use it - it's much more reliable
  if (publicIdFromDb) {
    try {
      return cloudinary.url(publicIdFromDb, {
        sign_url: true,
        resource_type: detectedResourceType, // Use detected type instead of DB type
        secure: true,
        analytics: false,
        expires_at: Math.floor(Date.now() / 1000) + 3600
      });
    } catch (err) {
      console.error('Error signing by ID:', err);
    }
  }

  // Fallback to URL parsing if no ID provided or if parsing is needed
  if (originalUrl.includes('/s--')) return originalUrl; // Already signed
  
  try {
    const urlObj = new URL(originalUrl);
    const pathParts = urlObj.pathname.split('/');
    
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return originalUrl;
    
    // For raw files, resource_type is before /upload/
    const resourceType = pathParts[uploadIndex - 1] || 'raw';
    
    let publicIdParts = pathParts.slice(uploadIndex + 1);
    let versionStr = null;
    
    // Cloudinary URL structure: .../upload/[signature]/[version]/[public_id]
    if (publicIdParts.length > 0 && publicIdParts[0].startsWith('s--')) {
      return originalUrl; // Already signed
    }

    if (publicIdParts.length > 0 && publicIdParts[0].startsWith('v') && !isNaN(publicIdParts[0].substring(1))) {
      versionStr = publicIdParts.shift().substring(1);
    }
    
    // Use decodeURIComponent to handle spaces/special chars in path parts
    const publicId = publicIdParts.map(part => decodeURIComponent(part)).join('/');
    
    const options = {
      sign_url: true,
      resource_type: resourceType,
      secure: true,
      analytics: false,
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    
    if (versionStr) options.version = versionStr;
    
    return cloudinary.url(publicId, options);
  } catch (err) {
    console.error('Error parsing URL for signing:', err);
    return originalUrl;
  }
};

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
      pendingApprovalsCount,
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
      Project.find({ companyId })
        .select('name client progress status budget budgetUsed deadline manager managerName riskStatus taskBreakdown updatedAt description visibility milestones tags priority startDate category type')
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('manager', 'name profilePic')
        .lean(),
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
      ActivityLog.find({ companyId, department: 'Project' })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
      ActivityLog.find({ companyId, department: 'Project', timestamp: { $gte: today } })
        .sort({ timestamp: -1 })
        .lean(),
    ]);

    const teamCount = teamMembers.length || 1;
    const totalCapacity = teamCount * 25;
    const activeTasksCount = totalTasks - completedTasks;
    const teamUtilization = Math.min(Math.round((activeTasksCount / totalCapacity) * 100), 100);

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
        pendingApprovals: pendingApprovalsCount,
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

    await setCache(cacheKey, dashboardData, 120);
    res.status(200).json({ status: 'success', data: dashboardData });
  } catch (err) {
    console.error('PM Dashboard Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── PROJECTS ──────────────────────────────────────────────────────────────

export const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, riskStatus, priority, manager, startDate, endDate, search } = req.query;
    const companyId = req.user.companyId;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { companyId };
    
    // For project-team members, only show projects they are assigned to
    if (req.user.role === 'project-team') {
      query.teamMembers = req.user._id;
    }
    
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
        .select('name client progress status budget budgetUsed deadline manager managerName riskStatus taskBreakdown priority progress startDate updatedAt description visibility milestones tags category type')
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
        pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), limit: parseInt(limit) } 
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const query = { _id: id, companyId };
    
    // For project-team members, ensure they are part of the project
    if (req.user.role === 'project-team') {
      query.teamMembers = req.user._id;
    }

    const project = await Project.findOne(query)
      .populate('manager', 'name profilePic role email')
      .populate('teamMembers', 'name profilePic role email designation')
      .lean();

    if (!project) return res.status(404).json({ status: 'fail', message: 'Project not found' });

    const [tasks, activity, recentApprovals] = await Promise.all([
      Task.find({ project: id, companyId }).sort({ createdAt: -1 }).lean(),
      ActivityLog.find({ companyId, module: 'Projects', description: { $regex: project.name, $options: 'i' } })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
      Approval.find({ project: id, companyId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked' || t.isDelayed).length;

    const taskBreakdown = { completed: completedTasks, inProgress: inProgressTasks, todo: todoTasks, blocked: blockedTasks, total: totalTasks };
    const budgetUsedPercent = project.budget > 0 ? Math.round((project.budgetUsed / project.budget) * 100) : 0;

    const teamStats = project.teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assignedTo?.toString() === member._id.toString());
      const done = memberTasks.filter(t => t.status === 'completed').length;
      return {
        ...member,
        tasksDone: done,
        totalTasks: memberTasks.length,
        completion: memberTasks.length > 0 ? Math.round((done / memberTasks.length) * 100) : 0
      };
    });

    const signedDocuments = (project.documents || []).map(doc => ({
      ...doc,
      url: doc.url ? signUrl(doc.url, doc.publicId, doc.resourceType) : null
    }));

    const signedNotes = (project.notes || []).map(note => ({
      ...note,
      fileUrl: note.fileUrl ? signUrl(note.fileUrl, note.publicId, note.resourceType) : null
    }));

    res.status(200).json({
      status: 'success',
      data: {
        project: {
          ...project,
          taskBreakdown,
          budgetUsedPercent,
          teamStats,
          tasks: tasks.slice(0, 10),
          activity,
          approvals: recentApprovals,
          risks: project.risks || [],
          notes: signedNotes,
          links: project.links || [],
          documents: signedDocuments
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user._id,
      manager: req.body.manager || req.user._id,
      managerName: req.body.managerName || req.user.name
    };
    const project = await Project.create(projectData);
    await deleteCache(`pm_dashboard:${req.user.companyId}`);

    createActivityLog(req, { action: 'Create Project', module: 'Projects', description: `Created new project "${project.name}"` });
    res.status(201).json({ status: 'success', data: { project } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, req.body, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ status: 'fail', message: 'Project not found' });
    await deleteCache(`pm_dashboard:${req.user.companyId}`);

    createActivityLog(req, { action: 'Update Project', module: 'Projects', description: `Updated details for project "${project.name}"` });
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
    res.status(200).json({ status: 'success', message: 'Project deleted' });
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

    res.status(200).json({ status: 'success', data: { tasks, pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) } } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, projectName, assignedToId, assignedToName, priority, dueDate } = req.body;
    const companyId = req.user.companyId;

    const task = await Task.create({ title, description, priority, dueDate, project: projectId, projectName, assignedTo: assignedToId, assignedToName, assignedBy: req.user._id, companyId });
    await deleteCache(`pm_dashboard:${companyId}`);

    createActivityLog(req, { action: 'Create Task', module: 'Projects', description: `Created task "${title}" assigned to ${assignedToName}` });
    res.status(201).json({ status: 'success', data: { task } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status === 'completed') updates.completedAt = new Date();

    const task = await Task.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ status: 'fail', message: 'Task not found' });

    await deleteCache(`pm_dashboard:${req.user.companyId}`);
    createActivityLog(req, { action: 'Update Task', module: 'Projects', description: `Updated task "${task.title}" to status: ${task.status}` });
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

    res.status(200).json({ status: 'success', data: { approvals, pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) } } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const createApproval = async (req, res) => {
  try {
    const { title, description, type, projectId, projectName, amount, isUrgent } = req.body;
    const companyId = req.user.companyId;

    const approval = await Approval.create({ title, description, type, amount, isUrgent: isUrgent || false, project: projectId, projectName, requestedBy: req.user._id, requestedByName: req.user.name, companyId });
    await deleteCache(`pm_dashboard:${companyId}`);
    res.status(201).json({ status: 'success', data: { approval } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const actionOnApproval = async (req, res) => {
  try {
    const { action, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(action)) return res.status(400).json({ status: 'fail', message: 'Invalid action' });

    const approval = await Approval.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId, status: 'pending' }, { status: action, reviewNote, reviewedBy: req.user._id, reviewedAt: new Date() }, { new: true });
    if (!approval) return res.status(404).json({ status: 'fail', message: 'Approval not found or already actioned' });

    await deleteCache(`pm_dashboard:${req.user.companyId}`);
    createActivityLog(req, { action: action === 'approved' ? 'Approve Request' : 'Reject Request', module: 'Projects', description: `${action === 'approved' ? 'Approved' : 'Rejected'} approval: ${approval.title}` });
    res.status(200).json({ status: 'success', data: { approval } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ─── TEAM ──────────────────────────────────────────────────────────────────

export const getTeam = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const members = await User.find({ companyId, role: 'project-team' }).select('name email profilePic role designation department createdAt').lean();
    const memberIds = members.map((m) => m._id);
    const taskStats = await Task.aggregate([{ $match: { companyId, assignedTo: { $in: memberIds } } }, { $group: { _id: '$assignedTo', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } }, hoursLogged: { $sum: '$hoursLogged' } } }]);

    const team = members.map((m) => {
      const stats = taskStats.find((t) => t._id?.toString() === m._id?.toString()) || {};
      const total = stats.total || 0;
      const done = stats.completed || 0;
      return { ...m, stats: { total, completed: done, inProgress: stats.inProgress || 0, hoursLogged: stats.hoursLogged || 0, completion: total > 0 ? Math.round((done / total) * 100) : 0 } };
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
      Project.aggregate([{ $match: { companyId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: { companyId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: { companyId, status: 'completed', completedAt: { $exists: true } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $limit: 30 }]),
    ]);
    res.status(200).json({ status: 'success', data: { projectsByStatus, tasksByStatus, completionTrend } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── PROJECT EXTRAS (NOTES, LINKS, DOCS) ──────────────────────────────────

export const addNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ status: 'fail', message: 'Project not found' });

    console.log('Adding Note with file:', req.file ? {
      name: req.file.originalname,
      path: req.file.path,
      type: req.file.resource_type
    } : 'No file');

    project.notes.push({
      title,
      content,
      addedBy: req.user.name,
      fileUrl: req.file ? req.file.path : null,
      publicId: req.file ? req.file.filename : null,
      resourceType: req.file ? (req.file.resource_type || (req.file.mimetype === 'application/pdf' || req.file.mimetype.includes('image') ? 'image' : 'raw')) : 'raw',
      date: new Date()
    });

    await project.save();
    createActivityLog(req, { action: 'Add Note', module: 'Projects', description: `Added a new note to project "${project.name}"` });
    res.status(200).json({ status: 'success', data: { note: project.notes[project.notes.length - 1] } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const addLink = async (req, res) => {
  try {
    const { title, url, category } = req.body;
    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ status: 'fail', message: 'Project not found' });

    project.links.push({ title, url, category });
    await project.save();
    createActivityLog(req, { action: 'Add Link', module: 'Projects', description: `Added link "${title}" to project "${project.name}"` });
    res.status(200).json({ status: 'success', data: { link: project.links[project.links.length - 1] } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const addDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'fail', message: 'No file uploaded' });

    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ status: 'fail', message: 'Project not found' });

    const getFileType = (mimetype) => {
      if (mimetype.includes('pdf')) return 'PDF';
      if (mimetype.includes('sheet') || mimetype.includes('excel') || mimetype.includes('csv')) return 'EXCEL';
      if (mimetype.includes('word') || mimetype.includes('officedocument.wordprocessingml')) return 'WORD';
      if (mimetype.includes('image')) return 'IMAGE';
      return 'FILE';
    };

    const isMedia = req.file.mimetype === 'application/pdf' || req.file.mimetype.includes('image');
    
    project.documents.push({
      name: req.body.name || req.file.originalname,
      type: getFileType(req.file.mimetype),
      url: req.file.path,
      publicId: req.file.filename,
      resourceType: req.file.resource_type || 'raw',
      addedBy: req.user.name,
      date: new Date()
    });

    await project.save();
    createActivityLog(req, { action: 'Add Document', module: 'Projects', description: `Uploaded "${req.file.originalname}" to project "${project.name}"` });
    res.status(200).json({ status: 'success', data: { document: project.documents[project.documents.length - 1] } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};



export const downloadProxy = (req, res) => {
  const { url: fileUrl, filename, view } = req.query;
  if (!fileUrl) return res.status(400).json({ status: 'fail', message: 'URL required' });

  // Ensure we don't double sign if it's already signed
  const signedUrl = signUrl(fileUrl) || fileUrl;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  try {
    const urlToFetch = new URL(signedUrl);
    
    https.get(urlToFetch, options, (response) => {
      if (response.statusCode !== 200) {
        console.error('Proxy Error: Cloudinary returned', response.statusCode, 'for URL:', signedUrl);
        // Fallback: if proxy fails, try to redirect the user directly as a last resort
        if (response.statusCode === 401 || response.statusCode === 403) {
           return res.redirect(signedUrl);
        }
        return res.status(response.statusCode).json({ status: 'fail', message: `Cloudinary returned status ${response.statusCode}` });
      }
      
      const isPdf = signedUrl.toLowerCase().includes('.pdf') || response.headers['content-type'] === 'application/pdf';
      const disposition = view === 'inline' ? 'inline' : 'attachment';

      res.setHeader('Content-Disposition', `${disposition}; filename="${filename || 'document'}"`);
      res.setHeader('Content-Type', isPdf ? 'application/pdf' : (response.headers['content-type'] || 'application/octet-stream'));
      response.pipe(res);
    }).on('error', (err) => {
      console.error('Proxy Error:', err);
      res.status(500).json({ status: 'error', message: err.message });
    });
  } catch (err) {
    console.error('URL Parsing Error in Proxy:', err);
    res.status(400).json({ status: 'fail', message: 'Invalid file URL' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const project = await Project.findOne({ _id: id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ status: 'fail', message: 'Project not found' });

    const doc = project.documents.id(docId);
    if (!doc) return res.status(404).json({ status: 'fail', message: 'Document not found' });

    // Delete from Cloudinary if publicId exists
    if (doc.publicId) {
      try {
        const type = doc.url?.includes('/raw/upload/') ? 'raw' : 
                     (doc.url?.includes('/video/upload/') ? 'video' : 'image');
        await cloudinary.uploader.destroy(doc.publicId, { resource_type: type });
      } catch (err) {
        console.error('Cloudinary Delete Error:', err);
      }
    }

    project.documents.pull(docId);
    await project.save();

    res.status(200).json({ status: 'success', message: 'Document deleted' });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const project = await Project.findOne({ _id: id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ status: 'fail', message: 'Project not found' });

    const note = project.notes.id(noteId);
    if (!note) return res.status(404).json({ status: 'fail', message: 'Note not found' });

    // Delete from Cloudinary if publicId exists
    if (note.publicId) {
      try {
        const type = note.fileUrl?.includes('/raw/upload/') ? 'raw' : 
                     (note.fileUrl?.includes('/video/upload/') ? 'video' : 'image');
        await cloudinary.uploader.destroy(note.publicId, { resource_type: type });
      } catch (err) {
        console.error('Cloudinary Delete Error:', err);
      }
    }

    project.notes.pull(noteId);
    await project.save();

    res.status(200).json({ status: 'success', message: 'Note deleted' });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
