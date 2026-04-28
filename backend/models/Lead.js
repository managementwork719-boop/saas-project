  import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  leadId: {
    type: String,
    required: [true, 'Lead must have an ID (Excel ID)'],
  },
  name: {
    type: String,
    required: [true, 'Lead must have a name'],
  },
  phone: String,
  source: String,
  campaign: String,
  requirement: String,
  budget: {
    type: Number,
    default: 0,
  },
  location: String,
  address: String,
  email: String,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal',
  },
  workType: String,
  nextFollowUp: Date,
  convertedBy: String,
  totalAmount: {
    type: Number,
    default: 0,
  },
  advanceAmount: {
    type: Number,
    default: 0,
  },
  pendingAmount: {
    type: Number,
    default: 0,
  },
  remarks: String,
  assignedTo: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'received', 'partial'],
    default: 'pending',
  },
  deliveryStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started',
  },
  deadline: Date,
  status: {
    type: String,
    enum: ['origin', 'follow-up', 'converted', 'not-converted'],
    default: 'origin',
  },
  companyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: [true, 'Lead must belong to a company'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  month: {
    type: String, // format YYYY-MM
    required: true,
  },
  clientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
  },
  conversationLogs: [{
    note: String,
    author: String,
    timestamp: {
      type: Date,
      default: Date.now,
    }
  }],
  paymentHistory: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'], default: 'Cash' },
    note: String,
    receivedBy: String
  }]
}, {
  timestamps: true,
});

// Compound index to prevent duplicate Lead IDs within the same company
leadSchema.index({ leadId: 1, companyId: 1 }, { unique: true });
// Compound index for optimizing the main dashboard and monthly overview aggregations (CRITICAL for performance)
leadSchema.index({ companyId: 1, month: 1, status: 1, createdAt: -1 });
leadSchema.index({ companyId: 1, status: 1, createdAt: -1 });
leadSchema.index({ companyId: 1, month: 1, convertedBy: 1, createdAt: -1 });
leadSchema.index({ companyId: 1, month: 1, campaign: 1, status: 1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
