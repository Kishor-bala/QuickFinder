const crypto = require('crypto');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Suppress spammy health check logs in dev
    if (originalUrl === '/api/health' || originalUrl === '/health') {
      return;
    }

    const meta = {
      requestId,
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (statusCode >= 500) {
      logger.error(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, meta);
    } else if (statusCode >= 400) {
      logger.warn(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, meta);
    } else {
      logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, meta);
    }
  });

  next();
}

module.exports = {
  requestLogger,
};
