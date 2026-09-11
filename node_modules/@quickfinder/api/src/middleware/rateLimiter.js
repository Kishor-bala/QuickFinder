const config = require('../config');

// In-memory sliding window rate limiter
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const max = options.max || config.rateLimit.maxRequests;
  const message = options.message || 'Too many requests from this IP, please try again later.';

  const hits = new Map();

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, records] of hits.entries()) {
      const valid = records.filter((timestamp) => now - timestamp < windowMs);
      if (valid.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, valid);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // Skip rate limiting in test environment
    if (config.env === 'test') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const timestamps = hits.get(ip) || [];

    // Filter to current sliding window
    const windowStart = now - windowMs;
    const activeHits = timestamps.filter((t) => t > windowStart);

    if (activeHits.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        message,
      });
    }

    activeHits.push(now);
    hits.set(ip, activeHits);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - activeHits.length));

    next();
  };
}

const apiRateLimiter = createRateLimiter();
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMaxRequests,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

module.exports = {
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
};
