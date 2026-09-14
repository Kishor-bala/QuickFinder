import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, User, Mail, Phone, CheckCircle2, ShieldCheck, Building, Calendar, KeyRound } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Personal, 2: Credentials, 3: SMTP Email OTP Verification
  const [formData, setFormData] = useState({
    name: '',
    user_id: '',
    department: 'B.Sc Computer Science',
    year_of_study: '1st Year',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Flow State
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState('');

  // SMTP Email OTP State
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpNotice, setEmailOtpNotice] = useState('');

  const { register, loginWithFirebase } = useAuth();
  const navigate = useNavigate();

  // Password Validation Rules
  const hasMinLen = formData.password.length >= 8;
  const hasCap = /[A-Z]/.test(formData.password);
  const hasNum = /[0-9]/.test(formData.password);
  const hasSpec = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let cleanVal = value;
    if (name === 'phone') {
      cleanVal = value.replace(/[^0-9+]/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: cleanVal }));
    setError('');
  };

  // Google Sign-In Flow Trigger
  const handleGoogleRegister = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(firebaseAuth, provider);
      const idToken = await cred.user.getIdToken();
      
      const googleEmail = cred.user.email || '';
      const googleName = cred.user.displayName || '';

      const res = await loginWithFirebase(idToken, null, { isRegister: true });
      if (res?.requirePhone || res?.requireRegistration) {
        setGoogleIdToken(idToken);
        setIsGoogleFlow(true);
        setFormData((prev) => ({
          ...prev,
          name: googleName || prev.name,
          email: googleEmail || prev.email,
        }));
        setStep(1);
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Google authentication error:', err);
      let errMsg = err.response?.data?.message || err.message || 'Google authentication failed.';
      setError(errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Dispatch 6-Digit SMTP OTP to User's Email
  const handleSendEmailOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = formData.email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid campus email address.');
      return;
    }

    setError('');
    setEmailOtpLoading(true);
    setEmailOtpNotice('');

    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name: formData.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification email.');
      }
      setEmailOtpSent(true);
      setEmailOtpNotice(`✉️ 6-digit OTP sent to ${cleanEmail} via QuickFinder SMTP.`);
      setStep(3);
    } catch (err) {
      console.error('Send SMTP OTP error:', err);
      setError(err.message || 'Failed to send OTP to email. Please verify SMTP configuration.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // Step 1 Submit
  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) { setError('Please enter your full name.'); return; }
    if (!formData.user_id.trim()) { setError('Please enter your Student Roll No. or Staff ID.'); return; }
    setStep(2);
  };

  // Step 2 Submit
  const handleStep2Next = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!hasMinLen || !hasCap || !hasNum || !hasSpec) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    handleSendEmailOtp();
  };

  // Google Registration Submit
  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.user_id.trim() || !formData.phone.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithFirebase(googleIdToken, {
        phone: formData.phone.trim(),
        isRegister: true,
        user_id: formData.user_id.trim(),
        name: formData.name.trim(),
      });
      if (res?.requirePhone || res?.requireRegistration) {
        setError(res.message || 'Phone number and Roll No. required.');
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Google completion error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to complete Google registration.');
    } finally {
      setLoading(false);
    }
  };

  // Manual Registration Submit (with Email OTP Verification)
  const handleManualFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phone.trim()) {
      setError('Please enter your mobile phone number.');
      return;
    }

    if (!emailOtpCode || emailOtpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('user_id', formData.user_id.trim());
      data.append('department', formData.department);
      data.append('year_of_study', formData.year_of_study);
      data.append('email', formData.email.trim());
      data.append('phone', formData.phone.trim());
      data.append('password', formData.password);
      data.append('confirmPassword', formData.confirmPassword);
      data.append('otpCode', emailOtpCode.trim());
      if (profilePhoto) {
        data.append('profile_photo', profilePhoto);
      }

      await register(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-6 bg-slate-50">
      <div className="max-w-xl w-full my-auto space-y-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-psg-navy/10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <PsgLogo variant="light" size="lg" showTagline={true} className="justify-center" />
          <h2 className="text-xl font-extrabold text-psg-navy tracking-tight mt-1">
            Create Account
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isGoogleFlow
              ? 'Complete profile details to finalize registration.'
              : 'Register your account with verified SMTP email security.'}
          </p>
        </div>

        {/* Google Flow Banner */}
        {isGoogleFlow && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-psg-blue rounded-2xl text-xs font-extrabold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GoogleIcon />
              <span>Google Verified Email: <strong>{formData.email}</strong></span>
            </div>
          </div>
        )}

        {/* Step Indicator Bar */}
        {!isGoogleFlow && (
          <div className="flex items-center justify-between px-2 pt-1">
            <div className={`flex items-center gap-2 text-xs font-extrabold ${step === 1 ? 'text-psg-blue' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-psg-navy text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>1</span>
              <span>Personal</span>
            </div>
            <div className={`flex-1 h-0.5 mx-3 ${step >= 2 ? 'bg-psg-navy' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 text-xs font-extrabold ${step === 2 ? 'text-psg-blue' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-psg-navy text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>2</span>
              <span>Credentials</span>
            </div>
            <div className={`flex-1 h-0.5 mx-3 ${step >= 3 ? 'bg-psg-navy' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 text-xs font-extrabold ${step === 3 ? 'text-psg-blue' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-psg-navy text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>3</span>
              <span>SMTP OTP</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* --- GOOGLE REGISTRATION FLOW --- */}
        {isGoogleFlow && (
          <form onSubmit={handleGoogleSubmit} className="space-y-4">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                  Student Roll No. / Staff ID *
                </label>
                <input
                  type="text"
                  name="user_id"
                  required
                  value={formData.user_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-psg-navy hover:bg-psg-royal text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>COMPLETE REGISTRATION</span>}
            </button>
          </form>
        )}

        {/* --- MANUAL REGISTRATION FLOW --- */}
        {!isGoogleFlow && (
          <>
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-4">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Arun Kumar"
                        className="w-full px-3.5 py-3 pl-10 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                      Student Roll No. / Staff ID *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="user_id"
                        required
                        value={formData.user_id}
                        onChange={handleChange}
                        placeholder="e.g. 26CS101"
                        className="w-full px-3.5 py-3 pl-10 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none"
                      />
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                        Department
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm bg-white outline-none"
                      >
                        <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                        <option value="B.Com Commerce">B.Com Commerce</option>
                        <option value="B.Sc Physics">B.Sc Physics</option>
                        <option value="B.Sc Mathematics">B.Sc Mathematics</option>
                        <option value="BBA Management">BBA Management</option>
                        <option value="Other Department">Other Department</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                        Year of Study
                      </label>
                      <select
                        name="year_of_study"
                        value={formData.year_of_study}
                        onChange={handleChange}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm bg-white outline-none"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="PG / Research">PG / Research</option>
                        <option value="Faculty / Staff">Faculty / Staff</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-psg-navy hover:bg-psg-royal text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <span>CONTINUE TO CREDENTIALS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Email & Password Credentials */}
            {step === 2 && (
              <form onSubmit={handleStep2Next} className="space-y-4">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="student@psgcas.ac.in"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 8 chars, 1 Cap, 1 Num, 1 Symbol"
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {formData.password && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Min 8 Chars</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasCap ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>1 Capital (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNum ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>1 Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSpec ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>1 Symbol (!@#$)</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={emailOtpLoading}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-psg-navy hover:bg-psg-royal text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {emailOtpLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>SEND SMTP OTP TO EMAIL</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SMTP Email OTP Verification & Phone Number */}
            {step === 3 && (
              <form onSubmit={handleManualFinalSubmit} className="space-y-4">
                <div className="space-y-3.5">
                  
                  {/* Notice Banner */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 text-psg-navy rounded-2xl text-xs font-semibold space-y-1">
                    <p className="font-extrabold">✉️ Email Verification Required</p>
                    <p className="text-[11px] text-slate-600">
                      A 6-digit OTP code has been dispatched to <strong>{formData.email}</strong> via QuickFinder SMTP.
                    </p>
                  </div>

                  {/* 6-Digit Email OTP */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy">
                        Enter 6-Digit Email OTP Code *
                      </label>
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={emailOtpLoading}
                        className="text-xs text-psg-blue font-bold hover:underline disabled:opacity-50"
                      >
                        {emailOtpLoading ? 'Sending...' : 'Resend Email OTP'}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="123456"
                        className="w-full text-center text-2xl font-mono tracking-[0.5em] py-3 px-4 rounded-xl border border-slate-300 focus:border-psg-blue outline-none bg-white font-extrabold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Mobile Phone Number */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                      Mobile Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="9876543210"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Optional Profile Photo */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                      Profile Photo (Optional)
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => setProfilePhoto(e.target.files[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-psg-navy file:text-white hover:file:bg-slate-900 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading || emailOtpCode.length !== 6}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-psg-navy hover:bg-psg-royal text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>VERIFY OTP & CREATE ACCOUNT</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Divider */}
        {!isGoogleFlow && (
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
        )}

        {/* Google Registration Option */}
        {!isGoogleFlow && (
          <div>
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 shadow-sm transition disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-psg-blue border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>
                {googleLoading ? 'Registering with Google...' : 'Register with Google'}
              </span>
            </button>
          </div>
        )}

        {/* Link to Login */}
        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            Already have a PSG Quick Finder account?{' '}
            <Link to="/login" className="font-extrabold text-psg-navy hover:underline">
              Sign In here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
