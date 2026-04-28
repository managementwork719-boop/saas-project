import ActivityLog from '../models/ActivityLog.js';
import useragent from 'express-useragent';

const getDepartmentFromRole = (role) => {
  if (role.startsWith('sales-')) return 'Sales';
  if (role.startsWith('project-')) return 'Project';
  if (role.startsWith('accounts-')) return 'Accounts';
  if (['admin', 'super-admin'].includes(role)) return 'Management';
  return 'Other';
};

export const createActivityLog = async (req, { action, module, description, status = 'success' }) => {
  try {
    const user = req.user;
    if (!user) return;

    const ua = useragent.parse(req.headers['user-agent']);
    
    const logData = {
      user: user._id,
      userName: user.name,
      role: user.role,
      department: getDepartmentFromRole(user.role),
      action,
      module,
      description,
      companyId: user.companyId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      browser: `${ua.browser} ${ua.version}`,
      device: ua.isMobile ? 'Mobile' : ua.isTablet ? 'Tablet' : 'Desktop',
      status
    };

    await ActivityLog.create(logData);
  } catch (err) {
    console.error('Failed to create activity log:', err.message);
  }
};
