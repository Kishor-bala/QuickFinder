/**
 * Staff Handover & Campus Location System
 */
const { getFirebaseDb } = require('../config/firebaseAdmin');
const itemRepository = require('../repositories/itemRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { BadRequestError, NotFoundError } = require('../utils/errors');

class HandoverService {
  // Default Campus Locations
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

  // Staff Handover Action
  async recordHandover({ found_item_id, staff_uid, handover_location, notes }) {
    if (!found_item_id || !handover_location) {
      throw new BadRequestError('Found item ID and handover location are required.');
    }

    const foundItem = await itemRepository.findFoundById(found_item_id);
    if (!foundItem) throw new NotFoundError('Found item not found.');

    const db = getFirebaseDb();
    const handoverRecord = {
      id: `handover_${found_item_id}_${Date.now()}`,
      found_item_id,
      finder_id: foundItem.user_id,
      staff_uid: staff_uid || 'system_staff',
      handover_location,
      notes: notes || 'Item deposited at campus location.',
      timestamp: new Date().toISOString(),
      qrReceiptId: `QR_HANDOVER_${found_item_id}_${Math.floor(100000 + Math.random() * 900000)}`,
    };

    await db.ref(`handovers/${handoverRecord.id}`).set(handoverRecord);
    await itemRepository.updateFound(found_item_id, {
      handoverStatus: 'deposited',
      currentLocation: handover_location,
    });

    // Notify finder
    await notificationRepository.create({
      user_id: foundItem.user_id,
      title: 'Handover Confirmed!',
      message: `Your found item "${foundItem.item_name}" is now safely deposited at "${handover_location}".`,
      type: 'handover_complete',
      reference_id: handoverRecord.id,
      reference_type: 'handover',
    });

    return handoverRecord;
  }
}

module.exports = new HandoverService();
