import express from 'express';
import { login, logout, getMe, setupPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/setup-password', setupPassword);
router.get('/logout', logout);
router.get('/getMe', protect, getMe);

export default router;
