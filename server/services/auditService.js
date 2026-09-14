const { getFirebaseDb } = require('../config/firebaseAdmin');

class AuditService {
  /**
   * Record a system audit event stored in `audit_logs/{eventId}`
   */
  async recordEvent({
    actorId = 'system',
    actorRole = 'USER',
    action,
    targetType,
    targetId,
    itemId = null,
    claimId = null,
    metadata = {}
  }) {
    if (!action || !targetType || !targetId) {
      console.warn('[AuditService] Skipping invalid audit event: missing action/target');
      return null;
    }

    try {
      const db = getFirebaseDb();
      const eventId = `audit_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const timestamp = new Date().toISOString();

      const event = {
        id: eventId,
        actorId: String(actorId),
        actorRole,
        action,
        targetType,
        targetId: String(targetId),
        itemId: itemId ? String(itemId) : null,
        claimId: claimId ? String(claimId) : null,
        metadata,
        timestamp
      };

      await db.ref(`audit_logs/${eventId}`).set(event);
      return event;
    } catch (err) {
      console.error('[AuditService Error]:', err.message);
      return null;
    }
  }

  /**
   * Get dynamic chronological activity timeline for an item
   */
  async getItemTimeline(itemId) {
    if (!itemId) return [];
    try {
      const db = getFirebaseDb();
      const snap = await db.ref('audit_logs').once('value');
      const val = snap.val();
      if (!val) return [];

      const events = Object.values(val).filter(
        (e) => String(e.itemId) === String(itemId) || (e.targetType === 'ITEM' && String(e.targetId) === String(itemId))
      );

      return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (err) {
      console.error('[AuditService getItemTimeline Error]:', err.message);
      return [];
    }
  }

  /**
   * Get dynamic timeline for a claim
   */
  async getClaimTimeline(claimId) {
    if (!claimId) return [];
    try {
      const db = getFirebaseDb();
      const snap = await db.ref('audit_logs').once('value');
      const val = snap.val();
      if (!val) return [];

      const events = Object.values(val).filter(
        (e) => String(e.claimId) === String(claimId) || (e.targetType === 'CLAIM' && String(e.targetId) === String(claimId))
      );

      return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (err) {
      console.error('[AuditService getClaimTimeline Error]:', err.message);
      return [];
    }
  }

  /**
   * Get all administrative audit logs
   */
  async getAdminAuditLogs(limit = 100) {
    try {
      const db = getFirebaseDb();
      const snap = await db.ref('audit_logs').once('value');
      const val = snap.val();
      if (!val) return [];

      return Object.values(val)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (err) {
      console.error('[AuditService getAdminAuditLogs Error]:', err.message);
      return [];
    }
  }
}

module.exports = new AuditService();
