const matchRepository = require('../repositories/matchRepository');
const notificationRepository = require('../repositories/notificationRepository');
const itemRepository = require('../repositories/itemRepository');
const auditService = require('./auditService');
const { MATCHING_CONFIG } = require('../shared/constants');

const { matchCategory } = require('./matching/categoryMatcher');
const { matchSubcategory } = require('./matching/subcategoryMatcher');
const { matchBrand } = require('./matching/brandMatcher');
const { matchModel } = require('./matching/modelMatcher');
const { matchColor } = require('./matching/colorMatcher');
const { matchLocation } = require('./matching/locationMatcher');
const { matchDate } = require('./matching/dateMatcher');
const { matchDescription } = require('./matching/descriptionMatcher');
const { checkDuplicates } = require('./matching/duplicateDetector');

/**
 * Category-aware dynamic weight strategy
 */
function getCategoryWeights(category) {
  const norm = (category || '').toLowerCase().trim();

  if (norm.includes('mobile') || norm.includes('phone') || norm.includes('laptop') || norm.includes('tablet')) {
    // Electronics: Model & Brand matter more
    return {
      category: 0.15,
      subcategory: 0.10,
      brand: 0.20,
      model: 0.25,
      color: 0.10,
      location: 0.08,
      date: 0.07,
      description: 0.05,
    };
  }

  if (norm.includes('wallet') || norm.includes('bag') || norm.includes('purse')) {
    // Wallets & Bags: Location, Color & Description matter more
    return {
      category: 0.20,
      subcategory: 0.15,
      brand: 0.05,
      model: 0.05,
      color: 0.20,
      location: 0.15,
      date: 0.10,
      description: 0.10,
    };
  }

  // Default balanced weights
  return MATCHING_CONFIG.DEFAULT_WEIGHTS;
}

class MatchingService {
  /**
   * 8-Factor Modular Match Calculation
   */
  calculateMatch(lostItem, foundItem) {
    if (!lostItem || !foundItem) {
      return {
        overallScore: 0,
        score: 0,
        confidenceLevel: 'LOW',
        factors: {},
        matchedSignals: [],
        missingSignals: ['Missing item data'],
        explanation: 'Invalid item data provided for match calculation.'
      };
    }

    const weights = getCategoryWeights(lostItem.category);

    const fCategory = matchCategory(lostItem.category, foundItem.category);
    
    // Quick exit if categories are completely incompatible
    if (fCategory === 0) {
      return {
        overallScore: 0,
        score: 0,
        confidenceLevel: 'LOW',
        factors: { category: 0, subcategory: 0, brand: 0, model: 0, color: 0, location: 0, date: 0, description: 0 },
        matchedSignals: [],
        missingSignals: ['Different categories'],
        explanation: 'Category mismatch prevents automatic match.',
      };
    }

    const fSubcategory = matchSubcategory(lostItem.subcategory, foundItem.subcategory);
    const fBrand = matchBrand(lostItem.brand, foundItem.brand);
    const fModel = matchModel(lostItem.model, foundItem.model);
    const fColor = matchColor(lostItem.colour, foundItem.colour);
    const fLocation = matchLocation(lostItem.lost_location, foundItem.found_location, lostItem.building, foundItem.building);
    const fDate = matchDate(lostItem.lost_date, foundItem.found_date);
    
    const desc1 = (lostItem.item_name || '') + ' ' + (lostItem.description || '');
    const desc2 = (foundItem.item_name || '') + ' ' + (foundItem.description || '');
    const fDescription = matchDescription(desc1, desc2);

    const factors = {
      category: fCategory,
      subcategory: fSubcategory,
      brand: fBrand,
      model: fModel,
      color: fColor,
      location: fLocation,
      date: fDate,
      description: fDescription,
    };

    const rawScore =
      (fCategory * weights.category) +
      (fSubcategory * weights.subcategory) +
      (fBrand * weights.brand) +
      (fModel * weights.model) +
      (fColor * weights.color) +
      (fLocation * weights.location) +
      (fDate * weights.date) +
      (fDescription * weights.description);

    const overallScore = Math.min(1.0, Math.max(0, parseFloat(rawScore.toFixed(2))));
    const scorePercentage = Math.round(overallScore * 100);

    let confidenceLevel = 'LOW';
    if (overallScore >= MATCHING_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
      confidenceLevel = 'VERY_HIGH';
    } else if (overallScore >= MATCHING_CONFIG.MATCH_THRESHOLD) {
      confidenceLevel = 'HIGH';
    } else if (overallScore >= 0.50) {
      confidenceLevel = 'MEDIUM';
    }

    const matchedSignals = [];
    const missingSignals = [];

    if (fCategory >= 0.8) matchedSignals.push(`Same Category (${lostItem.category})`);
    if (fSubcategory >= 0.8) matchedSignals.push('Matching Subcategory');
    if (fBrand >= 0.8) matchedSignals.push(`Matching Brand (${lostItem.brand})`);
    if (fModel >= 0.8) matchedSignals.push(`Matching Model (${lostItem.model})`);
    if (fColor >= 0.8) matchedSignals.push(`Matching Color (${lostItem.colour})`);
    if (fLocation >= 0.8) matchedSignals.push('Nearby Campus Location');
    if (fDate >= 0.8) matchedSignals.push('Incident Date Proximity');
    if (fDescription >= 0.7) matchedSignals.push('Description Detail Similarity');

    if (fBrand < 0.5 && lostItem.brand) missingSignals.push('Unverified brand');
    if (fLocation < 0.5) missingSignals.push('Different reported locations');

    return {
      overallScore,
      score: scorePercentage, // percentage scale compatibility
      confidenceLevel,
      factors,
      weights,
      matchedSignals,
      missingSignals,
      reasons: matchedSignals,
      explanation: `Calculated ${confidenceLevel} confidence match (${scorePercentage}%) based on ${matchedSignals.length} matching signals.`,
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
      const { overallScore, score, confidenceLevel, matchedSignals, explanation, factors } = matchResult;

      if (overallScore >= MATCHING_CONFIG.MATCH_THRESHOLD) {
        const matchId = await matchRepository.upsertMatch(lostItem.id, foundItem.id, score, matchedSignals);

        await auditService.recordEvent({
          actorId: lostItem.user_id,
          actorRole: 'SYSTEM',
          action: 'MATCH_DETECTED',
          targetType: 'MATCH',
          targetId: matchId,
          itemId: lostItem.id,
          metadata: { lostItemId: lostItem.id, foundItemId: foundItem.id, score, confidenceLevel, factors }
        });

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
          overallScore,
          score,
          confidenceLevel,
          matchedSignals,
          explanation,
          factors,
          foundItem,
        });
      }
    }

    matchesFound.sort((a, b) => b.overallScore - a.overallScore);
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
      const { overallScore, score, confidenceLevel, matchedSignals, explanation, factors } = matchResult;

      if (overallScore >= MATCHING_CONFIG.MATCH_THRESHOLD) {
        const matchId = await matchRepository.upsertMatch(lostItem.id, foundItem.id, score, matchedSignals);

        await auditService.recordEvent({
          actorId: foundItem.user_id,
          actorRole: 'SYSTEM',
          action: 'MATCH_DETECTED',
          targetType: 'MATCH',
          targetId: matchId,
          itemId: foundItem.id,
          metadata: { lostItemId: lostItem.id, foundItemId: foundItem.id, score, confidenceLevel, factors }
        });

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
          overallScore,
          score,
          confidenceLevel,
          matchedSignals,
          explanation,
          factors,
          lostItem,
        });
      }
    }

    matchesFound.sort((a, b) => b.overallScore - a.overallScore);
    return matchesFound;
  }

  detectDuplicates(newItem, existingItems) {
    return checkDuplicates(newItem, existingItems);
  }
}

module.exports = new MatchingService();
