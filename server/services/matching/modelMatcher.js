function matchModel(m1, m2) {
  if (!m1 || !m2) return 0.5;
  const mod1 = m1.trim().toLowerCase();
  const mod2 = m2.trim().toLowerCase();
  if (mod1 === mod2) return 1.0;
  if (mod1.includes(mod2) || mod2.includes(mod1)) return 0.85;
  return 0.1;
}

module.exports = { matchModel };
