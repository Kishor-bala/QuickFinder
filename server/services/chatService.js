/**
 * Controlled Message Requests & Real-time Chat Service
 */
const { getFirebaseDb } = require('../config/firebaseAdmin');
const notificationRepository = require('../repositories/notificationRepository');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');

class ChatService {
  async isBlocked(userA, userB) {
    try {
      const db = getFirebaseDb();
      const snapA = await db.ref(`userBlocks/${userA}/${userB}`).once('value');
      const snapB = await db.ref(`userBlocks/${userB}/${userA}`).once('value');
      return snapA.exists() || snapB.exists();
    } catch {
      return false;
    }
  }

  // 1. Send Message Request
  async sendMessageRequest({ sender_id, recipient_id, report_id, initial_message }) {
    if (!recipient_id || !initial_message) {
      throw new BadRequestError('Recipient ID and initial message are required.');
    }
    if (String(sender_id) === String(recipient_id)) {
      throw new BadRequestError('You cannot send a message request to yourself.');
    }

    if (await this.isBlocked(sender_id, recipient_id)) {
      throw new ForbiddenError('Communication blocked by safety settings.');
    }

    const db = getFirebaseDb();
    const requestId = `req_${sender_id}_${recipient_id}_${report_id || 'gen'}`;
    const existingSnap = await db.ref(`messageRequests/${requestId}`).once('value');
    if (existingSnap.exists() && existingSnap.val().status === 'pending') {
      throw new BadRequestError('You already have a pending message request with this user.');
    }

    const requestData = {
      id: requestId,
      sender_id,
      recipient_id,
      report_id: report_id || null,
      initial_message,
      status: 'pending', // pending, accepted, rejected, blocked
      createdAt: new Date().toISOString(),
    };

    await db.ref(`messageRequests/${requestId}`).set(requestData);

    await notificationRepository.create({
      user_id: recipient_id,
      title: 'New Message Request',
      message: `Someone sent you a message request: "${initial_message.slice(0, 60)}..."`,
      type: 'message_request',
      reference_id: requestId,
      reference_type: 'message_request',
    });

    return requestData;
  }

  // 2. Respond to Message Request (accept, reject, block)
  async respondToMessageRequest(requestId, userId, action) {
    const validActions = ['accept', 'reject', 'block'];
    if (!action || !validActions.includes(action.toLowerCase())) {
      throw new BadRequestError(`Valid action required (${validActions.join(', ')}).`);
    }

    const db = getFirebaseDb();
    const snap = await db.ref(`messageRequests/${requestId}`).once('value');
    if (!snap.exists()) throw new NotFoundError('Message request not found.');

    const request = snap.val();
    if (String(request.recipient_id) !== String(userId)) {
      throw new ForbiddenError('Only the recipient can respond to this message request.');
    }

    const act = action.toLowerCase();

    if (act === 'accept') {
      await db.ref(`messageRequests/${requestId}`).update({ status: 'accepted', updatedAt: new Date().toISOString() });

      // Create conversation
      const convId = `conv_${[request.sender_id, request.recipient_id].sort().join('_')}`;
      const convRef = db.ref(`conversations/${convId}`);
      await convRef.set({
        id: convId,
        participants: [request.sender_id, request.recipient_id],
        report_id: request.report_id,
        createdAt: new Date().toISOString(),
        lastMessage: request.initial_message,
        lastMessageAt: new Date().toISOString(),
        status: 'active',
      });

      // Insert initial message
      const msgId = db.ref(`messages/${convId}`).push().key;
      await db.ref(`messages/${convId}/${msgId}`).set({
        id: msgId,
        sender_id: request.sender_id,
        text: request.initial_message,
        createdAt: new Date().toISOString(),
        readAt: null,
      });

      await notificationRepository.create({
        user_id: request.sender_id,
        title: 'Message Request Accepted!',
        message: 'Your message request was accepted. Real-time chat is now unlocked!',
        type: 'message_request_accepted',
        reference_id: convId,
        reference_type: 'conversation',
      });

      return { message: 'Message request accepted. Conversation created.', conversationId: convId };
    }

    if (act === 'reject') {
      await db.ref(`messageRequests/${requestId}`).update({ status: 'rejected', updatedAt: new Date().toISOString() });
      return { message: 'Message request rejected.' };
    }

    if (act === 'block') {
      await db.ref(`messageRequests/${requestId}`).update({ status: 'blocked', updatedAt: new Date().toISOString() });
      await db.ref(`userBlocks/${userId}/${request.sender_id}`).set({ blockedAt: new Date().toISOString() });
      return { message: 'User blocked and request rejected.' };
    }
  }

  // 3. Post Message to Conversation
  async sendMessage(convId, senderId, text, attachmentUrl = null) {
    if (!text && !attachmentUrl) throw new BadRequestError('Message text or attachment is required.');

    const db = getFirebaseDb();
    const convSnap = await db.ref(`conversations/${convId}`).once('value');
    if (!convSnap.exists()) throw new NotFoundError('Conversation not found.');

    const conv = convSnap.val();
    if (!conv.participants.includes(senderId)) {
      throw new ForbiddenError('You are not a participant in this conversation.');
    }

    const recipientId = conv.participants.find(p => p !== senderId);
    if (await this.isBlocked(senderId, recipientId)) {
      throw new ForbiddenError('Communication blocked by safety settings.');
    }

    const msgRef = db.ref(`messages/${convId}`).push();
    const msgData = {
      id: msgRef.key,
      sender_id: senderId,
      text: text || '',
      attachmentUrl: attachmentUrl || null,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    await msgRef.set(msgData);
    await db.ref(`conversations/${convId}`).update({
      lastMessage: text || 'Attachment sent',
      lastMessageAt: new Date().toISOString(),
    });

    // Notify recipient
    await notificationRepository.create({
      user_id: recipientId,
      title: 'New Message',
      message: `${text ? text.slice(0, 50) : 'Sent an attachment'}`,
      type: 'new_message',
      reference_id: convId,
      reference_type: 'conversation',
    });

    return msgData;
  }

  // 4. Get User Conversations & Message Requests
  async getUserChatOverview(userId) {
    const db = getFirebaseDb();

    // Requests
    const reqSnap = await db.ref('messageRequests').once('value');
    const reqVal = reqSnap.val() || {};
    const pendingRequests = Object.values(reqVal).filter(r => String(r.recipient_id) === String(userId) && r.status === 'pending');

    // Conversations
    const convSnap = await db.ref('conversations').once('value');
    const convVal = convSnap.val() || {};
    const myConvs = Object.values(convVal).filter(c => Array.isArray(c.participants) && c.participants.includes(userId));

    return {
      pendingRequests,
      conversations: myConvs,
    };
  }
}

module.exports = new ChatService();
