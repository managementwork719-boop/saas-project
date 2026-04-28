import PlatformSettings from '../models/PlatformSettings.js';

export const getPlatformSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({
        themeColor: '#ea580c',
        platformName: 'Work Managment'
      });
    }
    res.status(200).json({
      status: 'success',
      data: { settings }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    const { themeColor, platformName } = req.body;
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings();
    }
    
    if (themeColor) settings.themeColor = themeColor;
    if (platformName) settings.platformName = platformName;
    settings.updatedAt = Date.now();
    
    await settings.save();
    
    res.status(200).json({
      status: 'success',
      data: { settings }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};
