import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['super-admin', 'admin', 'sales-manager', 'sales-team', 'accounts-manager', 'accounts-team', 'project-manager', 'project-team'],
    default: 'project-team',
  },
  designation: {
    type: String,
    trim: true,
    default: 'Team Member',
  },
  department: {
    type: String,
    trim: true,
    default: 'Operations',
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required'],
  },
  profilePic: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1622551100/sample.jpg',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  mustChangePassword: {
    type: Boolean,
    default: false, // Normal login doesn't require change by default
  },
});



// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
export default User;
