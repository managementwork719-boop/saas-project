import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client must have a name'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Client must have a phone number'],
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  companyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: [true, 'Client must belong to a company'],
  },
  totalWorks: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Unique phone per company
clientSchema.index({ phone: 1, companyId: 1 }, { unique: true });

const Client = mongoose.model('Client', clientSchema);

export default Client;
