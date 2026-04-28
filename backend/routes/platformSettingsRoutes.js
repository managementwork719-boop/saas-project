import express from 'express';
import { getPlatformSettings, updatePlatformSettings } from '../controllers/platformSettingsController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get settings - Publicly accessible for theme loading
router.get('/', getPlatformSettings);

// Update settings - Restricted to Super Admin
router.patch('/', protect, restrictTo('super-admin'), updatePlatformSettings);

export default router;
