const { getNextId, getAllRecords, getRecordById, setRecord, updateRecord } = require('../services/firebaseDbService');
const itemRepository = require('./itemRepository');

class MatchRepository {
  async findById(id) {
    const match = await getRecordById('matches', id);
    if (!match) return null;

    const lostItem = await itemRepository.findLostById(match.lost_item_id);
    const foundItem = await itemRepository.findFoundById(match.found_item_id);

    return {
      ...match,
      lost_item_name: lostItem?.item_name || '',
      lost_category: lostItem?.category || '',
      lost_user_id: lostItem?.user_id || null,
      found_item_name: foundItem?.item_name || '',
      found_category: foundItem?.category || '',
      found_user_id: foundItem?.user_id || null,
    };
  }

  async findByItemPair(lostItemId, foundItemId) {
    const matches = await getAllRecords('matches');
    return matches.find((m) => String(m.lost_item_id) === String(lostItemId) && String(m.found_item_id) === String(foundItemId)) || null;
  }

  async upsertMatch(lostItemId, foundItemId, score, reasons) {
    const existing = await this.findByItemPair(lostItemId, foundItemId);
    const reasonsJson = typeof reasons === 'string' ? reasons : JSON.stringify(reasons);

    if (existing) {
      await updateRecord('matches', existing.id, {
        match_score: score,
        match_reasons: reasonsJson,
        match_status: 'pending',
      });
      return existing.id;
    }

    const newId = await getNextId('matches');
    const record = {
      id: newId,
      lost_item_id: lostItemId,
      found_item_id: foundItemId,
      match_score: score,
      match_reasons: reasonsJson,
      match_status: 'pending',
      created_at: new Date().toISOString(),
    };

    await setRecord('matches', newId, record);
    return newId;
  }

  async dismissMatch(id) {
    return await updateRecord('matches', id, { match_status: 'dismissed' });
  }

  async findByUser(userId) {
    const matches = await getAllRecords('matches');
    const lostItems = await getAllRecords('lost_items');
    const foundItems = await getAllRecords('found_items');

    const result = [];
    for (const m of matches) {
      if (m.match_status === 'dismissed') continue;
      const l = lostItems.find((item) => String(item.id) === String(m.lost_item_id));
      const f = foundItems.find((item) => String(item.id) === String(m.found_item_id));
      if (!l || !f) continue;

      if (String(l.user_id) !== String(userId) && String(f.user_id) !== String(userId)) continue;

      const found_image = f.images && f.images.length ? f.images[0] : null;
      const lost_image = l.images && l.images.length ? l.images[0] : null;

      result.push({
        ...m,
        lost_name: l.item_name,
        lost_cat: l.category,
        lost_date: l.lost_date,
        lost_location: l.lost_location,
        found_name: f.item_name,
        found_cat: f.category,
        found_date: f.found_date,
        found_location: f.found_location,
        found_image,
        lost_image,
      });
    }

    return result.sort((a, b) => b.match_score - a.match_score);
  }

  async findByLostItem(lostItemId) {
    const matches = await getAllRecords('matches');
    const foundItems = await getAllRecords('found_items');

    const result = [];
    for (const m of matches) {
      if (String(m.lost_item_id) !== String(lostItemId) || m.match_status === 'dismissed') continue;
      const f = foundItems.find((item) => String(item.id) === String(m.found_item_id));
      if (!f) continue;

      const found_image = f.images && f.images.length ? f.images[0] : null;

      result.push({
        ...m,
        found_name: f.item_name,
        found_cat: f.category,
        found_date: f.found_date,
        found_location: f.found_location,
        brand: f.brand,
        model: f.model,
        colour: f.colour,
        description: f.description,
        found_image,
      });
    }

    return result.sort((a, b) => b.match_score - a.match_score);
  }

  async countSuccessful() {
    const matches = await getAllRecords('matches');
    return matches.filter((m) => m.match_status === 'accepted').length;
  }
}

module.exports = new MatchRepository();
