const claimRepository = require('../repositories/claimRepository');
const itemRepository = require('../repositories/itemRepository');
const matchRepository = require('../repositories/matchRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { getFirebaseDb } = require('../config/firebaseAdmin');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');

class ClaimService {
  async submitClaim({ found_item_id, claimant_id, message, proof_image, match_id = null }) {
    if (!found_item_id || !message) {
      throw new BadRequestError('Found item ID and claim description/proof are required.');
    }

    const foundItem = await itemRepository.findFoundById(found_item_id);
    if (!foundItem) {
      throw new NotFoundError('Found item not found.');
    }

    if (String(foundItem.user_id) === String(claimant_id)) {
      throw new BadRequestError('You cannot claim an item you uploaded yourself.');
    }

    if (foundItem.status === 'Claimed' || foundItem.status === 'Resolved') {
      throw new BadRequestError('This item has already been claimed or resolved.');
    }

    const existingPending = await claimRepository.findExistingPending(found_item_id, claimant_id);
    if (existingPending) {
      throw new BadRequestError('You already have a pending claim for this item. Please wait for the finder to review it.');
    }

    const claim = await claimRepository.create({
      found_item_id,
      claimant_id,
      message,
      proof_image,
      match_id,
    });

    await itemRepository.updateFound(found_item_id, { status: 'Claim Requested' });

    // Notify finder
    await notificationRepository.create({
      user_id: foundItem.user_id,
      title: 'New Ownership Claim Received!',
      message: `Someone submitted an ownership claim for your found item "${foundItem.item_name}". Please review their verification proof.`,
      type: 'claim',
      reference_id: claim.id,
      reference_type: 'claim',
    });

    // Notify claimant
    await notificationRepository.create({
      user_id: claimant_id,
      title: 'Claim Submitted Successfully',
      message: `Your claim for "${foundItem.item_name}" has been forwarded to the finder. You will be notified once reviewed.`,
      type: 'claim',
      reference_id: claim.id,
      reference_type: 'claim',
    });

    return claim;
  }

  async respondToClaim(claimId, userId, action) {
    if (!action || !['accept', 'reject'].includes(action.toLowerCase())) {
      throw new BadRequestError('Valid action ("accept" or "reject") is required.');
    }

    const claim = await claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundError('Claim request not found.');
    }

    if (String(claim.finder_id) !== String(userId)) {
      throw new ForbiddenError('You can only respond to claims on items that you found and uploaded.');
    }

    if (claim.status !== 'Pending') {
      throw new BadRequestError(`This claim has already been ${claim.status.toLowerCase()}.`);
    }

    const isAccepted = action.toLowerCase() === 'accept';

    if (isAccepted) {
      await claimRepository.updateStatus(claim.id, 'Accepted');
      await itemRepository.updateFound(claim.found_item_id, { status: 'Claimed' });

      // If tied to a match, mark match as accepted and lost item as Claimed
      if (claim.match_id) {
        const match = await matchRepository.findById(claim.match_id);
        if (match) {
          await matchRepository.dismissMatch(claim.match_id);
          await itemRepository.updateLost(match.lost_item_id, { status: 'Claimed' });
        }
      }

      // Reject other pending claims for this found item
      const firebaseDb = getFirebaseDb();
      const claimsSnap = await firebaseDb.ref('claims').once('value');
      const claimsVal = claimsSnap.val() || {};
      for (const [id, c] of Object.entries(claimsVal)) {
        if (String(c.found_item_id) === String(claim.found_item_id) && String(c.id) !== String(claim.id) && c.status === 'Pending') {
          await firebaseDb.ref(`claims/${id}`).update({ status: 'Rejected' });
        }
      }

      // Notify claimant: unlock contact info
      await notificationRepository.create({
        user_id: claim.claimant_id,
        title: `Claim ACCEPTED: "${claim.item_name}"!`,
        message: `Your ownership claim has been accepted by the finder! Contact information is now unlocked on the item page for reconnection.`,
        type: 'claim_accepted',
        reference_id: claim.id,
        reference_type: 'claim',
      });

      // Confirmation notification to finder
      await notificationRepository.create({
        user_id: claim.finder_id,
        title: `Claim Accepted for "${claim.item_name}"`,
        message: `You accepted ${claim.claimant_name}'s claim. Your contact info is now visible to them to coordinate retrieval.`,
        type: 'claim_accepted',
        reference_id: claim.id,
        reference_type: 'claim',
      });

      return {
        message: 'Claim accepted successfully. The claimant has been notified and contact information unlocked.',
        claimStatus: 'Accepted',
        itemStatus: 'Claimed',
      };
    } else {
      await claimRepository.updateStatus(claim.id, 'Rejected');

      const firebaseDb = getFirebaseDb();
      const claimsSnap = await firebaseDb.ref('claims').once('value');
      const claimsVal = claimsSnap.val() || {};
      const pendingRemaining = Object.values(claimsVal).filter(
        (c) => String(c.found_item_id) === String(claim.found_item_id) && c.status === 'Pending'
      );

      if (pendingRemaining.length === 0) {
        await itemRepository.updateFound(claim.found_item_id, { status: 'Available' });
      }

      await notificationRepository.create({
        user_id: claim.claimant_id,
        title: `Claim Update: "${claim.item_name}"`,
        message: `Your ownership claim for "${claim.item_name}" was not approved by the uploader.`,
        type: 'claim_rejected',
        reference_id: claim.id,
        reference_type: 'claim',
      });

      return {
        message: 'Claim rejected.',
        claimStatus: 'Rejected',
      };
    }
  }

  async getClaims(userId, type = 'all') {
    if (type === 'received') {
      return await claimRepository.findByUserReceived(userId);
    } else if (type === 'sent') {
      return await claimRepository.findByUserSent(userId);
    } else {
      const received = await claimRepository.findByUserReceived(userId);
      const sent = await claimRepository.findByUserSent(userId);
      return { received, sent };
    }
  }
}

module.exports = new ClaimService();
