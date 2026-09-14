function matchBrand(b1, b2) {
  if (!b1 || !b2) return 0.5;
  const brand1 = b1.trim().toLowerCase();
  const brand2 = b2.trim().toLowerCase();
  if (brand1 === brand2) return 1.0;
  if (brand1.includes(brand2) || brand2.includes(brand1)) return 0.85;
  return 0.1;
}

module.exports = { matchBrand };
