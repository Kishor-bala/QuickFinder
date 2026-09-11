const express = require('express');
const router = express.Router();
const lostController = require('../controllers/lostController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
};

router.post('/', verifyToken, upload.array('images', 5), lostController.createLostItem);
router.get('/', optionalAuth, lostController.getLostItems);
router.get('/:id', optionalAuth, lostController.getLostItemById);
router.put('/:id', verifyToken, lostController.updateLostItem);
router.delete('/:id', verifyToken, lostController.deleteLostItem);

module.exports = router;
