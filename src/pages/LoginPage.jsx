import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle, Mail } from 'lucide-react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import PsgLogo from '../components/PsgLogo';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login, loginWithFirebase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleFirebaseError = (err) => {
    const code = err.code || '';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (code.includes('too-many-requests')) {
      return 'Too many failed attempts. Please wait a moment and try again.';
    }
    if (code.includes('user-disabled')) {
      return 'This account has been disabled. Contact campus administration.';
    }
    if (code.includes('popup-closed-by-user')) {
      return 'Sign-in popup was closed. Please try again.';
    }
    if (code.includes('network-request-failed')) {
      return 'Network error. Check your internet connection.';
    }
    if (err.response?.status === 502 || (err.message && err.message.includes('502'))) {
      return 'Backend server is temporarily starting up. Please click again in a few seconds.';
    }
    return err.response?.data?.message || err.message || 'Authentication failed. Please try again.';
  };

  // Default Primary Action: Google Sign-In via Firebase popup
  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(firebaseAuth, provider);
      const idToken = await cred.user.getIdToken();
      const res = await loginWithFirebase(idToken, null, { isRegister: false });
      if (res?.requirePhone || res?.requireRegistration) {
        setError('No Quick Finder account found registered with this Google email. Please click "CREATE ACCOUNT" below to register your profile.');
        return;
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Google login error:', err);
      setError(handleFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  // Secondary Option: Email + Password login (uses backend /auth/login directly)
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Email login error:', err);
      const code = err.code || '';
      if (code.includes('too-many-requests')) {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Incorrect email or password. Please try again.');
      } else if (err.response?.status === 502 || (err.message && err.message.includes('502'))) {
        setError('Backend server is temporarily starting up. Please click Sign In again in a few seconds.');
      } else {
        setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const [resetLink, setResetLink] = useState('');

  // Password reset via API & Firebase Admin SDK
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setResetLink('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
      setForgotSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setForgotSuccess(true);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-8 bg-slate-50">
      <div className="max-w-md w-full my-auto space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-psg-navy/10">

        {/* PSG Institutional Header */}
        <div className="text-center space-y-2">
          <PsgLogo variant="light" size="lg" showTagline={true} className="justify-center" />
          <h2 className="text-xl font-extrabold text-psg-navy tracking-tight mt-2">
            Sign In
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Access your campus lost reports, found items, and claim notifications.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Email + Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="student@psgcas.ac.in"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy">
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotModal(true)}
                className="text-xs text-psg-blue hover:text-psg-royal font-bold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>SIGN IN WITH EMAIL</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google Sign-In Option (Clean Normal Theme) */}
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-psg-blue border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </span>
          </button>
        </div>

        {/* Link to Register */}
        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium mb-2">New to PSG Quick Finder?</p>
          <Link
            to="/register"
            className="w-full inline-block py-3 px-4 rounded-xl border border-slate-300 hover:border-psg-navy text-psg-navy font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition text-center"
          >
            CREATE ACCOUNT
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-psg-navy/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-psg-navy text-base">Reset Account Password</h3>
            {forgotSuccess ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  If <strong>{forgotEmail}</strong> is registered, password reset instructions have been generated.
                </p>
                {resetLink && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-center animate-fade-in-up">
                    <p className="text-xs font-extrabold text-psg-navy">Direct Password Reset Link:</p>
                    <a
                      href={resetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-psg-blue hover:bg-psg-royal text-white text-xs font-black rounded-xl shadow-md transition transform hover:-translate-y-0.5"
                    >
                      <span>CLICK TO RESET PASSWORD</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
                <button
                  onClick={() => { setForgotModal(false); setForgotSuccess(false); setForgotEmail(''); setResetLink(''); }}
                  className="mt-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Enter your registered campus email address. We'll send a password reset link.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@psgtech.ac.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-psg-blue outline-none"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-1.5 bg-psg-navy text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {forgotLoading && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
