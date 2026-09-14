function matchSubcategory(lostSub, foundSub) {
  if (!lostSub || !foundSub) return 0.5;
  const s1 = lostSub.trim().toLowerCase();
  const s2 = foundSub.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  return 0.2;
}

module.exports = { matchSubcategory };
