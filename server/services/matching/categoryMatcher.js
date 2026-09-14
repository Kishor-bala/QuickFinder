function matchCategory(lostCat, foundCat) {
  if (!lostCat || !foundCat) return 0.5;
  const c1 = lostCat.trim().toLowerCase();
  const c2 = foundCat.trim().toLowerCase();
  if (c1 === c2) return 1.0;
  if (c1 === 'other' || c2 === 'other' || c1 === 'others' || c2 === 'others') return 0.6;
  return 0.0;
}

module.exports = { matchCategory };
