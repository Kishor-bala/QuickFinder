const matchRepository = require('../repositories/matchRepository');
const notificationRepository = require('../repositories/notificationRepository');
const itemRepository = require('../repositories/itemRepository');
const { embeddingProvider } = require('../config/aiProvider');
const {
  LOCATION_SYNONYMS,
  COLOR_SYNONYMS,
  MATCHING_CONFIG,
} = require('../shared');

// Normalize text
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTokens(text) {
  const norm = normalizeText(text);
  if (!norm) return [];
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'it', 'my', 'some', 'near']);
  return norm.split(' ').filter(w => w.length > 1 && !stopwords.has(w));
}

function calculateTokenSimilarity(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const tokens1 = getTokens(s1);
  const tokens2 = getTokens(s2);
  if (!tokens1.length || !tokens2.length) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersection++;
    } else {
      for (const t2 of set2) {
        if (t2.length >= 4 && (t2.includes(token) || token.includes(t2))) {
          intersection += 0.5;
          break;
        }
      }
    }
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return Math.min(1.0, intersection / union);
}

function areLocationsSynonymous(loc1, loc2) {
  const l1 = normalizeText(loc1);
  const l2 = normalizeText(loc2);
  if (!l1 || !l2) return false;
  if (l1 === l2) return true;
  if (l1.includes(l2) || l2.includes(l1)) return true;

  for (const [key, synonyms] of Object.entries(LOCATION_SYNONYMS)) {
    const hasL1 = synonyms.some(s => l1.includes(s) || s.includes(l1));
    const hasL2 = synonyms.some(s => l2.includes(s) || s.includes(l2));
    if (hasL1 && hasL2) return true;
  }
  return false;
}

function areColorsMatching(c1, c2) {
  if (!c1 || !c2) return false;
  const col1 = normalizeText(c1);
  const col2 = normalizeText(c2);
  if (col1 === col2) return true;
  if (col1.includes(col2) || col2.includes(col1)) return true;

  for (const [family, shades] of Object.entries(COLOR_SYNONYMS)) {
    const hasC1 = shades.some(s => col1.includes(s) || s.includes(col1));
    const hasC2 = shades.some(s => col2.includes(s) || s.includes(col2));
    if (hasC1 && hasC2) return true;
  }
  return false;
}

function calculateDateScore(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 0;
  try {
    const s1 = String(dateStr1).split('T')[0];
    const s2 = String(dateStr2).split('T')[0];
    if (s1 === s2) return 10;

    const [y1, m1, d1] = s1.split('-').map(Number);
    const [y2, m2, d2] = s2.split('-').map(Number);
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const diffDays = Math.round(Math.abs((date1 - date2) / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) return 10;
    if (diffDays <= 2) return 8;
    if (diffDays <= 5) return 5;
    if (diffDays <= 10) return 2;
    return 0;
  } catch {
    return 0;
  }
}

class MatchingService {
  calculateMatch(lostItem, foundItem) {
    let score = 0;
    const matchedSignals = [];
    const missingSignals = [];

    // Category Match (Weight: 15%)
    const catLost = normalizeText(lostItem.category);
    const catFound = normalizeText(foundItem.category);
    const categoryMatches = (catLost === catFound) || catLost === 'other' || catFound === 'other' || catLost === 'others' || catFound === 'others';

    if (!categoryMatches) {
      return {
        score: 0,
        confidenceLevel: 'Weak',
        matchedSignals: [],
        missingSignals: ['Different categories'],
        explanation: 'Category mismatch prevents automatic match.',
        factorBreakdown: { category: 0, description: 0, location: 0, brandModel: 0, dateTime: 0, color: 0, visual: 0 },
      };
    }

    if (catLost === catFound && catLost !== 'other' && catLost !== 'others') {
      score += 15;
      matchedSignals.push(`Same category (${lostItem.category})`);
    } else {
      score += 5;
      missingSignals.push('Category generic match');
    }

    // Title / Description Semantic Similarity (Weight: 25%)
    const descLost = (lostItem.item_name || '') + ' ' + (lostItem.description || '');
    const descFound = (foundItem.item_name || '') + ' ' + (foundItem.description || '');
    const semSim = embeddingProvider.calculateSimilarity(descLost, descFound);
    const descScore = Math.round(semSim * 25);
    score += descScore;
    if (descScore >= 15) {
      matchedSignals.push('High semantic description similarity');
    } else if (descScore >= 8) {
      matchedSignals.push('Similar description details');
    } else {
      missingSignals.push('Low description overlap');
    }

    // Location / Building Match (Weight: 15%)
    let locScore = 0;
    const bldLost = normalizeText(lostItem.building || lostItem.lost_location);
    const bldFound = normalizeText(foundItem.building || foundItem.found_location);
    if (bldLost && bldFound && (bldLost === bldFound || areLocationsSynonymous(bldLost, bldFound))) {
      locScore = 15;
      matchedSignals.push(`Same building/location (${lostItem.building || lostItem.lost_location})`);
    } else {
      const sim = calculateTokenSimilarity(lostItem.lost_location, foundItem.found_location);
      locScore = Math.round(sim * 10);
      if (locScore > 0) matchedSignals.push('Proximity in reported location');
      else missingSignals.push('Different reported locations');
    }
    score += locScore;

    // Brand & Model Match (Weight: 20%)
    let brandScore = 0;
    const hasBrand = lostItem.brand && foundItem.brand;
    const hasModel = lostItem.model && foundItem.model;
    if (hasBrand && hasModel && normalizeText(lostItem.brand) === normalizeText(foundItem.brand) && normalizeText(lostItem.model) === normalizeText(foundItem.model)) {
      brandScore = 20;
      matchedSignals.push(`Exact Brand & Model (${lostItem.brand} ${lostItem.model})`);
    } else if (hasBrand && normalizeText(lostItem.brand) === normalizeText(foundItem.brand)) {
      brandScore = 14;
      matchedSignals.push(`Matching brand (${lostItem.brand})`);
    } else if (hasModel && normalizeText(lostItem.model) === normalizeText(foundItem.model)) {
      brandScore = 10;
      matchedSignals.push(`Matching model (${lostItem.model})`);
    } else {
      missingSignals.push('Unverified brand/model');
    }
    score += brandScore;

    // Date & Time Proximity (Weight: 10%)
    const dateScore = calculateDateScore(lostItem.lost_date, foundItem.found_date);
    score += dateScore;
    if (dateScore >= 8) matchedSignals.push('Same or nearby incident date');
    else missingSignals.push('Dates separated by several days');

    // Color Match (Weight: 5%)
    let colorScore = 0;
    if (lostItem.colour && foundItem.colour && areColorsMatching(lostItem.colour, foundItem.colour)) {
      colorScore = 5;
      matchedSignals.push(`Matching color (${lostItem.colour})`);
    } else {
      missingSignals.push('Color unverified');
    }
    score += colorScore;

    // Visual Attributes (Weight: 10%)
    let visualScore = 0;
    if (lostItem.images && lostItem.images.length > 0 && foundItem.images && foundItem.images.length > 0) {
      visualScore = 10;
      matchedSignals.push('Both reports include photographic evidence');
    }
    score += visualScore;

    const finalScore = Math.min(100, Math.round(score));

    let confidenceLevel = 'Weak';
    if (finalScore >= 90) confidenceLevel = 'Very High';
    else if (finalScore >= 75) confidenceLevel = 'High';
    else if (finalScore >= 55) confidenceLevel = 'Possible';

    return {
      score: finalScore,
      confidenceLevel,
      matchedSignals,
      missingSignals,
      reasons: matchedSignals,
      explanation: `Calculated ${confidenceLevel} confidence match (${finalScore}%) based on ${matchedSignals.length} matching signals.`,
      factorBreakdown: {
        category: catLost === catFound ? 15 : 5,
        description: descScore,
        location: locScore,
        brandModel: brandScore,
        dateTime: dateScore,
        color: colorScore,
        visual: visualScore
      }
    };
  }

  async checkMatchesForLostItem(lostItemId) {
    const lostItem = await itemRepository.findLostById(lostItemId);
    if (!lostItem) return [];

    const candidateFoundItems = (await itemRepository.queryFound({ status: 'Available' }))
      .filter(f => String(f.user_id) !== String(lostItem.user_id));

    const matchesFound = [];

    for (const foundItem of candidateFoundItems) {
      const matchResult = this.calculateMatch(lostItem, foundItem);
      const { score, confidenceLevel, matchedSignals, explanation } = matchResult;

      if (score >= MATCHING_CONFIG.AUTO_MATCH_THRESHOLD) {
        const matchId = await matchRepository.upsertMatch(lostItem.id, foundItem.id, score, matchedSignals);

        await notificationRepository.create({
          user_id: lostItem.user_id,
          title: `Match Alert: ${confidenceLevel} Match (${score}%) for "${lostItem.item_name}"`,
          message: `${explanation} Found item at "${foundItem.found_location || 'Campus'}".`,
          type: 'match',
          reference_id: matchId,
          reference_type: 'match',
        });

        await notificationRepository.create({
          user_id: foundItem.user_id,
          title: `Potential Owner Identified: ${score}% match`,
          message: `Your found item "${foundItem.item_name}" matches a reported lost item "${lostItem.item_name}".`,
          type: 'match',
          reference_id: matchId,
          reference_type: 'match',
        });

        await itemRepository.updateLost(lostItem.id, { status: 'Possible Match' });

        matchesFound.push({
          matchId,
          score,
          confidenceLevel,
          matchedSignals,
          explanation,
          foundItem,
        });
      }
    }

    matchesFound.sort((a, b) => b.score - a.score);
    return matchesFound;
  }

  async checkMatchesForFoundItem(foundItemId) {
    const foundItem = await itemRepository.findFoundById(foundItemId);
    if (!foundItem) return [];

    const candidateLostItems = (await itemRepository.queryLost({}))
      .filter(l => (l.status === 'Searching' || l.status === 'Possible Match') && String(l.user_id) !== String(foundItem.user_id));

    const matchesFound = [];

    for (const lostItem of candidateLostItems) {
      const matchResult = this.calculateMatch(lostItem, foundItem);
      const { score, confidenceLevel, matchedSignals, explanation } = matchResult;

      if (score >= MATCHING_CONFIG.AUTO_MATCH_THRESHOLD) {
        const matchId = await matchRepository.upsertMatch(lostItem.id, foundItem.id, score, matchedSignals);

        await notificationRepository.create({
          user_id: lostItem.user_id,
          title: `New Match Discovered: ${confidenceLevel} Match (${score}%)`,
          message: `A found item matching "${lostItem.item_name}" was reported at "${foundItem.found_location || 'Campus'}".`,
          type: 'match',
          reference_id: matchId,
          reference_type: 'match',
        });

        await notificationRepository.create({
          user_id: foundItem.user_id,
          title: `Potential Owner Detected: ${score}% match`,
          message: `Your found item "${foundItem.item_name}" matches a lost report for "${lostItem.item_name}".`,
          type: 'match',
          reference_id: matchId,
          reference_type: 'match',
        });

        await itemRepository.updateLost(lostItem.id, { status: 'Possible Match' });

        matchesFound.push({
          matchId,
          score,
          confidenceLevel,
          matchedSignals,
          explanation,
          lostItem,
        });
      }
    }

    matchesFound.sort((a, b) => b.score - a.score);
    return matchesFound;
  }
}

module.exports = new MatchingService();
