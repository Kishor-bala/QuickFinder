let app;

try {
  const serverModule = require('../apps/api/src/server.js');
  app = serverModule.default || serverModule;
} catch (err) {
  console.error('[Vercel Serverless Fatal] Error loading API server:', err);
  app = (req, res) => {
    res.status(500).json({
      error: 'Serverless Function Initialization Error',
      message: err.message,
      stack: err.stack,
    });
  };
}

module.exports = app;
