import express from 'express';
import { getActivityLogs, getLogInsights, exportLogs } from '../controllers/activityLogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getActivityLogs);
router.get('/insights', getLogInsights);
router.get('/export', exportLogs);

export default router;
