const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/request', chatController.sendMessageRequest);
router.put('/request/:requestId', chatController.respondToMessageRequest);
router.post('/conversation/:convId/message', chatController.sendMessage);
router.get('/overview', chatController.getChatOverview);

module.exports = router;
