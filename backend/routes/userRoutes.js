import express from 'express';
import { getAllUsersByCompany, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import upload from '../utils/upload.js';

const router = express.Router();

// All routes after this are protected
router.use(protect);

router.get('/company-users', getAllUsersByCompany);

// Admin and Managers can manage company users
router.post('/', restrictTo('admin', 'sales-manager', 'project-manager', 'super-admin'), upload.single('profilePic'), createUser);
router.patch('/:id', restrictTo('admin', 'sales-manager', 'project-manager', 'super-admin'), upload.single('profilePic'), updateUser);
router.delete('/:id', restrictTo('admin', 'sales-manager', 'project-manager', 'super-admin'), deleteUser);

export default router;
