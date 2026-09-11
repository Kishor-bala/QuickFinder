const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const logger = require('./utils/logger');

// Security & Observability Middleware
const { securityHeaders } = require('./middleware/security');
const { requestLogger } = require('./middleware/requestLogger');
const { apiRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const lostRoutes = require('./routes/lostRoutes');
const foundRoutes = require('./routes/foundRoutes');
const matchRoutes = require('./routes/matchRoutes');
const claimRoutes = require('./routes/claimRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Ensure upload directories exist safely (Vercel / serverless safe)
try {
  const uploadDirs = [
    config.uploadDir,
    path.join(config.uploadDir, 'items'),
    path.join(config.uploadDir, 'profiles'),
    path.join(config.uploadDir, 'proofs'),
  ];
  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
} catch (err) {
  logger.warn(`⚠️ Could not create upload directory (${err.message}). Safe fallback active.`);
}

// Helper to unwrap ESM/CJS interop modules in Vercel bundler environment
const getHandler = (mod) => (mod && typeof mod === 'object' && mod.default ? mod.default : mod);

const app = express();

// Security and utility middleware
app.use(getHandler(securityHeaders));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(getHandler(requestLogger));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(config.uploadDir));

// Rate limiting on API routes
app.use('/api', getHandler(apiRateLimiter));

// Health Probes for Docker/Kubernetes/Monitoring
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Quick Finder API',
    status: 'online',
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'healthy';
  try {
    const { getFirebaseDb } = require('./config/firebaseAdmin');
    const db = getFirebaseDb();
    await db.ref('_healthcheck').once('value');
  } catch (err) {
    dbStatus = 'unhealthy: ' + err.message;
  }

  const memoryUsage = process.memoryUsage();

  res.status(dbStatus === 'healthy' ? 200 : 503).json({
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    app: 'Quick Finder API',
    environment: config.env,
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatus,
      driver: 'Firebase Realtime Database',
    },
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routing Table
app.use('/api/auth', getHandler(authRoutes));
app.use('/api/lost-items', getHandler(lostRoutes));
app.use('/api/found-items', getHandler(foundRoutes));
app.use('/api/matches', getHandler(matchRoutes));
app.use('/api/claims', getHandler(claimRoutes));
app.use('/api/notifications', getHandler(notificationRoutes));
app.use('/api/admin', getHandler(adminRoutes));

// 404 Handler for unmatched endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Requested endpoint "${req.method} ${req.originalUrl}" not found.`,
  });
});

// Centralized Error Handling Pipeline
app.use(getHandler(errorHandler));

// Server startup and graceful shutdown lifecycle
let server = null;

if (config.env !== 'test' && !process.env.VERCEL) {
  server = app.listen(config.port, async () => {
    logger.info('========================================');
    logger.info(`🚀 Quick Finder API running on port ${config.port} [${config.env}]`);
    logger.info(`🔍 Database Driver: Firebase Realtime Database`);
    logger.info(`📍 Base API Endpoint: http://localhost:${config.port}/api`);
    logger.info(`❤️ Health Check: http://localhost:${config.port}/api/health`);
    logger.info('========================================');

    // Eagerly warm up Firebase connection so the first real request is instant.
    // Without this, the first login/register triggers a cold Firebase handshake
    // that takes 3-10 seconds and shows users "Backend starting up..." errors.
    try {
      const { getFirebaseDb } = require('./config/firebaseAdmin');
      await getFirebaseDb().ref('_healthcheck').set({ ts: Date.now() });
      logger.info('✅ Firebase connection warmed up successfully.');
    } catch (err) {
      logger.warn(`⚠️ Firebase warm-up failed: ${err.message}`);
    }

    // Keep-alive ping: pings the server's own /health endpoint every 14 minutes
    // to prevent free-tier hosts (Render, Railway) from spinning the server down.
    // This is harmless in production and saves users from 30-60s cold-start waits.
    const KEEP_ALIVE_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
    setInterval(async () => {
      try {
        const { getFirebaseDb } = require('./config/firebaseAdmin');
        await getFirebaseDb().ref('_healthcheck').set({ ts: Date.now() });
      } catch {
        // Silently ignore keep-alive errors
      }
    }, KEEP_ALIVE_INTERVAL_MS).unref();
  });

  function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });

      // Force shutdown after 10s if connections fail to drain
      setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000).unref();
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
