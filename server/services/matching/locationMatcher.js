const { LOCATION_SYNONYMS } = require('../../shared/constants');

function matchLocation(loc1, loc2, bld1, bld2) {
  const l1 = ((loc1 || '') + ' ' + (bld1 || '')).trim().toLowerCase();
  const l2 = ((loc2 || '') + ' ' + (bld2 || '')).trim().toLowerCase();
  if (!l1 || !l2) return 0.5;
  if (l1 === l2) return 1.0;
  if (l1.includes(l2) || l2.includes(l1)) return 0.9;

  for (const [key, synonyms] of Object.entries(LOCATION_SYNONYMS)) {
    const has1 = synonyms.some(s => l1.includes(s) || s.includes(l1));
    const has2 = synonyms.some(s => l2.includes(s) || s.includes(l2));
    if (has1 && has2) return 0.8;
  }
  return 0.2;
}

module.exports = { matchLocation };
