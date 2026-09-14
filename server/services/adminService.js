const userRepository = require('../repositories/userRepository');
const itemRepository = require('../repositories/itemRepository');
const matchRepository = require('../repositories/matchRepository');
const claimRepository = require('../repositories/claimRepository');
const auditService = require('./auditService');
const { getFirebaseDb, getFirebaseAuth } = require('../config/firebaseAdmin');
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
    await auditService.recordEvent({
      actorId: currentAdminId,
      actorRole: 'ADMIN',
      action: 'USER_STATUS_CHANGE',
      targetType: 'USER',
      targetId: userId,
      metadata: { isActive }
    });
    return { message: `User status updated to ${isActive ? 'active' : 'disabled'}.` };
  }

  async updateUserRole(userId, newRole, currentAdminId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found.');
    const db = getFirebaseDb();
    await db.ref(`users/${userId}`).update({ role: newRole, updatedAt: new Date().toISOString() });
    await auditService.recordEvent({
      actorId: currentAdminId,
      actorRole: 'ADMIN',
      action: 'USER_ROLE_CHANGED',
      targetType: 'USER',
      targetId: userId,
      metadata: { oldRole: user.role, newRole }
    });
    return { message: `User role updated to ${newRole}.` };
  }

  async deleteUser(userId, currentAdminId) {
    if (String(userId) === String(currentAdminId)) {
      throw new BadRequestError('Administrators cannot delete their own account.');
    }
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found.');
    await userRepository.delete(userId);
    await auditService.recordEvent({
      actorId: currentAdminId,
      actorRole: 'ADMIN',
      action: 'USER_DELETED',
      targetType: 'USER',
      targetId: userId,
      metadata: { userEmail: user.email }
    });
    return { message: `User ${user.name} (${user.email}) deleted successfully.` };
  }

  async sendPasswordResetLink(userId, currentAdminId) {
    const user = await userRepository.findById(userId);
    if (!user || !user.email) throw new NotFoundError('User email not found.');
    const auth = getFirebaseAuth();
    if (!auth) throw new BadRequestError('Firebase Auth is unavailable.');

    const resetLink = await auth.generatePasswordResetLink(user.email);
    await auditService.recordEvent({
      actorId: currentAdminId,
      actorRole: 'ADMIN',
      action: 'PASSWORD_RESET_DISPATCHED',
      targetType: 'USER',
      targetId: userId,
      metadata: { userEmail: user.email }
    });

    return {
      success: true,
      message: `Password reset link generated for ${user.email}.`,
      resetLink,
    };
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
    await auditService.recordEvent({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ITEM_DELETED',
      targetType: 'ITEM',
      targetId: id,
      metadata: { type, id }
    });
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
    await auditService.recordEvent({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ITEM_RESOLVED',
      targetType: 'ITEM',
      targetId: id,
      metadata: { type, id }
    });
    return { message: `${type === 'lost' ? 'Lost' : 'Found'} item marked as resolved.` };
  }

  // Admin Match Center
  async getMatchCenter() {
    const rawMatches = await matchRepository.queryAll();
    const lostItems = await itemRepository.queryLost();
    const foundItems = await itemRepository.queryFound();

    const matches = rawMatches.map((m) => {
      const lost = lostItems.find((l) => String(l.id) === String(m.lost_item_id));
      const found = foundItems.find((f) => String(f.id) === String(m.found_item_id));
      const score = m.match_score || m.score || 0;
      let confidenceLevel = 'LOW';
      if (score >= 85) confidenceLevel = 'VERY_HIGH';
      else if (score >= 70) confidenceLevel = 'HIGH';
      else if (score >= 50) confidenceLevel = 'MEDIUM';

      return {
        ...m,
        score,
        confidenceLevel,
        lostItem: lost || null,
        foundItem: found || null,
      };
    });

    return matches.sort((a, b) => b.score - a.score);
  }

  async reviewMatch(matchId, action, adminId = 'admin') {
    const match = await matchRepository.findById(matchId);
    if (!match) throw new NotFoundError('Match listing not found.');

    const act = action.toLowerCase();
    const db = getFirebaseDb();

    if (act === 'confirm') {
      await matchRepository.updateMatchStatus(matchId, 'Confirmed');
      await auditService.recordEvent({
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'MATCH_CONFIRMED',
        targetType: 'MATCH',
        targetId: matchId,
        metadata: { lostItemId: match.lost_item_id, foundItemId: match.found_item_id }
      });
      return { message: 'Match confirmed by administrator.' };
    } else if (act === 'dismiss') {
      await matchRepository.dismissMatch(matchId);
      await auditService.recordEvent({
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'MATCH_DISMISSED',
        targetType: 'MATCH',
        targetId: matchId,
        metadata: { lostItemId: match.lost_item_id, foundItemId: match.found_item_id }
      });
      return { message: 'Match dismissed.' };
    } else {
      throw new BadRequestError('Invalid action. Must be "confirm" or "dismiss".');
    }
  }

  // Campus Announcements
  async createAnnouncement(title, content, priority = 'normal', adminId = 'admin') {
    if (!title || !content) throw new BadRequestError('Title and content are required.');
    const db = getFirebaseDb();
    const id = `announcement_${Date.now()}`;
    const announcement = { id, title, content, priority, createdAt: new Date().toISOString(), createdBy: adminId };
    await db.ref(`announcements/${id}`).set(announcement);
    await auditService.recordEvent({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ANNOUNCEMENT_CREATED',
      targetType: 'ANNOUNCEMENT',
      targetId: id,
      metadata: { title }
    });
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

  async getAuditLogs() {
    return await auditService.getAdminAuditLogs();
  }
}

module.exports = new AdminService();
