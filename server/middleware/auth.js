const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = config.jwtSecret;

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User no longer exists.' });
    }

    if (user.is_active === 0) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact administration.' });
    }

    // Check Firebase DB user status if registered via Firebase
    if (user.firebase_uid) {
      try {
        const { getFirebaseAuth } = require('../config/firebaseAdmin');
        const auth = getFirebaseAuth();
        if (auth) {
          await auth.getUser(user.firebase_uid);
        }
      } catch (fbErr) {
        if (fbErr.code === 'auth/user-not-found' || (fbErr.message && fbErr.message.includes('user-not-found'))) {
          console.warn(`[Auth Middleware] User ${user.id} (${user.email}) deleted from Firebase Auth DB. Purging user record.`);
          await userRepository.delete(user.id);
          return res.status(401).json({ message: 'Account deleted in Firebase database. Session terminated.' });
        }
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token authentication failed.' });
  }
};

module.exports = {
  verifyToken,
  JWT_SECRET,
};
