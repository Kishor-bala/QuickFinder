const matchRepository = require('../repositories/matchRepository');
const notificationRepository = require('../repositories/notificationRepository');
const itemRepository = require('../repositories/itemRepository');
const {
  LOCATION_SYNONYMS,
  COLOR_SYNONYMS,
  MATCHING_CONFIG,
} = require('../shared');

// Normalize text: lowercase, remove non-alphanumeric, trim
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokenize text into words, removing common stopwords
function getTokens(text) {
  const norm = normalizeText(text);
  if (!norm) return [];
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'it', 'my', 'some', 'near']);
  return norm.split(' ').filter(w => w.length > 1 && !stopwords.has(w));
}

// Calculate token similarity (Jaccard + substring presence)
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
      // Partial prefix/suffix match for tokens >= 4 chars
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

// Check location synonym match
function areLocationsSynonymous(loc1, loc2) {
  const l1 = normalizeText(loc1);
  const l2 = normalizeText(loc2);
  if (l1 === l2) return true;
  if (l1.includes(l2) || l2.includes(l1)) return true;

  for (const [key, synonyms] of Object.entries(LOCATION_SYNONYMS)) {
    const hasL1 = synonyms.some(s => l1.includes(s) || s.includes(l1));
    const hasL2 = synonyms.some(s => l2.includes(s) || s.includes(l2));
    if (hasL1 && hasL2) return true;
  }
  return false;
}

// Check color family match
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

// Calculate date proximity score
function calculateDateScore(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 0;
  try {
    const s1 = String(dateStr1).split('T')[0];
    const s2 = String(dateStr2).split('T')[0];
    if (s1 === s2) return 15; // Same calendar day: 15%

    const [y1, m1, d1] = s1.split('-').map(Number);
    const [y2, m2, d2] = s2.split('-').map(Number);
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const diffDays = Math.round(Math.abs((date1 - date2) / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) return 15; // Same day: 15%
    if (diffDays <= 2) return 12; // Within 2 days: 12%
    if (diffDays <= 5) return 8;  // Within 5 days: 8%
    if (diffDays <= 10) return 4; // Within 10 days: 4%
    return 0;
  } catch {
    return 0;
  }
}

class MatchingService {
  calculateMatch(lostItem, foundItem) {
    let score = 0;
    const reasons = [];
    const factorBreakdown = {};

    // Mandatory Category Filter: If categories are totally different and neither is 'Other', hard penalty
    const catLost = normalizeText(lostItem.category);
    const catFound = normalizeText(foundItem.category);
    const categoryMatches = (catLost === catFound) || catLost === 'other' || catFound === 'other';

    if (!categoryMatches) {
      return {
        score: 0,
        reasons: ['Different categories'],
        factorBreakdown: { category: 0, name: 0, location: 0, date: 0, colour: 0, brand: 0, details: 0 },
      };
    }

    if (catLost === catFound && catLost !== 'other') {
      reasons.push(`Same category (${lostItem.category})`);
    }

    // 1. Item Name Similarity (Weight: 30%)
    const nameSim = calculateTokenSimilarity(lostItem.item_name, foundItem.item_name);
    const nameScore = Math.round(nameSim * 30);
    score += nameScore;
    factorBreakdown.name = nameScore;
    if (nameScore >= 20) {
      reasons.push('High item name match');
    } else if (nameScore >= 10) {
      reasons.push('Similar item name');
    }

    // 2. Location Match (Weight: 25%)
    let locationScore = 0;
    if (areLocationsSynonymous(lostItem.lost_location, foundItem.found_location)) {
      locationScore = 25;
      reasons.push(`Similar location (${lostItem.lost_location} ↔ ${foundItem.found_location})`);
    } else {
      const locSim = calculateTokenSimilarity(lostItem.lost_location, foundItem.found_location);
      if (locSim > 0.4) {
        locationScore = Math.round(locSim * 20);
        reasons.push('Near reported location');
      }
    }
    score += locationScore;
    factorBreakdown.location = locationScore;

    // 3. Date Proximity (Weight: 15%)
    const dateScore = calculateDateScore(lostItem.lost_date, foundItem.found_date);
    score += dateScore;
    factorBreakdown.date = dateScore;
    if (dateScore === 15) {
      reasons.push('Exact same date reported');
    } else if (dateScore >= 8) {
      reasons.push('Dates within close proximity');
    }

    // 4. Colour Match (Weight: 10%)
    let colourScore = 0;
    if (lostItem.colour && foundItem.colour) {
      if (areColorsMatching(lostItem.colour, foundItem.colour)) {
        colourScore = 10;
        reasons.push(`Matching color shade (${lostItem.colour})`);
      }
    }
    score += colourScore;
    factorBreakdown.colour = colourScore;

    // 5. Brand / Model Match (Weight: 10%)
    let brandScore = 0;
    const hasBrandOrModel = (lostItem.brand && foundItem.brand) || (lostItem.model && foundItem.model);
    if (hasBrandOrModel) {
      let brandMatch = false;
      let modelMatch = false;

      if (lostItem.brand && foundItem.brand) {
        brandMatch = calculateTokenSimilarity(lostItem.brand, foundItem.brand) >= 0.7;
      }
      if (lostItem.model && foundItem.model) {
        modelMatch = calculateTokenSimilarity(lostItem.model, foundItem.model) >= 0.6;
      }

      if (brandMatch && modelMatch) {
        brandScore = 10;
        reasons.push(`Exact Brand & Model match (${lostItem.brand} ${lostItem.model})`);
      } else if (brandMatch) {
        brandScore = 7;
        reasons.push(`Matching brand (${lostItem.brand})`);
      } else if (modelMatch) {
        brandScore = 5;
        reasons.push(`Matching model`);
      }
    } else {
      // Check if brand token appears in found item name or description
      if (lostItem.brand && (normalizeText(foundItem.item_name).includes(normalizeText(lostItem.brand)) ||
                             normalizeText(foundItem.description).includes(normalizeText(lostItem.brand)))) {
        brandScore = 6;
        reasons.push(`Brand mentioned in details (${lostItem.brand})`);
      }
    }
    score += brandScore;
    factorBreakdown.brand = brandScore;

    // 6. Description & Identifying Details Overlap (Weight: 10%)
    let detailsScore = 0;
    const descLost = (lostItem.description || '') + ' ' + (lostItem.identifying_details || '');
    const descFound = (foundItem.description || '') + ' ' + (foundItem.identifying_details || '');
    const descSim = calculateTokenSimilarity(descLost, descFound);
    detailsScore = Math.round(descSim * 10);
    score += detailsScore;
    factorBreakdown.details = detailsScore;
    if (detailsScore >= 5) {
      reasons.push('Identifying details overlap');
    }

    // Final score capped at 100
    const finalScore = Math.min(100, score);
    return {
      score: finalScore,
      reasons: reasons.length ? reasons : ['General category resemblance'],
      factorBreakdown,
    };
  }

  // Scenario 2: Owner reports lost item -> scan existing found items
  async checkMatchesForLostItem(lostItemId) {
    const lostItem = await itemRepository.findLostById(lostItemId);
    if (!lostItem) return [];

    const candidateFoundItems = (await itemRepository.queryFound({ status: 'Available' }))
      .filter(f => String(f.user_id) !== String(lostItem.user_id));

    const matchesFound = [];

    for (const foundItem of candidateFoundItems) {
      const { score, reasons } = this.calculateMatch(lostItem, foundItem);

      if (score >= MATCHING_CONFIG.AUTO_MATCH_THRESHOLD) {
        const matchId = await matchRepository.upsertMatch(lostItem.id, foundItem.id, score, reasons);

        // Notify lost item owner
        await notificationRepository.create({
          user_id: lostItem.user_id,
          title: `Match Found: ${score}% match for your "${lostItem.item_name}"`,
          message: `A found item "${foundItem.item_name}" discovered at "${foundItem.found_location}" matches your report (${reasons.slice(0, 2).join(', ')}).`,
          type: 'match',
          reference_id: matchId,
          reference_type: 'match',
        });

        // Notify finder
        await notificationRepository.create({
          user_id: foundItem.user_id,
          title: `Potential Owner Detected: ${score}% match`,
          message: `Your found item "${foundItem.item_name}" matches a reported lost item "${lostItem.item_name}".`,
          type: 'match',
          reference_id: matchId,
          reference_type: 'match',
        });

        await itemRepository.updateLost(lostItem.id, { status: 'Possible Match' });

        matchesFound.push({
          matchId,
          score,
          reasons,
          foundItem: {
            id: foundItem.id,
            item_name: foundItem.item_name,
            category: foundItem.category,
            found_location: foundItem.found_location,
            found_date: foundItem.found_date,
            colour: foundItem.colour,
            brand: foundItem.brand,
            image: foundItem.images && foundItem.images.length ? foundItem.images[0] : null,
          },
        });
      }
    }

    matchesFound.sort((a, b) => b.score - a.score);
    return matchesFound;
  }

  // Scenario 1: Finder uploads found item -> scan existing lost reports
  async checkMatchesForFoundItem(foundItemId) {
    const foundItem = await itemRepository.findFoundById(foundItemId);
    if (!foundItem) return [];

    const candidateLostItems = (await itemRepository.queryLost({}))
      .filter(l => (l.status === 'Searching' || l.status === 'Possible Match') && String(l.user_id) !== String(foundItem.user_id));

    const matchesFound = [];

    for (const lostItem of candidateLostItems) {
      const { score, reasons } = this.calculateMatch(lostItem, foundItem);

      if (score >= MATCHING_CONFIG.AUTO_MATCH_THRESHOLD) {
        const matchId = await matchRepository.upsertMatch(lostItem.id, foundItem.id, score, reasons);

        await notificationRepository.create({
          user_id: lostItem.user_id,
          title: `New Match Alert: ${score}% match for your "${lostItem.item_name}"`,
          message: `Someone just found an item "${foundItem.item_name}" at "${foundItem.found_location}" that matches your lost item report.`,
          type: 'match',
          reference_id: matchId,
          reference_type: 'match',
        });

        await notificationRepository.create({
          user_id: foundItem.user_id,
          title: `Match Detected: ${score}% match`,
          message: `Your found item "${foundItem.item_name}" matches a lost report for "${lostItem.item_name}".`,
          type: 'match',
          reference_id: matchId,
          reference_type: 'match',
        });

        await itemRepository.updateLost(lostItem.id, { status: 'Possible Match' });

        matchesFound.push({
          matchId,
          score,
          reasons,
          lostItem: {
            id: lostItem.id,
            item_name: lostItem.item_name,
            category: lostItem.category,
            lost_location: lostItem.lost_location,
            lost_date: lostItem.lost_date,
            colour: lostItem.colour,
            brand: lostItem.brand,
            image: lostItem.images && lostItem.images.length ? lostItem.images[0] : null,
          },
        });
      }
    }

    matchesFound.sort((a, b) => b.score - a.score);
    return matchesFound;
  }
}

module.exports = new MatchingService();
