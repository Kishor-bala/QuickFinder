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

const SUPER_ADMIN_EMAILS = [
  'kishorbala003@gmail.com',
  'kishorbala9360@gmail.com',
];

const CAMPUS_LOCATIONS = [
  {
    building: 'Academic Block A',
    floors: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'],
    areas: ['Computer Labs', 'Electronics Lab', 'Faculty Room', 'Classroom 101-115', 'Seminar Hall A']
  },
  {
    building: 'Academic Block B',
    floors: ['Ground Floor', '1st Floor', '2nd Floor'],
    areas: ['Physics Lab', 'Chemistry Lab', 'Mathematics Dept', 'Classroom 201-215']
  },
  {
    building: 'Central Library',
    floors: ['Ground Floor (Reference)', '1st Floor (Digital Library)', '2nd Floor (Reading Hall)'],
    areas: ['Book Issue Counter', 'Digital Library Section', 'Quiet Study Area', 'Newspaper Zone']
  },
  {
    building: 'Campus Canteen & Food Court',
    floors: ['Ground Floor'],
    areas: ['Main Dining Area', 'Juice Shop Corner', 'South Indian Snacks Counter', 'Outdoor Pavilion']
  },
  {
    building: 'Student Hostels',
    floors: ['Block 1', 'Block 2', 'Block 3', 'Girls Hostel A', 'Girls Hostel B'],
    areas: ['Hostel Mess', 'Common Room', 'Lobby & Reception', 'Courtyard']
  },
  {
    building: 'Sports Complex & Grounds',
    floors: ['Ground Level'],
    areas: ['Main Football Field', 'Cricket Pavilion', 'Basketball Court', 'Indoor Badminton Court', 'Gymnasium']
  },
  {
    building: 'Auditorium & Administrative Block',
    floors: ['Main Auditorium', 'Administrative Office', 'Principal Office Corridor'],
    areas: ['Main Hall', 'Stage Area', 'Green Room', 'Fee Counter Lobby']
  },
  {
    building: 'Campus Parking & Bus Bay',
    floors: ['Ground Level'],
    areas: ['Student Two-Wheeler Stand', 'Faculty Car Park', 'College Bus Bay 1-10', 'Main Security Gate']
  }
];

const ITEM_SUBCATEGORIES = {
  'Mobile': ['Smartphones', 'Feature Phones', 'Tablets / iPads', 'Smartwatches', 'Phone Accessories / Cases'],
  'Laptop': ['Laptops / MacBooks', 'Laptop Chargers', 'Laptop Bags / Sleeves', 'Pen Drives / Hard Drives'],
  'Wallet': ['Men Leather Wallet', 'Women Purse / Clutch', 'Card Holder', 'Coin Pouch'],
  'ID Card': ['Student Roll ID Card', 'Staff / Faculty ID Card', 'Library Pass', 'Bus Pass'],
  'Keys': ['Bike / Vehicle Key', 'Hostel Room Key', 'Keychain / Lanyard', 'Padlock Key'],
  'Bag': ['Backpack', 'College Bag', 'Side Bag / Sling', 'Travel Duffel'],
  'Books': ['Textbooks', 'Class Notebooks', 'Lab Record Books', 'Novel / Magazine'],
  'Electronics': ['Headphones / Earbuds', 'Power Banks', 'Calculators (Casio)', 'Adapters / Cables'],
  'Accessories': ['Eyeglasses / Sunglasses', 'Watches', 'Water Bottles', 'Umbrellas'],
  'Other': ['Clothing / Jackets', 'Jewellery / Rings', 'Documents / Certificates', 'General Items']
};

const LOST_ITEM_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Searching',
  MATCH_FOUND: 'Possible Match',
  CLAIM_PENDING: 'Claim Pending',
  RETURNED: 'Returned',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived',
};

const FOUND_ITEM_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Available',
  MATCH_FOUND: 'Possible Match',
  CLAIM_PENDING: 'Claim Pending',
  VERIFICATION: 'Verification',
  HANDED_OVER: 'Handed Over',
  RETURNED: 'Returned',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

const CLAIM_STATUS = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  VERIFICATION_REQUIRED: 'Verification Required',
  VERIFIED: 'Verified',
  APPROVED: 'Approved',
  HANDOVER_PENDING: 'Handover Pending',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
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
  STAFF: 'staff',
};

// 8-Factor Modular Matching Weights (Default total 1.0)
const MATCHING_CONFIG = {
  DEFAULT_WEIGHTS: {
    category: 0.20,
    subcategory: 0.15,
    brand: 0.10,
    model: 0.15,
    color: 0.10,
    location: 0.10,
    date: 0.10,
    description: 0.10,
  },
  MATCH_THRESHOLD: 0.70, // Candidates surfaced when overallScore >= 0.70
  HIGH_CONFIDENCE_THRESHOLD: 0.85,
  AUTO_MATCH_THRESHOLD: 70, // Percentage scale for backwards compatibility
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
  SUPER_ADMIN_EMAILS,
  CAMPUS_LOCATIONS,
  ITEM_SUBCATEGORIES,
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
