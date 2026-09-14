const express = require('express');
const router = express.Router();
const handoverController = require('../controllers/handoverController');
const { verifyToken } = require('../middleware/auth');

router.get('/locations', handoverController.getLocations);
router.post('/token', verifyToken, handoverController.createToken);
router.post('/verify', verifyToken, handoverController.verifyToken);

module.exports = router;
