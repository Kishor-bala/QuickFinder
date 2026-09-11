/**
 * Quick Finder Domain Constants & Enumerations
 */

const ITEM_CATEGORIES = [
  'Mobile',
  'Laptop',
  'Wallet',
  'ID Card',
  'Keys',
  'Bag',
  'Books',
  'Electronics',
  'Accessories',
  'Other',
];

const ITEM_COLOURS = [
  'Black',
  'Blue',
  'Silver',
  'White',
  'Brown',
  'Red',
  'Green',
  'Gold',
  'Yellow',
  'Purple',
  'Pink',
  'Other',
];

const LOST_ITEM_STATUS = {
  SEARCHING: 'Searching',
  POSSIBLE_MATCH: 'Possible Match',
  CLAIM_REQUESTED: 'Claim Requested',
  CLAIMED: 'Claimed',
  CLOSED: 'Closed',
};

const FOUND_ITEM_STATUS = {
  AVAILABLE: 'Available',
  CLAIM_REQUESTED: 'Claim Requested',
  CLAIMED: 'Claimed',
  RESOLVED: 'Resolved',
};

const CLAIM_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

const NOTIFICATION_TYPE = {
  MATCH: 'match',
  CLAIM: 'claim',
  CLAIM_ACCEPTED: 'claim_accepted',
  CLAIM_REJECTED: 'claim_rejected',
  SYSTEM: 'system',
};

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

// Multi-Factor Matching Engine Configuration Weights (Total 100%)
const MATCHING_CONFIG = {
  WEIGHTS: {
    NAME: 30,
    LOCATION: 25,
    DATE: 15,
    COLOUR: 10,
    BRAND: 10,
    DETAILS: 10,
  },
  AUTO_MATCH_THRESHOLD: 40, // Score threshold to notify user & flag as possible match
  HIGH_CONFIDENCE_THRESHOLD: 75,
};

// Location synonyms dictionary for flexible matching
const LOCATION_SYNONYMS = {
  canteen: ['cafeteria', 'canteen', 'food court', 'mess', 'cafe', 'dining hall', 'snack bar'],
  cafeteria: ['cafeteria', 'canteen', 'food court', 'mess', 'cafe', 'dining hall'],
  library: ['library', 'reading room', 'study hall', 'central library', 'book store'],
  ground: ['ground', 'playground', 'stadium', 'sports complex', 'football field', 'cricket ground', 'basketball court'],
  auditorium: ['auditorium', 'hall', 'seminar hall', 'conference hall', 'assembly hall'],
  lab: ['lab', 'laboratory', 'computer lab', 'physics lab', 'chemistry lab', 'electronics lab'],
  hostel: ['hostel', 'dorm', 'dormitory', 'room', 'hostel mess', 'block'],
  parking: ['parking', 'bike stand', 'cycle stand', 'car park', 'vehicle parking'],
  reception: ['reception', 'lobby', 'entrance', 'front desk', 'gate', 'main gate', 'security post'],
  classroom: ['classroom', 'lecture hall', 'class', 'room', 'block a', 'block b', 'seminar room'],
};

// Color family map for flexible matching
const COLOR_SYNONYMS = {
  black: ['black', 'dark', 'charcoal', 'matte black', 'midnight'],
  blue: ['blue', 'navy', 'dark blue', 'light blue', 'sky blue', 'cyan'],
  silver: ['silver', 'grey', 'gray', 'space grey', 'space gray', 'metallic'],
  white: ['white', 'cream', 'ivory', 'off-white', 'pearl'],
  red: ['red', 'maroon', 'crimson', 'burgundy', 'rose'],
  brown: ['brown', 'tan', 'beige', 'khaki', 'leather brown', 'chocolate'],
  green: ['green', 'olive', 'dark green', 'emerald', 'mint'],
  yellow: ['yellow', 'gold', 'golden', 'mustard'],
  purple: ['purple', 'violet', 'lavender', 'magenta'],
  pink: ['pink', 'rose gold', 'coral', 'peach'],
};

module.exports = {
  ITEM_CATEGORIES,
  ITEM_COLOURS,
  LOST_ITEM_STATUS,
  FOUND_ITEM_STATUS,
  CLAIM_STATUS,
  NOTIFICATION_TYPE,
  USER_ROLES,
  MATCHING_CONFIG,
  LOCATION_SYNONYMS,
  COLOR_SYNONYMS,
};
