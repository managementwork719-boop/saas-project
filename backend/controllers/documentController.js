import Invoice from '../models/Invoice.js';
import Quotation from '../models/Quotation.js';
import { createActivityLog } from '../utils/logger.js';

// Helper to generate next document number
const getNextNumber = async (model, companyId, prefix) => {
    const lastDoc = await model.findOne({ companyId }).sort({ createdAt: -1 });
    let count = 1;
    if (lastDoc) {
        // Extract number from string like "INV-001" -> 1
        const numPart = lastDoc.invoiceNumber || lastDoc.quotationNumber;
        const match = numPart.match(/\d+$/);
        if (match) {
            count = parseInt(match[0]) + 1;
        }
    }
    return `${prefix}-${count.toString().padStart(3, '0')}`;
};

// --- INVOICES ---

export const createInvoice = async (req, res) => {
    try {
        const invoiceNumber = await getNextNumber(Invoice, req.user.companyId, 'INV');
        
        const newInvoice = await Invoice.create({
            ...req.body,
            invoiceNumber,
            createdBy: req.user._id,
            creatorName: req.user.name,
            companyId: req.user.companyId
        });

        res.status(210).json({
            status: 'success',
            data: { invoice: newInvoice }
        });

        createActivityLog(req, {
            action: 'Create Invoice',
            module: 'Billing',
            description: `Generated new invoice: ${newInvoice.invoiceNumber}`
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

export const getInvoices = async (req, res) => {
    try {
        let query = { companyId: req.user.companyId };
        
        // Sales Team can only see their own
        if (req.user.role === 'sales-team') {
            query.createdBy = req.user._id;
        }

        const invoices = await Invoice.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: invoices.length,
            data: { invoices }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

export const updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            companyId: req.user.companyId,
            ...(req.user.role === 'sales-team' && { createdBy: req.user._id })
        });

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // If ALREADY finalized, block any changes
        if (invoice.isFinalized) {
            return res.status(403).json({ 
                status: 'fail', 
                message: 'Finalized invoices cannot be modified.' 
            });
        }

        // Apply updates
        Object.keys(req.body).forEach(key => {
            invoice[key] = req.body[key];
        });

        await invoice.save();

        res.status(200).json({
            status: 'success',
            data: { invoice }
        });

        createActivityLog(req, {
            action: 'Update Invoice',
            module: 'Billing',
            description: `Updated invoice details for ${invoice.invoiceNumber}`
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId,
            // Only creator or admin can delete
            ...(req.user.role === 'sales-team' && { createdBy: req.user._id })
        });

        if (!invoice) return res.status(404).json({ message: 'Invoice not found or unauthorized' });

        res.status(204).json({ status: 'success', data: null });

        createActivityLog(req, {
            action: 'Delete Invoice',
            module: 'Billing',
            description: `Deleted invoice: ${invoice.invoiceNumber}`
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// --- QUOTATIONS ---

export const createQuotation = async (req, res) => {
    try {
        const quotationNumber = await getNextNumber(Quotation, req.user.companyId, 'QT');
        
        const newQuotation = await Quotation.create({
            ...req.body,
            quotationNumber,
            createdBy: req.user._id,
            creatorName: req.user.name,
            companyId: req.user.companyId
        });

        res.status(201).json({
            status: 'success',
            data: { quotation: newQuotation }
        });

        createActivityLog(req, {
            action: 'Create Quotation',
            module: 'Billing',
            description: `Generated new quotation: ${newQuotation.quotationNumber}`
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

export const getQuotations = async (req, res) => {
    try {
        let query = { companyId: req.user.companyId };
        
        if (req.user.role === 'sales-team') {
            query.createdBy = req.user._id;
        }

        const quotations = await Quotation.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: quotations.length,
            data: { quotations }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

export const updateQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findOne({
            _id: req.params.id,
            companyId: req.user.companyId,
            ...(req.user.role === 'sales-team' && { createdBy: req.user._id })
        });

        if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

        if (quotation.isFinalized) {
            return res.status(403).json({ 
                status: 'fail', 
                message: 'Finalized quotations cannot be modified.' 
            });
        }

        Object.keys(req.body).forEach(key => {
            quotation[key] = req.body[key];
        });

        await quotation.save();

        res.status(200).json({
            status: 'success',
            data: { quotation }
        });

        createActivityLog(req, {
            action: 'Update Quotation',
            module: 'Billing',
            description: `Updated quotation details for ${quotation.quotationNumber}`
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

export const deleteQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId,
            ...(req.user.role === 'sales-team' && { createdBy: req.user._id })
        });

        if (!quotation) return res.status(404).json({ message: 'Quotation not found or unauthorized' });

        res.status(204).json({ status: 'success', data: null });

        createActivityLog(req, {
            action: 'Delete Quotation',
            module: 'Billing',
            description: `Deleted quotation: ${quotation.quotationNumber}`
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
