import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice must have a number'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
  },
  clientAddress: String,
  clientPhone: String,
  clientEmail: String,
  items: [{
    description: String,
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }],
  subtotal: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  isFinalized: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  creatorName: String,
  companyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true,
  },
  docBranding: {
    logo: String,
    companyName: String,
    companyAddress: String,
    companyPhone: String,
    companyEmail: String,
    website: String,
    accountManager: String,
    industry: String,
    signature: String,
    stamp: String,
    labels: {
      invoiceHeading: { type: String, default: 'INVOICE' },
      billTo: { type: String, default: 'INVOICE TO' },
      fromLabel: { type: String, default: 'FROM OFFICE' },
      termsLabel: { type: String, default: 'Terms & Condition' },
      bankInfoLabel: { type: String, default: 'PAYMENT INFORMATION' }
    }
  }
}, {
  timestamps: true,
});

// Index for auto-numbering lookups
invoiceSchema.index({ companyId: 1, invoiceNumber: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
