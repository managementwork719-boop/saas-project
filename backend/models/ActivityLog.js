import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  ipAddress: String,
  browser: String,
  device: String,
  status: {
    type: String,
    enum: ['success', 'fail'],
    default: 'success'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 10368000 // Automatically delete logs after 120 days (approx 4 months)
  }
});

// Index for better query performance
activityLogSchema.index({ companyId: 1, timestamp: -1 });
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ department: 1, timestamp: -1 });
activityLogSchema.index({ module: 1, timestamp: -1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ userName: 'text', action: 'text', description: 'text' }); // For text search optimization

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
