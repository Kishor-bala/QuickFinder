const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  logger.error('API Error Encountered:', {
    message: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    requestId: req.id,
  });

  // Handle Multer upload errors
  if (err.message && err.message.includes('Invalid image format')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds 5MB limit.',
    });
  }

  // Handle SQLite constraint errors (e.g. UNIQUE email/phone)
  if (err.message && (err.message.includes('UNIQUE constraint failed') || err.message.includes('SQLITE_CONSTRAINT'))) {
    let msg = 'A record with these details already exists.';
    if (err.message.includes('users.email')) msg = 'This email address is already registered.';
    else if (err.message.includes('users.phone')) msg = 'This phone number is already registered to another account.';
    else if (err.message.includes('users.user_id')) msg = 'This Unique User ID is already taken.';
    return res.status(409).json({ success: false, message: msg });
  }

  // Handle known operational AppErrors
  if (err instanceof AppError) {
    const response = {
      success: false,
      message: err.message,
    };
    if (err.details) response.details = err.details;
    return res.status(err.statusCode).json(response);
  }

  // Handle unexpected errors — mask internal implementation details completely
  const statusCode = err.statusCode || err.status || 500;
  const safeMessage = statusCode >= 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Action failed. Please try again.';

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
}

module.exports = {
  errorHandler,
};
