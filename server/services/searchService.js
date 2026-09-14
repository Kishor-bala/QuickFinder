const { getAllRecords } = require('./firebaseDbService');
const userRepository = require('../repositories/userRepository');

function normalizeString(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

function buildSearchTokens(item) {
  const fields = [
    item.item_name,
    item.category,
    item.subcategory,
    item.brand,
    item.model,
    item.colour,
    item.building,
    item.lost_location,
    item.found_location,
    item.area,
  ];

  const norm = fields.map(normalizeString).filter(Boolean).join(' ');
  const tokens = Array.from(new Set(norm.split(' ').filter(w => w.length > 1)));
  return tokens.slice(0, 30);
}

class SearchService {
  normalizeItem(item) {
    return {
      ...item,
      normalizedTitle: normalizeString(item.item_name),
      normalizedCategory: normalizeString(item.category),
      normalizedSubcategory: normalizeString(item.subcategory),
      normalizedBrand: normalizeString(item.brand),
      normalizedModel: normalizeString(item.model),
      normalizedColor: normalizeString(item.colour),
      normalizedBuilding: normalizeString(item.building || item.lost_location || item.found_location),
      normalizedArea: normalizeString(item.area || item.room),
      searchTokens: buildSearchTokens(item),
    };
  }

  async searchLost(criteria = {}) {
    let items = await getAllRecords('lost_items');
    const users = await getAllRecords('users');

    items = items.map((item) => {
      const user = users.find((u) => String(u.id) === String(item.user_id));
      return {
        ...this.normalizeItem(item),
        reporter_name: user?.name || item.reporter_name || 'Anonymous',
        images: item.images || [],
      };
    });

    return this.applyFilters(items, criteria);
  }

  async searchFound(criteria = {}) {
    let items = await getAllRecords('found_items');
    const users = await getAllRecords('users');

    items = items.map((item) => {
      const user = users.find((u) => String(u.id) === String(item.user_id));
      return {
        ...this.normalizeItem(item),
        finder_name: user?.name || item.finder_name || 'Anonymous',
        images: item.images || [],
      };
    });

    return this.applyFilters(items, criteria);
  }

  applyFilters(items, criteria) {
    let filtered = [...items];

    if (criteria.search) {
      const q = normalizeString(criteria.search);
      filtered = filtered.filter((item) => {
        return (
          item.normalizedTitle.includes(q) ||
          item.normalizedCategory.includes(q) ||
          item.normalizedSubcategory.includes(q) ||
          item.normalizedBrand.includes(q) ||
          item.normalizedModel.includes(q) ||
          item.normalizedColor.includes(q) ||
          item.normalizedBuilding.includes(q) ||
          (item.searchTokens && item.searchTokens.some(t => t.includes(q) || q.includes(t)))
        );
      });
    }

    if (criteria.category && criteria.category !== 'All') {
      const cat = normalizeString(criteria.category);
      filtered = filtered.filter((item) => item.normalizedCategory === cat || item.category === criteria.category);
    }

    if (criteria.subcategory && criteria.subcategory !== 'All') {
      const sub = normalizeString(criteria.subcategory);
      filtered = filtered.filter((item) => item.normalizedSubcategory === sub || item.subcategory === criteria.subcategory);
    }

    if (criteria.building && criteria.building !== 'All') {
      const bld = normalizeString(criteria.building);
      filtered = filtered.filter((item) => item.normalizedBuilding.includes(bld));
    }

    if (criteria.colour && criteria.colour !== 'All') {
      const col = normalizeString(criteria.colour);
      filtered = filtered.filter((item) => item.normalizedColor.includes(col));
    }

    if (criteria.status && criteria.status !== 'All') {
      filtered = filtered.filter((item) => item.status === criteria.status);
    }

    if (criteria.userId) {
      filtered = filtered.filter((item) => String(item.user_id) === String(criteria.userId));
    }

    if (criteria.date) {
      filtered = filtered.filter((item) => (item.lost_date === criteria.date || item.found_date === criteria.date));
    }

    // Sort order: newest first
    return filtered.sort((a, b) => new Date(b.created_at || b.lost_date || b.found_date || 0) - new Date(a.created_at || a.lost_date || a.found_date || 0));
  }
}

module.exports = new SearchService();
