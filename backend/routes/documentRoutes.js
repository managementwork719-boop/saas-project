import express from 'express';
import { 
    createInvoice, getInvoices, updateInvoice, deleteInvoice,
    createQuotation, getQuotations, updateQuotation, deleteQuotation 
} from '../controllers/documentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Shared by Admin, Managers and Accounts Team
router.use(restrictTo('super-admin', 'admin', 'accounts-manager', 'accounts-team'));

// Invoices
router.route('/invoices')
    .get(getInvoices)
    .post(createInvoice);
router.route('/invoices/:id')
    .patch(updateInvoice)
    .delete(restrictTo('super-admin', 'admin', 'accounts-manager'), deleteInvoice);

// Quotations
router.route('/quotations')
    .get(getQuotations)
    .post(createQuotation);
router.route('/quotations/:id')
    .patch(updateQuotation)
    .delete(restrictTo('super-admin', 'admin', 'accounts-manager'), deleteQuotation);

export default router;
