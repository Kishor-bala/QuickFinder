const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/userRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { BadRequestError, UnauthorizedError, ConflictError, ForbiddenError } = require('../utils/errors');
const { validateRegistration } = require('../shared');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  async send2FactorOtp(phone) {
    if (!phone) throw new BadRequestError('Phone number is required to send OTP.');
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      throw new BadRequestError('Please enter a valid 10-digit mobile phone number.');
    }
    const tenDigitPhone = cleanPhone.slice(-10);
    const phoneWithCountryCode = `91${tenDigitPhone}`;
    const apiKey = config.twoFactorApiKey;

    // Primary: Voice OTP call endpoint
    let deliveryMethod = 'VOICE';
    let url = `https://2factor.in/API/V1/${apiKey}/VOICE/${tenDigitPhone}/AUTOGEN`;
    try {
      let response = await fetch(url);
      let data = await response.json();

      // Fallback to SMS if voice OTP is unavailable
      if (!data || data.Status !== 'Success') {
        deliveryMethod = 'SMS';
        url = `https://2factor.in/API/V1/${apiKey}/SMS/${phoneWithCountryCode}/AUTOGEN/SMS_OTP`;
        response = await fetch(url);
        data = await response.json();
      }

      if (data && data.Status === 'Success') {
        return {
          success: true,
          sessionId: data.Details,
          deliveryMethod, // VOICE or SMS — needed to pick correct verify endpoint
          message: 'OTP dispatched successfully via Call to your phone number.',
        };
      } else {
        let errorMsg = data?.Details || 'Failed to dispatch OTP via Call.';
        if (errorMsg === 'Invalid API Key' || apiKey.includes('API_KEY_HERE')) {
          errorMsg = '2Factor API Key is missing or invalid. Please check TWO_FACTOR_API_KEY in apps/api/.env';
        }
        throw new BadRequestError(errorMsg);
      }
    } catch (err) {
      if (err instanceof BadRequestError) throw err;
      console.error('2Factor Send Voice OTP Error:', err);
      throw new BadRequestError('Error connecting to OTP gateway via Call. Please try again.');
    }
  }

  async verify2FactorOtp(sessionId, otpCode, deliveryMethod = 'VOICE') {
    if (!sessionId || !otpCode) {
      throw new BadRequestError('Session ID and OTP code are required.');
    }
    const cleanOtp = String(otpCode).trim();
    if (cleanOtp.length < 4) {
      throw new BadRequestError('OTP code must be at least 4 digits.');
    }

    const apiKey = config.twoFactorApiKey;
    // CRITICAL: Voice OTP sessions MUST be verified via VOICE/VERIFY,
    // not SMS/VERIFY. Using the wrong endpoint causes "No Entry Exists" error.
    const verifyType = deliveryMethod === 'SMS' ? 'SMS' : 'VOICE';
    const url = `https://2factor.in/API/V1/${apiKey}/${verifyType}/VERIFY/${sessionId}/${cleanOtp}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.Status === 'Success' && (data.Details === 'OTP Matched' || data.Details === 'OTP Verified')) {
        return {
          success: true,
          message: 'OTP verified successfully.',
        };
      } else {
        const errDetail = data?.Details || 'Invalid OTP code. Please check and try again.';
        // Give user-friendly message for common 2Factor errors
        if (errDetail.includes('No Entry Exists') || errDetail.includes('SessionId')) {
          throw new BadRequestError('OTP has expired or is invalid. Please click Resend OTP to get a new code.');
        }
        throw new BadRequestError(errDetail);
      }
    } catch (err) {
      if (err instanceof BadRequestError) throw err;
      console.error('2Factor Verify OTP Error:', err);
      throw new BadRequestError('Failed to verify OTP code. Please try again.');
    }
  }

  async verifyMsg91AccessToken(accessToken) {
    if (!accessToken) return null;
    try {
      const response = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          authkey: '569866A7RFSDezHzOZ6aa2e12fP1',
          'access-token': accessToken,
        }),
      });
      const json = await response.json();
      return json;
    } catch (err) {
      console.error('MSG91 token verification error:', err);
      return null;
    }
  }

  async checkFbUserExists(user, email) {
    const { getFirebaseAuth } = require('../config/firebaseAdmin');
    const auth = getFirebaseAuth();
    if (!auth) return true;
    try {
      if (user && user.firebase_uid) {
        await auth.getUser(user.firebase_uid);
        return true;
      }
      if (email) {
        await auth.getUserByEmail(email.toLowerCase().trim());
        return true;
      }
    } catch (e) {
      if (e.code === 'auth/user-not-found' || (e.message && e.message.includes('user-not-found'))) {
        return false;
      }
    }
    return true;
  }

  // --- SIGN UP / CREATE ACCOUNT ---
  async register(data, profilePhoto = null) {
    const validation = validateRegistration(data);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new BadRequestError(firstError, validation.errors);
    }

    // Check & purge stale/deleted email record in Firebase DB
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      const isFbActive = await this.checkFbUserExists(existingEmail, data.email);
      if (existingEmail.is_active === 0 || !isFbActive) {
        console.warn(`[Register] Purging orphaned/deleted user record ${existingEmail.id} for email ${data.email}`);
        await userRepository.delete(existingEmail.id);
      } else {
        throw new ConflictError('This email address is already registered. Please sign in or use another email.');
      }
    }

    // Check & purge stale/deleted phone record
    const existingPhone = await userRepository.findByPhone(data.phone);
    if (existingPhone) {
      const isFbActive = await this.checkFbUserExists(existingPhone, existingPhone.email);
      if (existingPhone.is_active === 0 || !isFbActive) {
        await userRepository.delete(existingPhone.id);
      } else {
        throw new ConflictError('This phone number is already registered to another account.');
      }
    }

    // Check & purge stale/deleted user_id record
    const existingUserId = await userRepository.findByUserId(data.user_id);
    if (existingUserId) {
      const isFbActive = await this.checkFbUserExists(existingUserId, existingUserId.email);
      if (existingUserId.is_active === 0 || !isFbActive) {
        await userRepository.delete(existingUserId.id);
      } else {
        throw new ConflictError('This User ID is already taken. Please choose another.');
      }
    }

    // 1. Create account in Firebase Auth
    let fbUser = null;
    let emailVerificationLink = null;
    const { getFirebaseAuth } = require('../config/firebaseAdmin');
    const auth = getFirebaseAuth();

    if (auth) {
      try {
        fbUser = await auth.createUser({
          email: data.email.toLowerCase().trim(),
          password: data.password,
          displayName: data.name.trim(),
          emailVerified: false,
        });
      } catch (e) {
        if (e.code === 'auth/email-already-exists' || (e.message && e.message.includes('already exists'))) {
          try {
            fbUser = await auth.getUserByEmail(data.email.toLowerCase().trim());
          } catch (e2) {}
        } else {
          console.error('[Register] Firebase Auth User creation error:', e.message);
          throw new BadRequestError(`Firebase Account Creation Error: ${e.message}`);
        }
      }

      if (fbUser) {
        try {
          emailVerificationLink = await auth.generateEmailVerificationLink(data.email.toLowerCase().trim());
        } catch (linkErr) {
          console.warn('[Register] Email verification link notice:', linkErr.message);
        }
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(data.password, salt);

    const user = await userRepository.create({
      name: data.name,
      user_id: data.user_id,
      email: data.email,
      phone: data.phone,
      password_hash,
      profile_photo: profilePhoto,
      role: 'user',
      firebase_uid: fbUser ? fbUser.uid : null,
      email_verified: fbUser ? (fbUser.emailVerified ? 1 : 0) : 0,
    });

    // Send welcome notification
    await notificationRepository.create({
      user_id: user.id,
      title: 'Welcome to Quick Finder!',
      message: 'Your account is ready. Report lost belongings, upload found items, and let our intelligent matching algorithm work for you.',
      type: 'system',
    });

    const token = this.generateToken(user);
    return { user, token, emailVerificationLink };
  }

  // --- MANUAL LOGIN ---
  async login(identifier, password) {
    if (!identifier || !password) {
      throw new BadRequestError('Email/User ID and password are required.');
    }

    const user = await userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials. Please check your username/email and password.');
    }

    // Purge deleted user record if marked inactive
    if (user.is_active === 0) {
      await userRepository.delete(user.id);
      throw new UnauthorizedError('Account deleted from Firebase database. Please create a new account.');
    }

    // Verify user status in Firebase Auth
    if (user.firebase_uid) {
      try {
        const { getFirebaseAuth } = require('../config/firebaseAdmin');
        const auth = getFirebaseAuth();
        if (auth) {
          const fbUser = await auth.getUser(user.firebase_uid);
          if (fbUser && fbUser.emailVerified && !user.email_verified) {
            await userRepository.updateEmailVerified(user.id, true);
            user.email_verified = 1;
          }
        }
      } catch (fbErr) {
        if (fbErr.code === 'auth/user-not-found' || (fbErr.message && fbErr.message.includes('user-not-found'))) {
          console.warn(`[Login] User ${user.id} (${user.email}) deleted from Firebase Auth. Purging user record.`);
          await userRepository.delete(user.id);
          throw new UnauthorizedError('Account deleted from Firebase database. Please create a new account.');
        }
      }
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials. Please check your username/email and password.');
    }

    // Lazy sync: create/link in Firebase Auth if legacy user record lacks firebase_uid
    if (!user.firebase_uid) {
      try {
        const { getFirebaseAuth } = require('../config/firebaseAdmin');
        const auth = getFirebaseAuth();
        if (auth) {
          let fbUser;
          try {
            fbUser = await auth.getUserByEmail(user.email);
          } catch (e) {
            fbUser = await auth.createUser({
              email: user.email,
              password: password,
              displayName: user.name,
              emailVerified: false,
            });
          }
          if (fbUser) {
            await userRepository.updateFirebaseUid(user.id, fbUser.uid, 'local');
            user.firebase_uid = fbUser.uid;
          }
        }
      } catch (fbErr) {
        console.warn(`[Login] Firebase Auth lazy sync notice for ${user.email}:`, fbErr.message);
      }
    }

    const token = this.generateToken(user);
    const safeUser = await userRepository.findById(user.id);
    return { user: safeUser, token };
  }

  // --- GET PROFILE (ACTIVE SESSION STATUS CHECK) ---
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found.');
    }
    if (user.is_active === 0) {
      await userRepository.delete(user.id);
      throw new UnauthorizedError('Account deleted in Firebase database. Session terminated.');
    }

    if (user.firebase_uid) {
      try {
        const { getFirebaseAuth } = require('../config/firebaseAdmin');
        const auth = getFirebaseAuth();
        if (auth) {
          const fbUser = await auth.getUser(user.firebase_uid);
          if (fbUser && fbUser.emailVerified && !user.email_verified) {
            await userRepository.updateEmailVerified(user.id, true);
            user.email_verified = 1;
          }
        }
      } catch (fbErr) {
        if (fbErr.code === 'auth/user-not-found' || (fbErr.message && fbErr.message.includes('user-not-found'))) {
          console.warn(`[getProfile] User ${user.id} (${user.email}) deleted from Firebase Auth DB. Purging user record.`);
          await userRepository.delete(user.id);
          throw new UnauthorizedError('Account deleted in Firebase database. Session terminated.');
        }
      }
    }
    return user;
  }

  async updateProfile(userId, { name, phone }, profilePhoto = null) {
    if (!name || !phone) {
      throw new BadRequestError('Name and phone number are required.');
    }

    const existingPhone = await userRepository.findByPhone(phone, userId);
    if (existingPhone) {
      throw new ConflictError('This phone number is already registered to another account.');
    }

    return await userRepository.updateProfile(userId, {
      name,
      phone,
      profile_photo: profilePhoto,
    });
  }

  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Current and new password are required.');
    }
    if (newPassword.length < 6) {
      throw new BadRequestError('New password must be at least 6 characters long.');
    }

    const user = await userRepository.findByIdWithHash(userId);
    if (!user) {
      throw new UnauthorizedError('User not found.');
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect.');
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    await userRepository.updatePassword(userId, newHash);

    await notificationRepository.create({
      user_id: userId,
      title: 'Security Alert: Password Changed',
      message: 'Your account password was successfully updated.',
      type: 'system',
    });

    return { message: 'Password updated successfully.' };
  }

  // --- GOOGLE SIGN UP & LOGIN ---
  async loginWithFirebase(idToken, extraData = {}) {
    const { getFirebaseAuth } = require('../config/firebaseAdmin');
    let decoded;
    try {
      decoded = await getFirebaseAuth().verifyIdToken(idToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired Firebase token. Please sign in again.');
    }

    const { uid, email, name, picture, phone_number, firebase } = decoded;
    const provider = firebase?.sign_in_provider || 'firebase';

    const providedPhone = typeof extraData === 'string' ? extraData : extraData?.phone;
    const isRegister = typeof extraData === 'object' ? (extraData?.isRegister ?? false) : false;
    const user_id = typeof extraData === 'object' ? extraData?.user_id : null;
    const customName = typeof extraData === 'object' ? extraData?.name : null;

    let effectivePhone = (providedPhone || phone_number || '').trim();

    // 1. Look up existing user by firebase_uid
    let user = await userRepository.findByFirebaseUid(uid);

    if (!user && email) {
      // Look up by email
      const existing = await userRepository.findByEmail(email);
      if (existing) {
        if (existing.is_active === 0) {
          console.warn(`[Auth] Purging deleted user record for ${email}`);
          await userRepository.delete(existing.id);
          user = null;
        } else {
          user = await userRepository.updateFirebaseUid(existing.id, uid, provider);
        }
      }
    }

    // Verify Firebase Auth existence for existing user
    if (user) {
      if (user.is_active === 0) {
        console.warn(`[Auth] Purging deleted user record ${user.id}`);
        await userRepository.delete(user.id);
        user = null;
      } else {
        try {
          const auth = getFirebaseAuth();
          if (auth) {
            await auth.getUser(uid);
          }
        } catch (fbErr) {
          if (fbErr.code === 'auth/user-not-found' || (fbErr.message && fbErr.message.includes('user-not-found'))) {
            console.warn(`[Auth] User ${user.id} deleted from Firebase Auth. Purging record.`);
            await userRepository.delete(user.id);
            user = null;
          }
        }
      }
    }

    // If active existing user, return token
    if (user) {
      if (effectivePhone && (!user.phone || user.phone !== effectivePhone)) {
        const phoneDuplicate = await userRepository.findByPhone(effectivePhone, user.id);
        if (!phoneDuplicate) {
          user = await userRepository.updateProfile(user.id, { name: user.name, phone: effectivePhone });
        }
      }
      const token = this.generateToken(user);
      return { user, token };
    }

    // --- BRAND NEW ACCOUNT PATH ---
    // If not in register mode (e.g. from sign-in page), do NOT auto-create account!
    if (!isRegister && !user_id) {
      throw new UnauthorizedError('No Quick Finder account found with this Google email. Please click CREATE ACCOUNT to register first.');
    }

    // If in register mode, check if we have required profile details (Roll No / Staff ID and Phone)
    if (!user_id || !user_id.trim() || !effectivePhone) {
      return {
        requirePhone: true,
        requireRegistration: true,
        message: 'Student Roll No / Staff ID and Phone number are required to create your account.',
        email: email || '',
        name: customName || name || '',
      };
    }

    // Check user_id uniqueness (purge stale if inactive)
    const existingUserId = await userRepository.findByUserId(user_id);
    if (existingUserId) {
      if (existingUserId.is_active === 0) {
        await userRepository.delete(existingUserId.id);
      } else {
        throw new ConflictError('This Student Roll No. / Staff ID is already registered to another account.');
      }
    }

    // Check phone uniqueness against existing accounts (purge stale if inactive)
    const phoneDuplicate = await userRepository.findByPhone(effectivePhone);
    if (phoneDuplicate) {
      if (phoneDuplicate.is_active === 0) {
        await userRepository.delete(phoneDuplicate.id);
      } else {
        throw new ConflictError('This phone number is already registered to another account.');
      }
    }

    // Create brand new user account with phone and user_id
    const displayName = (customName || name || (email ? email.split('@')[0] : 'QuickFinder User')).trim();
    user = await userRepository.createFromFirebase({
      name: displayName,
      user_id: user_id.trim(),
      email: email || `${uid}@firebase.user`,
      phone: effectivePhone,
      profile_photo: picture || null,
      firebase_uid: uid,
      provider,
    });

    // Welcome notification
    await notificationRepository.create({
      user_id: user.id,
      title: 'Welcome to Quick Finder!',
      message: 'Your account is ready. Report lost belongings, upload found items, and let our intelligent matching algorithm work for you.',
      type: 'system',
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async forgotPassword(email) {
    if (!email || !email.trim()) {
      throw new BadRequestError('Email address is required.');
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(cleanEmail);

    const { getFirebaseAuth } = require('../config/firebaseAdmin');
    let resetLink = null;

    try {
      const auth = getFirebaseAuth();
      if (auth) {
        try {
          await auth.getUserByEmail(cleanEmail);
        } catch (e) {
          if (user) {
            await auth.createUser({
              email: cleanEmail,
              displayName: user.name,
            });
          }
        }
        resetLink = await auth.generatePasswordResetLink(cleanEmail);
      }
    } catch (err) {
      console.warn('[ForgotPassword] Firebase reset link notice:', err.message);
    }

    if (!user && !resetLink) {
      return {
        success: true,
        message: 'If this email is registered, password reset instructions have been dispatched.',
      };
    }

    return {
      success: true,
      message: 'Password reset link generated successfully.',
      resetLink,
    };
  }

  async resendVerificationLink(email) {
    if (!email || !email.trim()) throw new BadRequestError('Email address is required.');
    const cleanEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) throw new BadRequestError('No account found with this email address.');

    const { getFirebaseAuth } = require('../config/firebaseAdmin');
    const auth = getFirebaseAuth();
    if (!auth) throw new BadRequestError('Firebase Auth service is unavailable.');

    try {
      const emailVerificationLink = await auth.generateEmailVerificationLink(cleanEmail);
      return {
        success: true,
        message: 'Firebase email verification magic link generated successfully.',
        emailVerificationLink,
      };
    } catch (err) {
      console.error('[ResendVerificationLink] Error:', err);
      throw new BadRequestError(`Failed to generate verification link: ${err.message}`);
    }
  }
}

module.exports = new AuthService();
