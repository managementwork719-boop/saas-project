import express from 'express';
import { updateMyCompany, getMyCompany, updateSmtpSettings, testSmtpSettings } from '../controllers/companyController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { cacheMiddleware } from '../utils/cache.js';

const router = express.Router();

// All company routes are protected
router.use(protect);

// Get/Update my company settings (Admins and Super Admins)
router.get('/my-company', cacheMiddleware(3600), getMyCompany);
router.patch('/my-company', restrictTo('admin', 'super-admin', 'sales-manager', 'sales-team'), updateMyCompany);
router.patch('/my-company/smtp', restrictTo('admin', 'super-admin', 'sales-manager'), updateSmtpSettings);
router.post('/my-company/test-smtp', restrictTo('admin', 'super-admin'), testSmtpSettings);

export default router;
