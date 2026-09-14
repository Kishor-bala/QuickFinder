const crypto = require('crypto');
const { getFirebaseDb } = require('../config/firebaseAdmin');
const itemRepository = require('../repositories/itemRepository');
const claimRepository = require('../repositories/claimRepository');
const notificationRepository = require('../repositories/notificationRepository');
const auditService = require('./auditService');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');

class HandoverService {
  getDefaultLocations() {
    return [
      { id: 'loc_main', name: 'Main Administrative Block', building: 'Main Block', category: 'Office' },
      { id: 'loc_cse', name: 'CSE Department Office', building: 'CSE Block', category: 'Department' },
      { id: 'loc_library', name: 'Central Library Helpdesk', building: 'Library', category: 'Library' },
      { id: 'loc_security', name: 'Main Gate Campus Security', building: 'Security Office', category: 'Security' },
      { id: 'loc_hostel', name: 'Hostel Office', building: 'Hostel Block', category: 'Hostel' },
      { id: 'loc_sports', name: 'Sports Complex Office', building: 'Sports Ground', category: 'Sports' },
      { id: 'loc_lf_office', name: 'Central Lost & Found Office', building: 'Student Center', category: 'Lost & Found' },
    ];
  }

  async getLocations() {
    try {
      const db = getFirebaseDb();
      const snap = await db.ref('locations').once('value');
      const val = snap.val();
      if (!val) return this.getDefaultLocations();
      return Object.values(val);
    } catch {
      return this.getDefaultLocations();
    }
  }

  /**
   * Generate a cryptographically random short-lived handover QR token.
   * Does NOT encode sensitive user/phone data into QR payload.
   */
  async createHandoverToken({ claimId, userId }) {
    if (!claimId) throw new BadRequestError('Claim ID is required to generate handover QR code.');
    
    const claim = await claimRepository.findById(claimId);
    if (!claim) throw new NotFoundError('Claim not found.');

    const isClaimant = String(claim.claimant_id) === String(userId);
    const isFinder = String(claim.finder_id) === String(userId);
    if (!isClaimant && !isFinder) {
      throw new ForbiddenError('You are not authorized to generate a handover token for this claim.');
    }

    const token = 'sec_tok_' + crypto.randomBytes(16).toString('hex');
    const handoverId = `handover_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

    const handoverRecord = {
      id: handoverId,
      claimId: String(claimId),
      itemId: String(claim.found_item_id),
      fromUserId: String(claim.finder_id),
      toUserId: String(claim.claimant_id),
      token,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    const db = getFirebaseDb();
    await db.ref(`handovers/${handoverId}`).set(handoverRecord);

    await auditService.recordEvent({
      actorId: userId,
      actorRole: 'STUDENT',
      action: 'HANDOVER_CREATED',
      targetType: 'HANDOVER',
      targetId: handoverId,
      itemId: claim.found_item_id,
      claimId,
      metadata: { expiresAt }
    });

    return {
      handoverId,
      token,
      expiresAt,
      // QR Payload contains ONLY secure handover ID and random token
      qrPayload: JSON.stringify({ handoverId, token }),
    };
  }

  /**
   * Backend Verification of Handover QR Token
   */
  async verifyHandoverToken({ handoverId, token, verifyingUserId }) {
    if (!handoverId || !token) {
      throw new BadRequestError('Handover ID and verification token are required.');
    }

    const db = getFirebaseDb();
    const snap = await db.ref(`handovers/${handoverId}`).once('value');
    const handover = snap.val();

    if (!handover) throw new NotFoundError('Handover record not found.');
    if (handover.token !== token) throw new BadRequestError('Invalid or counterfeit handover QR token.');
    if (handover.status === 'COMPLETED') throw new BadRequestError('This handover QR code has already been used.');
    if (new Date() > new Date(handover.expiresAt)) throw new BadRequestError('Handover QR token has expired. Please refresh QR code.');

    // Invalidate token atomically
    await db.ref(`handovers/${handoverId}`).update({
      status: 'COMPLETED',
      verifiedBy: String(verifyingUserId),
      completedAt: new Date().toISOString()
    });

    // Update claim status to completed
    await claimRepository.updateStatus(handover.claimId, 'completed');
    await itemRepository.updateFound(handover.itemId, { status: 'Returned' });

    await auditService.recordEvent({
      actorId: verifyingUserId,
      actorRole: 'STUDENT',
      action: 'HANDOVER_COMPLETED',
      targetType: 'HANDOVER',
      targetId: handoverId,
      itemId: handover.itemId,
      claimId: handover.claimId,
      metadata: { verifiedBy: verifyingUserId }
    });

    await notificationRepository.create({
      user_id: handover.toUserId,
      title: '🎉 Item Handover Confirmed via QR!',
      message: 'Your item recovery was verified and completed using secure QR code!',
      type: 'item_returned',
      reference_id: handover.claimId,
      reference_type: 'claim'
    });

    return { success: true, message: 'Handover verified and recovery completed successfully! 🎉' };
  }
}

module.exports = new HandoverService();
