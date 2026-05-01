import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  day: { type: String },
  color: { type: String, default: 'bg-violet-500' }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  client: { type: String, required: true, trim: true },
  key: { type: String, trim: true },
  type: { type: String },
  category: { type: String, default: 'Development' },
  description: { type: String, default: '' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  riskStatus: {
    type: String,
    enum: ['on-track', 'at-risk', 'delayed'],
    default: 'on-track',
  },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managerName: { type: String, default: '' },
  startDate: { type: Date },
  deadline: { type: Date },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  budgetStatus: {
    type: String,
    enum: ['on-budget', 'over-budget', 'at-risk'],
    default: 'on-budget',
  },
  budget: { type: Number, default: 0 },
  budgetUsed: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  visibility: { type: String, enum: ['visible', 'managers-only'], default: 'visible' },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold', 'cancelled'],
    default: 'active',
  },
  tags: [{ type: String }],
  milestones: [milestoneSchema],
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

projectSchema.index({ companyId: 1, status: 1 });
projectSchema.index({ companyId: 1, deadline: 1 });
projectSchema.index({ companyId: 1, riskStatus: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
