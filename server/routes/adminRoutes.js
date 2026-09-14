const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

router.use(verifyToken, requireAdmin);

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.setUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/reset-password', adminController.sendPasswordResetLink);
router.get('/lost-items', adminController.getLostItems);
router.get('/found-items', adminController.getFoundItems);
router.get('/claims', adminController.getClaims);
router.delete('/items/:type/:id', adminController.deleteItem);
router.put('/items/:type/:id/resolve', adminController.resolveItem);

// Match Center Routes
router.get('/match-center', adminController.getMatchCenter);
router.post('/matches/:id/review', adminController.reviewMatch);

// New Analytics, Announcements & Audit Routes
router.get('/analytics', adminController.getAnalytics);
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;

