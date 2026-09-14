const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authRateLimiter, upload.single('profile_photo'), authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/send-email-otp', authRateLimiter, authController.sendEmailOtp);
router.post('/verify-email-otp', authRateLimiter, authController.verifyEmailOtp);
router.post('/send-otp', authRateLimiter, authController.sendOtp);
router.post('/verify-otp', authRateLimiter, authController.verifyOtp);
router.post('/verify-msg91', authRateLimiter, authController.verifyMsg91Token);
router.post('/firebase', authRateLimiter, authController.firebaseAuth);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/resend-verification', authRateLimiter, authController.resendVerificationLink);
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, upload.single('profile_photo'), authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
