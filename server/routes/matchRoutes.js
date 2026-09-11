const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, matchController.getMyMatches);
router.get('/:id', verifyToken, matchController.getMatchById);
router.put('/:id/dismiss', verifyToken, matchController.dismissMatch);

module.exports = router;
