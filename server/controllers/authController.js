const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : null;
    const { user, token, emailVerificationLink } = await authService.register(req.body, profilePhoto);
    res.status(201).json({
      message: 'Registration successful! Welcome to Quick Finder.',
      user,
      token,
      emailVerificationLink,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const { user, token } = await authService.login(identifier, password);
    res.status(200).json({
      message: 'Login successful.',
      user,
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : null;
    const user = await authService.updateProfile(req.user.id, req.body, profilePhoto);
    res.status(200).json({
      message: 'Profile updated successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const result = await authService.send2FactorOtp(phone);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { sessionId, otpCode, deliveryMethod } = req.body;
    const result = await authService.verify2FactorOtp(sessionId, otpCode, deliveryMethod);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.verifyMsg91Token = async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    const result = await authService.verifyMsg91AccessToken(accessToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/firebase — verify Firebase ID token, auto-create/find user, return JWT
exports.firebaseAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Firebase ID token is required.' });
    }
    const result = await authService.loginWithFirebase(idToken, req.body);
    if (result.requirePhone || result.requireRegistration) {
      return res.status(200).json({
        success: true,
        requirePhone: true,
        requireRegistration: true,
        message: result.message,
        email: result.email,
        name: result.name,
      });
    }
    res.status(200).json({ message: 'Firebase authentication successful.', user: result.user, token: result.token });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.resendVerificationLink = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendVerificationLink(email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


