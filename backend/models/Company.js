import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  industry: {
    type: String,
    trim: true,
  },
  website: String,
  logo: String,
  
  // Separate Branding Systems
  invoiceBranding: {
    name: String,
    industry: String,
    logo: String,
    signature: String,
    stamp: String,
    address: String,
    phone: String,
    email: String,
    website: String,
    labels: {
        invoiceHeading: { type: String, default: 'INVOICE' },
        billTo: { type: String, default: 'INVOICE TO' },
        fromLabel: { type: String, default: 'FROM OFFICE' },
        termsLabel: { type: String, default: 'Terms & Condition' },
        bankInfoLabel: { type: String, default: 'PAYMENT INFORMATION' },
        termsText: String
    }
  },
  quotationBranding: {
    name: String,
    industry: String,
    logo: String,
    signature: String,
    stamp: String,
    address: String,
    phone: String,
    email: String,
    website: String,
    labels: {
        quotationHeading: { type: String, default: 'QUOTATION' },
        billTo: { type: String, default: 'INVOICE TO' },
        fromLabel: { type: String, default: 'FROM OFFICE' },
        termsLabel: { type: String, default: 'Terms & Condition' },
        bankInfoLabel: { type: String, default: 'PAYMENT INFORMATION' },
        termsText: String
    }
  },

  themeColor: {
    type: String,
    default: '#ea580c',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  smtpConfig: {
    host: String,
    port: Number,
    user: String,
    pass: {
      type: String,
      select: false,
    },
    senderName: String,
    senderEmail: String,
  },
});

const Company = mongoose.model('Company', companySchema);
export default Company;
