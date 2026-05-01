import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  projectName: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToName: { type: String, default: '' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal',
  },
  dueDate: { type: Date },
  completedAt: { type: Date },
  hoursLogged: { type: Number, default: 0 },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
}, { timestamps: true });

taskSchema.index({ companyId: 1, status: 1 });
taskSchema.index({ companyId: 1, assignedTo: 1 });
taskSchema.index({ companyId: 1, project: 1 });
taskSchema.index({ companyId: 1, dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
