function matchDate(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 0.5;
  try {
    const s1 = String(dateStr1).split('T')[0];
    const s2 = String(dateStr2).split('T')[0];
    if (s1 === s2) return 1.0;

    const [y1, m1, d1] = s1.split('-').map(Number);
    const [y2, m2, d2] = s2.split('-').map(Number);
    const dt1 = new Date(y1, m1 - 1, d1);
    const dt2 = new Date(y2, m2 - 1, d2);
    const diffDays = Math.round(Math.abs((dt1 - dt2) / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) return 1.0;
    if (diffDays <= 2) return 0.85;
    if (diffDays <= 5) return 0.6;
    if (diffDays <= 10) return 0.3;
    return 0.1;
  } catch {
    return 0.5;
  }
}

module.exports = { matchDate };
