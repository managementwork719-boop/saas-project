import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['budget', 'leave', 'milestone', 'task'],
    required: true,
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedByName: { type: String, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  projectName: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  isUrgent: { type: Boolean, default: false },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String, default: '' },
  reviewedAt: { type: Date },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
}, { timestamps: true });

approvalSchema.index({ companyId: 1, status: 1 });
approvalSchema.index({ companyId: 1, createdAt: -1 });

const Approval = mongoose.model('Approval', approvalSchema);
export default Approval;
