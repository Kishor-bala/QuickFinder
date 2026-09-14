const { COLOR_SYNONYMS } = require('../../shared/constants');

function matchColor(c1, c2) {
  if (!c1 || !c2) return 0.5;
  const col1 = c1.trim().toLowerCase();
  const col2 = c2.trim().toLowerCase();
  if (col1 === col2) return 1.0;
  if (col1.includes(col2) || col2.includes(col1)) return 0.85;

  for (const [family, shades] of Object.entries(COLOR_SYNONYMS)) {
    const has1 = shades.some(s => col1.includes(s) || s.includes(col1));
    const has2 = shades.some(s => col2.includes(s) || s.includes(col2));
    if (has1 && has2) return 0.8;
  }
  return 0.1;
}

module.exports = { matchColor };
