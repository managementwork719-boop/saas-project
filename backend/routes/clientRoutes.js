import express from 'express';
import { getAllClients, getClientProfile, updateClient, syncClients, deleteClient } from '../controllers/clientController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/all', getAllClients);
router.post('/sync', syncClients);
router.get('/profile/:id', getClientProfile);
router.patch('/:id', updateClient);

export default router;
