import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema({
  themeColor: {
    type: String,
    default: '#ea580c', // Default orange-600
  },
  platformName: {
    type: String,
    default: 'Work Management',
  },
  logoUrl: {
    type: String,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
export default PlatformSettings;
