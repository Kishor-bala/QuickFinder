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
    const result = await adminService.deleteItem(type, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.resolveItem = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const result = await adminService.resolveItem(type, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
