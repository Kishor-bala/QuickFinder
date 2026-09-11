const { getNextId, getAllRecords, getRecordById, setRecord, updateRecord } = require('../services/firebaseDbService');
const userRepository = require('./userRepository');
const itemRepository = require('./itemRepository');

class ClaimRepository {
  async findById(id) {
    const claim = await getRecordById('claims', id);
    if (!claim) return null;

    const foundItem = await itemRepository.findFoundById(claim.found_item_id);
    const claimant = await userRepository.findById(claim.claimant_id);
    const finder = foundItem ? await userRepository.findById(foundItem.user_id) : null;

    return {
      ...claim,
      item_name: foundItem?.item_name || '',
      category: foundItem?.category || '',
      finder_id: foundItem?.user_id || null,
      finder_phone: foundItem?.contact_number || finder?.phone || '',
      finder_email: foundItem?.contact_email || finder?.email || '',
      claimant_name: claimant?.name || '',
      claimant_email: claimant?.email || '',
      claimant_phone: claimant?.phone || '',
    };
  }

  async create({ found_item_id, claimant_id, message, proof_image, match_id = null }) {
    const newId = await getNextId('claims');
    const claim = {
      id: newId,
      match_id: match_id || null,
      found_item_id,
      claimant_id,
      message: message.trim(),
      proof_image: proof_image || null,
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    await setRecord('claims', newId, claim);
    return await this.findById(newId);
  }

  async findExistingPending(foundItemId, claimantId) {
    const claims = await getAllRecords('claims');
    return claims.find((c) => String(c.found_item_id) === String(foundItemId) && String(c.claimant_id) === String(claimantId) && c.status === 'Pending') || null;
  }

  async hasAcceptedClaim(foundItemId, claimantId) {
    const claims = await getAllRecords('claims');
    const claim = claims.find((c) => String(c.found_item_id) === String(foundItemId) && String(c.claimant_id) === String(claimantId) && c.status === 'Accepted');
    return !!claim;
  }

  async findByUserReceived(finderUserId) {
    const claims = await getAllRecords('claims');
    const foundItems = await getAllRecords('found_items');
    const users = await getAllRecords('users');

    const result = [];
    for (const c of claims) {
      const f = foundItems.find((item) => String(item.id) === String(c.found_item_id));
      if (!f || String(f.user_id) !== String(finderUserId)) continue;
      const claimant = users.find((u) => String(u.id) === String(c.claimant_id));

      const item_image = f.images && f.images.length ? f.images[0] : null;

      result.push({
        ...c,
        item_name: f.item_name,
        category: f.category,
        found_location: f.found_location,
        found_date: f.found_date,
        claimant_name: claimant?.name || '',
        claimant_email: claimant?.email || '',
        claimant_phone: claimant?.phone || '',
        claimant_photo: claimant?.profile_photo || null,
        item_image,
      });
    }

    return result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async findByUserSent(claimantUserId) {
    const claims = await getAllRecords('claims');
    const foundItems = await getAllRecords('found_items');
    const users = await getAllRecords('users');

    const result = [];
    for (const c of claims) {
      if (String(c.claimant_id) !== String(claimantUserId)) continue;
      const f = foundItems.find((item) => String(item.id) === String(c.found_item_id));
      if (!f) continue;
      const finder = users.find((u) => String(u.id) === String(f.user_id));

      const item_image = f.images && f.images.length ? f.images[0] : null;

      result.push({
        ...c,
        item_name: f.item_name,
        category: f.category,
        found_location: f.found_location,
        found_date: f.found_date,
        item_status: f.status,
        finder_name: finder?.name || '',
        item_image,
      });
    }

    return result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async updateStatus(id, status) {
    await updateRecord('claims', id, { status });
    return await this.findById(id);
  }

  async listAllForAdmin() {
    const claims = await getAllRecords('claims');
    const foundItems = await getAllRecords('found_items');
    const users = await getAllRecords('users');

    return claims.map((c) => {
      const f = foundItems.find((item) => String(item.id) === String(c.found_item_id));
      const claimant = users.find((u) => String(u.id) === String(c.claimant_id));
      const finder = f ? users.find((u) => String(u.id) === String(f.user_id)) : null;

      return {
        ...c,
        item_name: f?.item_name || '',
        category: f?.category || '',
        claimant_name: claimant?.name || '',
        claimant_email: claimant?.email || '',
        finder_name: finder?.name || '',
        finder_email: finder?.email || '',
      };
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async countPending() {
    const claims = await getAllRecords('claims');
    return claims.filter((c) => c.status === 'Pending').length;
  }
}

module.exports = new ClaimRepository();
