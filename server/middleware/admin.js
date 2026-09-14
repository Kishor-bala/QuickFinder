const { SUPER_ADMIN_EMAILS } = require('../shared/constants');

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const userEmail = (req.user.email || '').toLowerCase().trim();
  const isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(userEmail);
  const isAdminRole = req.user.role === 'admin';

  if (!isAdminRole && !isSuperAdminEmail) {
    return res.status(403).json({ message: 'Access forbidden. Administrator privileges required.' });
  }

  req.user.isSuperAdmin = true;
  next();
};

module.exports = {
  requireAdmin,
};
