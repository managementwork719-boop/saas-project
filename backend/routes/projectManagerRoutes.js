import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
  getDashboard,
  getProjects,
  getProject,
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
  addNote,
  addLink,
  addDocument,
  deleteDocument,
  deleteNote,
  downloadProxy
} from '../controllers/projectManagerController.js';
import upload from '../utils/upload.js';

const router = express.Router();

// All routes require authentication and appropriate role
router.use(protect, restrictTo('project-manager', 'admin', 'super-admin', 'project-team'));

// Dashboard
router.get('/dashboard', getDashboard);

// Projects
router.get('/projects', getProjects);
router.get('/projects/:id', getProject);
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

// Project Extras
router.post('/projects/:id/notes', upload.single('file'), addNote);
router.post('/projects/:id/links', addLink);
router.post('/projects/:id/documents', upload.single('file'), addDocument);
router.delete('/projects/:id/documents/:docId', deleteDocument);
router.delete('/projects/:id/notes/:noteId', deleteNote);
router.get('/proxy-download', downloadProxy); // New proxy download route

export default router;

