const nodemailer = require('nodemailer');
const config = require('../config');
const { getFirebaseDb } = require('../config/firebaseAdmin');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    } catch (err) {
      console.error('[EmailService] Transporter setup error:', err.message);
    }
  }

  sanitizeEmailKey(email) {
    return email.toLowerCase().trim().replace(/[.#$/[\]]/g, '_');
  }

  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationOtp(email, userName = 'User') {
    if (!email || !email.trim()) {
      throw new Error('Email address is required.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const otpCode = this.generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 Minutes TTL

    // Store in Firebase Realtime Database
    try {
      const db = getFirebaseDb();
      const key = this.sanitizeEmailKey(cleanEmail);
      await db.ref(`email_otps/${key}`).set({
        otpCode,
        expiresAt,
        attempts: 0,
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.error('[EmailService] Failed to record OTP in Realtime DB:', dbErr.message);
    }

    // Compose dark navy & white themed email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(11,25,44,0.08); }
          .header { background-color: #0B192C; padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
          .body { padding: 32px 28px; background-color: #ffffff; text-align: center; }
          .greeting { font-size: 16px; font-weight: 700; color: #0B192C; margin-bottom: 12px; }
          .instruction { font-size: 14px; color: #475569; margin-bottom: 24px; line-height: 1.5; }
          .otp-card { background-color: #0B192C; border-radius: 16px; padding: 20px; display: inline-block; margin: 0 auto 24px; min-width: 240px; border: 1px solid #1E3A8A; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: monospace; }
          .expiry { font-size: 12px; color: #64748b; margin-top: 16px; font-weight: 600; }
          .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>QuickFinder</h1>
            <p>Campus Security & Identity Verification</p>
          </div>
          <div class="body">
            <div class="greeting">Hello ${userName},</div>
            <div class="instruction">Use the 6-digit verification code below to confirm your account login or registration on QuickFinder.</div>
            <div class="otp-card">
              <div class="otp-code">${otpCode}</div>
            </div>
            <div class="expiry">⏱️ Code expires in 10 minutes. Please do not share this OTP with anyone.</div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} QuickFinder Campus Platform • PSG College of Arts & Science
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: config.smtp.from,
      to: cleanEmail,
      subject: `[QuickFinder] ${otpCode} is your email verification OTP`,
      html: htmlContent,
    };

    if (!this.transporter) {
      this.initTransporter();
    }

    const info = await this.transporter.sendMail(mailOptions);
    console.log(`[EmailService] OTP email sent to ${cleanEmail}: MessageID ${info.messageId}`);
    return { success: true, message: 'Verification OTP sent to your email.' };
  }

  async verifyEmailOtp(email, inputOtp) {
    if (!email || !inputOtp) {
      return { success: false, message: 'Email address and 6-digit OTP code are required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(inputOtp).trim();
    const key = this.sanitizeEmailKey(cleanEmail);

    try {
      const db = getFirebaseDb();
      const snapshot = await db.ref(`email_otps/${key}`).once('value');
      const data = snapshot.val();

      if (!data) {
        return { success: false, message: 'No OTP requested or code has expired. Please click Resend OTP.' };
      }

      if (Date.now() > data.expiresAt) {
        await db.ref(`email_otps/${key}`).remove();
        return { success: false, message: 'OTP has expired. Please request a new verification code.' };
      }

      if (String(data.otpCode).trim() !== cleanOtp) {
        const attempts = (data.attempts || 0) + 1;
        if (attempts >= 5) {
          await db.ref(`email_otps/${key}`).remove();
          return { success: false, message: 'Too many invalid attempts. Please request a new OTP.' };
        }
        await db.ref(`email_otps/${key}/attempts`).set(attempts);
        return { success: false, message: 'Invalid OTP code. Please check your email and try again.' };
      }

      // OTP is valid! Invalidate record so it can't be reused
      await db.ref(`email_otps/${key}`).remove();
      return { success: true, message: 'Email verification successful.' };
    } catch (err) {
      console.error('[EmailService] Verify OTP error:', err.message);
      return { success: false, message: 'Failed to verify OTP. Please try again.' };
    }
  }
}

module.exports = new EmailService();
