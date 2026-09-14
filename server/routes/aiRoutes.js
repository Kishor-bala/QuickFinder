const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');

router.post('/extract', verifyToken, aiController.extractAttributes);
router.post('/enhance', verifyToken, aiController.enhanceDescription);

module.exports = router;
