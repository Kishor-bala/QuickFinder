const express = require('express');
const router = express.Router();
const foundController = require('../controllers/foundController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Optional auth helper to check if user is logged in for contact masking
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
};

router.post('/', verifyToken, upload.array('images', 5), foundController.createFoundItem);
router.get('/', optionalAuth, foundController.getFoundItems);
router.get('/:id', optionalAuth, foundController.getFoundItemById);
router.put('/:id', verifyToken, foundController.updateFoundItem);
router.delete('/:id', verifyToken, foundController.deleteFoundItem);

module.exports = router;
