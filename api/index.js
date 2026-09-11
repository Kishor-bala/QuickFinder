let app;

try {
  app = require('../apps/api/src/server.js');
} catch (err) {
  console.error('[Vercel Serverless Fatal] Error loading API server:', err);
  app = (req, res) => {
    res.status(500).json({
      error: 'Serverless Function Initialization Error',
      message: err.message,
      tip: 'Check Vercel Environment Variables (FIREBASE_SERVICE_ACCOUNT, JWT_SECRET)',
    });
  };
}

module.exports = app;
