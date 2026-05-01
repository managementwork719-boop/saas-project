import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
  getDashboard,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasks,
  createTask,
  updateTask,
  getApprovals,
  createApproval,
  actionOnApproval,
  getTeam,
  getAnalytics,
} from '../controllers/projectManagerController.js';

const router = express.Router();

// All routes require authentication and project-manager role
router.use(protect, restrictTo('project-manager', 'admin', 'super-admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Projects
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.patch('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Tasks
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.patch('/tasks/:id', updateTask);

// Approvals
router.get('/approvals', getApprovals);
router.post('/approvals', createApproval);
router.patch('/approvals/:id/action', actionOnApproval);

// Team
router.get('/team', getTeam);

// Analytics
router.get('/analytics', getAnalytics);

export default router;
