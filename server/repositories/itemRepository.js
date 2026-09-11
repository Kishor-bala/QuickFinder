const { getNextId, getAllRecords, getRecordById, setRecord, updateRecord, deleteRecord } = require('../services/firebaseDbService');
const userRepository = require('./userRepository');

class ItemRepository {
  async getImages(itemId, itemType) {
    const images = await getAllRecords('item_images');
    return images
      .filter((img) => String(img.item_id) === String(itemId) && img.item_type === itemType)
      .map((r) => r.image_url);
  }

  async addImage(itemId, itemType, imageUrl) {
    const newId = await getNextId('item_images');
    const record = { id: newId, item_id: itemId, item_type: itemType, image_url: imageUrl, created_at: new Date().toISOString() };
    await setRecord('item_images', newId, record);
    return record;
  }

  // Lost Items
  async findLostById(id) {
    const item = await getRecordById('lost_items', id);
    if (!item) return null;
    const user = await userRepository.findById(item.user_id);
    const images = await this.getImages(id, 'lost');
    return {
      ...item,
      reporter_name: user?.name || item.reporter_name || 'Anonymous',
      reporter_email: user?.email || item.contact_email || '',
      reporter_phone: user?.phone || item.contact_number || '',
      reporter_photo: user?.profile_photo || null,
      images: item.images && item.images.length ? item.images : images,
    };
  }

  async createLost(data) {
    const newId = await getNextId('lost_items');
    const user = await userRepository.findById(data.userId);

    const imagesList = data.images || [];
    const item = {
      id: newId,
      user_id: data.userId,
      item_name: data.item_name.trim(),
      category: data.category.trim(),
      brand: data.brand ? data.brand.trim() : null,
      model: data.model ? data.model.trim() : null,
      colour: data.colour ? data.colour.trim() : null,
      lost_date: data.lost_date,
      lost_time: data.lost_time || null,
      lost_location: data.lost_location.trim(),
      description: data.description ? data.description.trim() : null,
      identifying_details: data.identifying_details ? data.identifying_details.trim() : null,
      contact_number: data.contact_number ? data.contact_number.trim() : null,
      contact_email: data.contact_email ? data.contact_email.trim() : null,
      status: 'Searching',
      images: imagesList,
      reporter_name: user?.name || null,
      created_at: new Date().toISOString(),
    };

    await setRecord('lost_items', newId, item);
    for (const img of imagesList) {
      await this.addImage(newId, 'lost', img);
    }
    return await this.findLostById(newId);
  }

  async queryLost(filters = {}) {
    let items = await getAllRecords('lost_items');
    const users = await getAllRecords('users');

    items = items.map((item) => {
      const user = users.find((u) => String(u.id) === String(item.user_id));
      return {
        ...item,
        reporter_name: user?.name || item.reporter_name || 'Anonymous',
        images: item.images || [],
      };
    });

    if (filters.search) {
      const term = filters.search.trim().toLowerCase();
      items = items.filter((item) =>
        (item.item_name && item.item_name.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.brand && item.brand.toLowerCase().includes(term)) ||
        (item.lost_location && item.lost_location.toLowerCase().includes(term))
      );
    }
    if (filters.category && filters.category !== 'All') {
      items = items.filter((item) => item.category && item.category.toLowerCase() === filters.category.trim().toLowerCase());
    }
    if (filters.location) {
      const loc = filters.location.trim().toLowerCase();
      items = items.filter((item) => item.lost_location && item.lost_location.toLowerCase().includes(loc));
    }
    if (filters.date) {
      items = items.filter((item) => item.lost_date === filters.date);
    }
    if (filters.colour && filters.colour !== 'All') {
      const col = filters.colour.trim().toLowerCase();
      items = items.filter((item) => item.colour && item.colour.toLowerCase().includes(col));
    }
    if (filters.status) {
      items = items.filter((item) => item.status === filters.status);
    }
    if (filters.userId) {
      items = items.filter((item) => String(item.user_id) === String(filters.userId));
    }

    return items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async updateLost(id, updates) {
    await updateRecord('lost_items', id, updates);
    return await this.findLostById(id);
  }

  async deleteLost(id) {
    return await deleteRecord('lost_items', id);
  }

  // Found Items
  async findFoundById(id) {
    const item = await getRecordById('found_items', id);
    if (!item) return null;
    const user = await userRepository.findById(item.user_id);
    const images = await this.getImages(id, 'found');
    return {
      ...item,
      finder_name: user?.name || item.finder_name || 'Anonymous',
      finder_email: user?.email || item.contact_email || '',
      finder_phone: user?.phone || item.contact_number || '',
      finder_photo: user?.profile_photo || null,
      images: item.images && item.images.length ? item.images : images,
    };
  }

  async createFound(data) {
    const newId = await getNextId('found_items');
    const user = await userRepository.findById(data.userId);

    const imagesList = data.images || [];
    const item = {
      id: newId,
      user_id: data.userId,
      item_name: data.item_name.trim(),
      category: data.category.trim(),
      brand: data.brand ? data.brand.trim() : null,
      model: data.model ? data.model.trim() : null,
      colour: data.colour ? data.colour.trim() : null,
      found_date: data.found_date,
      found_time: data.found_time || null,
      found_location: data.found_location.trim(),
      description: data.description ? data.description.trim() : null,
      identifying_details: data.identifying_details ? data.identifying_details.trim() : null,
      additional_notes: data.additional_notes ? data.additional_notes.trim() : null,
      contact_number: data.contact_number ? data.contact_number.trim() : null,
      contact_email: data.contact_email ? data.contact_email.trim() : null,
      status: 'Available',
      images: imagesList,
      finder_name: user?.name || null,
      created_at: new Date().toISOString(),
    };

    await setRecord('found_items', newId, item);
    for (const img of imagesList) {
      await this.addImage(newId, 'found', img);
    }
    return await this.findFoundById(newId);
  }

  async queryFound(filters = {}) {
    let items = await getAllRecords('found_items');
    const users = await getAllRecords('users');

    items = items.map((item) => {
      const user = users.find((u) => String(u.id) === String(item.user_id));
      return {
        ...item,
        finder_name: user?.name || item.finder_name || 'Anonymous',
        images: item.images || [],
      };
    });

    if (filters.search) {
      const term = filters.search.trim().toLowerCase();
      items = items.filter((item) =>
        (item.item_name && item.item_name.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.brand && item.brand.toLowerCase().includes(term)) ||
        (item.found_location && item.found_location.toLowerCase().includes(term))
      );
    }
    if (filters.category && filters.category !== 'All') {
      items = items.filter((item) => item.category && item.category.toLowerCase() === filters.category.trim().toLowerCase());
    }
    if (filters.location) {
      const loc = filters.location.trim().toLowerCase();
      items = items.filter((item) => item.found_location && item.found_location.toLowerCase().includes(loc));
    }
    if (filters.date) {
      items = items.filter((item) => item.found_date === filters.date);
    }
    if (filters.colour && filters.colour !== 'All') {
      const col = filters.colour.trim().toLowerCase();
      items = items.filter((item) => item.colour && item.colour.toLowerCase().includes(col));
    }
    if (filters.status) {
      items = items.filter((item) => item.status === filters.status);
    }
    if (filters.userId) {
      items = items.filter((item) => String(item.user_id) === String(filters.userId));
    }

    if (filters.sort === 'oldest') {
      return items.sort((a, b) => new Date(a.found_date || a.created_at || 0) - new Date(b.found_date || b.created_at || 0));
    }
    return items.sort((a, b) => new Date(b.found_date || b.created_at || 0) - new Date(a.found_date || a.created_at || 0));
  }

  async updateFound(id, updates) {
    await updateRecord('found_items', id, updates);
    return await this.findFoundById(id);
  }

  async deleteFound(id) {
    return await deleteRecord('found_items', id);
  }

  // Counts for Admin
  async countLost() {
    const items = await getAllRecords('lost_items');
    return items.length;
  }

  async countFound() {
    const items = await getAllRecords('found_items');
    return items.length;
  }

  async countClaimed() {
    const lostItems = await getAllRecords('lost_items');
    const foundItems = await getAllRecords('found_items');
    const lostClaimed = lostItems.filter((i) => i.status === 'Claimed').length;
    const foundClaimed = foundItems.filter((i) => i.status === 'Claimed').length;
    return lostClaimed + foundClaimed;
  }
}

module.exports = new ItemRepository();
