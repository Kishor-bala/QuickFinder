/**
 * Shared Input Validation Functions
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function validateRegistration(data) {
  const errors = {};
  if (!data.name || !data.name.trim()) errors.name = 'Full name is required.';
  if (!data.user_id || !data.user_id.trim()) errors.user_id = 'User ID is required.';
  if (!isValidEmail(data.email)) errors.email = 'Valid email address is required.';
  if (!isValidPhone(data.phone)) errors.phone = 'Valid phone number is required.';
  if (!isValidPassword(data.password)) errors.password = 'Password must be at least 6 characters.';
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateItemReport(data, type = 'lost') {
  const errors = {};
  if (!data.item_name || !data.item_name.trim()) errors.item_name = 'Item name is required.';
  if (!data.category || !data.category.trim()) errors.category = 'Category is required.';
  
  const dateField = type === 'lost' ? 'lost_date' : 'found_date';
  const locField = type === 'lost' ? 'lost_location' : 'found_location';
  
  const dateVal = data[dateField];
  if (!dateVal || !dateVal.trim()) {
    errors[dateField] = `${type === 'lost' ? 'Lost' : 'Found'} date is required.`;
  } else {
    const parts = dateVal.trim().split('-');
    if (parts.length === 3) {
      const selectedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const now = new Date();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      if (selectedDate > todayEnd) {
        errors[dateField] = `${type === 'lost' ? 'Lost' : 'Found'} date cannot be in the future.`;
      }
    }
  }
  if (!data[locField] || !data[locField].trim()) {
    errors[locField] = `${type === 'lost' ? 'Lost' : 'Found'} location is required.`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  validateRegistration,
  validateItemReport,
};
