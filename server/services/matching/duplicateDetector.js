const { matchCategory } = require('./categoryMatcher');
const { matchBrand } = require('./brandMatcher');
const { matchModel } = require('./modelMatcher');
const { matchLocation } = require('./locationMatcher');

/**
 * Check if a newly submitted report is a duplicate of an existing item of the same type (Lost-Lost or Found-Found).
 */
function checkDuplicates(newItem, existingItems = []) {
  if (!newItem || !Array.isArray(existingItems) || existingItems.length === 0) {
    return [];
  }

  const duplicates = [];

  for (const existing of existingItems) {
    // Skip comparing item with itself
    if (existing.id && String(existing.id) === String(newItem.id)) continue;
    
    // Only check reports by the same user or identical title/category
    const isSameUser = String(existing.user_id) === String(newItem.userId || newItem.user_id);
    const catScore = matchCategory(newItem.category, existing.category);
    if (catScore < 0.8) continue;

    const brandScore = matchBrand(newItem.brand, existing.brand);
    const modelScore = matchModel(newItem.model, existing.model);
    const locScore = matchLocation(newItem.lost_location || newItem.found_location, existing.lost_location || existing.found_location);

    const dupScore = (catScore * 0.3) + (brandScore * 0.25) + (modelScore * 0.25) + (locScore * 0.2);

    if (dupScore >= 0.75) {
      duplicates.push({
        existingItem: existing,
        duplicateScore: Math.round(dupScore * 100),
        reason: isSameUser ? 'Duplicate report by same user' : 'Highly similar report active',
      });
    }
  }

  return duplicates.sort((a, b) => b.duplicateScore - a.duplicateScore);
}

module.exports = { checkDuplicates };
