const adminService = require('../services/adminService');

exports.getMetrics = async (req, res, next) => {
  try {
    const metrics = await adminService.getMetrics();
    res.status(200).json({ metrics });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await adminService.getUsers();
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
};

exports.setUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { is_active } = req.body;
    const result = await adminService.setUserStatus(userId, is_active, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    const result = await adminService.updateUserRole(userId, role, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const result = await adminService.deleteUser(userId, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.sendPasswordResetLink = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const result = await adminService.sendPasswordResetLink(userId, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getLostItems = async (req, res, next) => {
  try {
    const items = await adminService.getLostItems();
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
};

exports.getFoundItems = async (req, res, next) => {
  try {
    const items = await adminService.getFoundItems();
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
};

exports.getClaims = async (req, res, next) => {
  try {
    const claims = await adminService.getClaimsAudit();
    res.status(200).json({ claims });
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const result = await adminService.deleteItem(type, id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.resolveItem = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const result = await adminService.resolveItem(type, id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getMatchCenter = async (req, res, next) => {
  try {
    const matches = await adminService.getMatchCenter();
    res.status(200).json({ matches });
  } catch (err) {
    next(err);
  }
};

exports.reviewMatch = async (req, res, next) => {
  try {
    const matchId = req.params.id;
    const { action } = req.body;
    const result = await adminService.reviewMatch(matchId, action, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getHotspotAnalytics();
    res.status(200).json({ analytics });
  } catch (err) {
    next(err);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority } = req.body;
    const announcement = await adminService.createAnnouncement(title, content, priority, req.user.id);
    res.status(201).json({ announcement });
  } catch (err) {
    next(err);
  }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await adminService.getAnnouncements();
    res.status(200).json({ announcements });
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await adminService.getAuditLogs();
    res.status(200).json({ logs });
  } catch (err) {
    next(err);
  }
};
