const claimRepository = require('../repositories/claimRepository');
const itemRepository = require('../repositories/itemRepository');
const matchRepository = require('../repositories/matchRepository');
const notificationRepository = require('../repositories/notificationRepository');
const userRepository = require('../repositories/userRepository');
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

    if (foundItem.status === 'Claimed' || foundItem.status === 'Resolved' || foundItem.status === 'Returned') {
      throw new BadRequestError('This item has already been claimed or resolved.');
    }

    const existingPending = await claimRepository.findExistingPending(found_item_id, claimant_id);
    if (existingPending) {
      throw new BadRequestError('You already have an active claim for this item. Please wait for response.');
    }

    const claim = await claimRepository.create({
      found_item_id,
      claimant_id,
      message,
      proof_image,
      match_id,
      status: 'pending', // pending, verification_required, under_review, accepted, rejected, completed
    });

    await itemRepository.updateFound(found_item_id, { status: 'Claim Requested' });

    // Notify finder
    await notificationRepository.create({
      user_id: foundItem.user_id,
      title: 'New Ownership Claim Received!',
      message: `Someone submitted an ownership claim for your found item "${foundItem.item_name}". Please review their verification proof.`,
      type: 'claim_request',
      reference_id: claim.id,
      reference_type: 'claim',
    });

    // Notify claimant
    await notificationRepository.create({
      user_id: claimant_id,
      title: 'Claim Submitted Successfully',
      message: `Your claim for "${foundItem.item_name}" has been forwarded to the finder. You will be notified once reviewed.`,
      type: 'claim_request',
      reference_id: claim.id,
      reference_type: 'claim',
    });

    return claim;
  }

  async respondToClaim(claimId, userId, action, payload = {}) {
    const validActions = ['accept', 'reject', 'ask_verification', 'submit_answer', 'confirm_return'];
    if (!action || !validActions.includes(action.toLowerCase())) {
      throw new BadRequestError(`Valid action required (${validActions.join(', ')}).`);
    }

    const claim = await claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundError('Claim request not found.');
    }

    const act = action.toLowerCase();
    const firebaseDb = getFirebaseDb();

    // Action 1: Ask for verification questions
    if (act === 'ask_verification') {
      if (String(claim.finder_id) !== String(userId)) {
        throw new ForbiddenError('Only the finder or authorized staff can request verification proof.');
      }
      const questions = payload.questions || 'Please describe any private marks, serial number, or exact contents inside this item.';
      await firebaseDb.ref(`claims/${claimId}`).update({
        status: 'verification_required',
        verificationQuestions: questions,
        updatedAt: new Date().toISOString(),
      });

      await notificationRepository.create({
        user_id: claim.claimant_id,
        title: 'Action Required: Additional Verification Requested',
        message: `The finder of "${claim.item_name}" requested verification: "${questions}"`,
        type: 'verification_required',
        reference_id: claimId,
        reference_type: 'claim',
      });

      return { message: 'Verification question sent to claimant.', claimStatus: 'verification_required' };
    }

    // Action 2: Submit verification answer
    if (act === 'submit_answer') {
      if (String(claim.claimant_id) !== String(userId)) {
        throw new ForbiddenError('Only the claimant can submit verification answers.');
      }
      if (!payload.answer) {
        throw new BadRequestError('Verification answer text is required.');
      }
      await firebaseDb.ref(`claims/${claimId}`).update({
        status: 'under_review',
        verificationAnswer: payload.answer,
        updatedAt: new Date().toISOString(),
      });

      await notificationRepository.create({
        user_id: claim.finder_id,
        title: 'Verification Proof Provided!',
        message: `${claim.claimant_name} submitted verification answers for "${claim.item_name}".`,
        type: 'verification_submitted',
        reference_id: claimId,
        reference_type: 'claim',
      });

      return { message: 'Verification answer submitted successfully for review.', claimStatus: 'under_review' };
    }

    // Action 3: Accept Claim
    if (act === 'accept') {
      if (String(claim.finder_id) !== String(userId)) {
        throw new ForbiddenError('Only the finder can accept claims.');
      }
      await claimRepository.updateStatus(claim.id, 'accepted');
      await itemRepository.updateFound(claim.found_item_id, { status: 'handover_pending' });

      if (claim.match_id) {
        const match = await matchRepository.findById(claim.match_id);
        if (match) {
          await matchRepository.dismissMatch(claim.match_id);
          await itemRepository.updateLost(match.lost_item_id, { status: 'handover_pending' });
        }
      }

      await notificationRepository.create({
        user_id: claim.claimant_id,
        title: `Claim ACCEPTED for "${claim.item_name}"!`,
        message: `Your ownership claim was accepted! Contact details are unlocked. Please coordinate item retrieval and confirm return.`,
        type: 'claim_accepted',
        reference_id: claim.id,
        reference_type: 'claim',
      });

      return { message: 'Claim accepted. Contact info unlocked for item handover.', claimStatus: 'accepted' };
    }

    // Action 4: Reject Claim
    if (act === 'reject') {
      if (String(claim.finder_id) !== String(userId)) {
        throw new ForbiddenError('Only the finder can reject claims.');
      }
      await claimRepository.updateStatus(claim.id, 'rejected');
      await itemRepository.updateFound(claim.found_item_id, { status: 'Available' });

      await notificationRepository.create({
        user_id: claim.claimant_id,
        title: `Claim Rejected for "${claim.item_name}"`,
        message: `Your claim for "${claim.item_name}" was not approved by the finder.`,
        type: 'claim_rejected',
        reference_id: claim.id,
        reference_type: 'claim',
      });

      return { message: 'Claim rejected.', claimStatus: 'rejected' };
    }

    // Action 5: Confirm Return & Complete Recovery
    if (act === 'confirm_return') {
      const isClaimant = String(claim.claimant_id) === String(userId);
      const isFinder = String(claim.finder_id) === String(userId);

      if (!isClaimant && !isFinder) {
        throw new ForbiddenError('Only participants in this recovery can confirm return.');
      }

      const field = isClaimant ? 'claimantConfirmed' : 'finderConfirmed';
      const updates = { [field]: true, updatedAt: new Date().toISOString() };

      const currentSnap = await firebaseDb.ref(`claims/${claimId}`).once('value');
      const curData = currentSnap.val() || {};

      const bothConfirmed = (isClaimant && curData.finderConfirmed) || (isFinder && curData.claimantConfirmed);

      if (bothConfirmed) {
        updates.status = 'completed';
        updates.completedAt = new Date().toISOString();

        await itemRepository.updateFound(claim.found_item_id, { status: 'Returned' });
        if (claim.match_id) {
          const match = await matchRepository.findById(claim.match_id);
          if (match) await itemRepository.updateLost(match.lost_item_id, { status: 'Returned' });
        }

        // Record recovery log
        await firebaseDb.ref(`recoveries/${claimId}`).set({
          id: claimId,
          found_item_id: claim.found_item_id,
          item_name: claim.item_name,
          finder_id: claim.finder_id,
          owner_id: claim.claimant_id,
          completedAt: new Date().toISOString(),
        });

        // Boost reputation scores (+10 for both finder and owner)
        try {
          const finderUser = await userRepository.findById(claim.finder_id);
          const ownerUser = await userRepository.findById(claim.claimant_id);
          if (finderUser) await userRepository.update(claim.finder_id, { reputationScore: (finderUser.reputationScore || 0) + 10, successfulReturns: (finderUser.successfulReturns || 0) + 1 });
          if (ownerUser) await userRepository.update(claim.claimant_id, { reputationScore: (ownerUser.reputationScore || 0) + 5 });
        } catch (e) {
          console.warn('[Reputation Update Error]:', e.message);
        }

        await notificationRepository.create({
          user_id: claim.claimant_id,
          title: `🎉 Recovery Confirmed: "${claim.item_name}" Returned!`,
          message: `Item return confirmed! Thank you for using Campus QuickFinder.`,
          type: 'item_returned',
          reference_id: claim.id,
          reference_type: 'recovery',
        });

        await notificationRepository.create({
          user_id: claim.finder_id,
          title: `🎉 Recovery Completed!`,
          message: `Great job returning "${claim.item_name}"! +10 reputation score awarded.`,
          type: 'item_returned',
          reference_id: claim.id,
          reference_type: 'recovery',
        });
      } else {
        const otherUser = isClaimant ? claim.finder_id : claim.claimant_id;
        await notificationRepository.create({
          user_id: otherUser,
          title: `Return Confirmation Needed`,
          message: `${isClaimant ? 'Claimant' : 'Finder'} has confirmed item handover. Please confirm return on your claim page to complete recovery.`,
          type: 'confirm_return_requested',
          reference_id: claim.id,
          reference_type: 'claim',
        });
      }

      await firebaseDb.ref(`claims/${claimId}`).update(updates);

      return {
        message: bothConfirmed ? 'Recovery completed and confirmed by both parties! 🎉' : 'Return confirmed on your side. Awaiting other party confirmation.',
        claimStatus: bothConfirmed ? 'completed' : claim.status,
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
