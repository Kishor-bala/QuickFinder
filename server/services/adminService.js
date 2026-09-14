const userRepository = require('../repositories/userRepository');
const itemRepository = require('../repositories/itemRepository');
const matchRepository = require('../repositories/matchRepository');
const claimRepository = require('../repositories/claimRepository');
const { getFirebaseDb } = require('../config/firebaseAdmin');
const { BadRequestError, NotFoundError } = require('../utils/errors');

class AdminService {
  async getMetrics() {
    const totalUsers = await userRepository.count();
    const totalLostItems = await itemRepository.countLost();
    const totalFoundItems = await itemRepository.countFound();
    const successfulMatches = await matchRepository.countSuccessful();
    const claimedItems = await itemRepository.countClaimed();
    const pendingClaims = await claimRepository.countPending();

    return {
      totalUsers,
      totalLostItems,
      totalFoundItems,
      successfulMatches,
      claimedItems,
      pendingClaims,
    };
  }

  async getUsers() {
    return await userRepository.listAll();
  }

  async setUserStatus(userId, isActive, currentAdminId) {
    if (String(userId) === String(currentAdminId)) {
      throw new BadRequestError('Administrators cannot deactivate their own account.');
    }
    await userRepository.updateStatus(userId, isActive);
    await this.logAuditEvent('USER_STATUS_CHANGE', currentAdminId, { targetUserId: userId, isActive });
    return { message: `User status updated to ${isActive ? 'active' : 'disabled'}.` };
  }

  async getLostItems() {
    return await itemRepository.queryLost();
  }

  async getFoundItems() {
    return await itemRepository.queryFound();
  }

  async getClaimsAudit() {
    return await claimRepository.listAllForAdmin();
  }

  async deleteItem(type, id, adminId = 'system') {
    if (type === 'lost') {
      const item = await itemRepository.findLostById(id);
      if (!item) throw new NotFoundError('Lost item not found.');
      await itemRepository.deleteLost(id);
    } else if (type === 'found') {
      const item = await itemRepository.findFoundById(id);
      if (!item) throw new NotFoundError('Found item not found.');
      await itemRepository.deleteFound(id);
    } else {
      throw new BadRequestError('Invalid item type. Must be "lost" or "found".');
    }
    await this.logAuditEvent('ITEM_DELETED', adminId, { type, id });
    return { message: `${type === 'lost' ? 'Lost' : 'Found'} item listing deleted successfully.` };
  }

  async resolveItem(type, id, adminId = 'system') {
    if (type === 'lost') {
      const item = await itemRepository.findLostById(id);
      if (!item) throw new NotFoundError('Lost item not found.');
      await itemRepository.updateLost(id, { status: 'Closed' });
    } else if (type === 'found') {
      const item = await itemRepository.findFoundById(id);
      if (!item) throw new NotFoundError('Found item not found.');
      await itemRepository.updateFound(id, { status: 'Resolved' });
    } else {
      throw new BadRequestError('Invalid item type. Must be "lost" or "found".');
    }
    await this.logAuditEvent('ITEM_RESOLVED', adminId, { type, id });
    return { message: `${type === 'lost' ? 'Lost' : 'Found'} item marked as resolved.` };
  }

  // Campus Announcements
  async createAnnouncement(title, content, priority = 'normal', adminId = 'admin') {
    if (!title || !content) throw new BadRequestError('Title and content are required.');
    const db = getFirebaseDb();
    const id = `announcement_${Date.now()}`;
    const announcement = { id, title, content, priority, createdAt: new Date().toISOString(), createdBy: adminId };
    await db.ref(`announcements/${id}`).set(announcement);
    await this.logAuditEvent('ANNOUNCEMENT_CREATED', adminId, { id, title });
    return announcement;
  }

  async getAnnouncements() {
    try {
      const db = getFirebaseDb();
      const snap = await db.ref('announcements').once('value');
      const val = snap.val();
      return val ? Object.values(val).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
    } catch {
      return [];
    }
  }

  // Hotspot Analytics
  async getHotspotAnalytics() {
    const lost = await itemRepository.queryLost();
    const found = await itemRepository.queryFound();

    const locationCounts = {};
    const categoryCounts = {};

    [...lost, ...found].forEach(item => {
      const loc = item.building || item.lost_location || item.found_location || 'Campus Center';
      const cat = item.category || 'Others';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const topLocations = Object.entries(locationCounts).map(([location, count]) => ({ location, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    const topCategories = Object.entries(categoryCounts).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 6);

    return { topLocations, topCategories, totalAnalysed: lost.length + found.length };
  }

  // Audit Logging
  async logAuditEvent(action, actorId, details = {}) {
    try {
      const db = getFirebaseDb();
      const id = `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await db.ref(`auditLogs/${id}`).set({
        id,
        action,
        actorId,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('[Audit Log Error]:', e.message);
    }
  }

  async getAuditLogs() {
    try {
      const db = getFirebaseDb();
      const snap = await db.ref('auditLogs').once('value');
      const val = snap.val();
      return val ? Object.values(val).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50) : [];
    } catch {
      return [];
    }
  }
}

module.exports = new AdminService();
