const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', verifyToken, upload.single('proof_image'), claimController.createClaim);
router.get('/', verifyToken, claimController.getClaims);
router.put('/:id/respond', verifyToken, claimController.respondToClaim);

module.exports = router;
