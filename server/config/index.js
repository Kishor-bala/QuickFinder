const path = require('path');
const fs = require('fs');

// Load .env from project root
const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  // Fallback to default dotenv lookup
  require('dotenv').config();
}

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  jwtSecret: process.env.JWT_SECRET || 'quick_finder_super_secret_jwt_key_2026_campus_lost_and_found',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: process.env.UPLOAD_DIR || (isVercel ? '/tmp/uploads' : path.join(__dirname, '..', '..', 'uploads')),
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'firebase-service-account.json'),
  twoFactorApiKey: process.env.TWO_FACTOR_API_KEY || '',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 50,
  },
};

module.exports = config;
