import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, User, Mail, Phone, CheckCircle2, ShieldCheck, Building, Calendar, KeyRound, Smartphone } from 'lucide-react';
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
  const [step, setStep] = useState(1); // 1: Personal, 2: Credentials, 3: Phone/OTP Verification
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

  // Registration Success & Email Verification State
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [emailVerificationLink, setEmailVerificationLink] = useState('');
  const [createdUser, setCreatedUser] = useState(null);

  // Google Flow State
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState('');

  // OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('VOICE');
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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
      if (err.response?.status === 502 || (err.message && err.message.includes('502'))) {
        errMsg = 'Backend server is temporarily starting up. Please click "Register with Google" again in a few seconds.';
      }
      setError(errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Trigger Send Mobile OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid 10-digit mobile phone number before requesting OTP.');
      return;
    }

    setError('');
    setOtpLoading(true);
    setOtpNotice('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP. Please check your mobile number.');
      }
      setSessionId(data.sessionId);
      setDeliveryMethod(data.deliveryMethod || 'VOICE');
      setOtpCode(''); // Clear any old OTP code when a new one is sent
      setOtpSent(true);
      setOtpNotice(`✨ 4-digit OTP code sent via Call to ${cleanPhone}. Please enter it.`);
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send OTP via Call. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Trigger Verify Mobile OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 4) {
      setError('Please enter the full 4-digit OTP code received on your mobile phone.');
      return;
    }

    setError('');
    setVerifyingOtp(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otpCode: cleanCode, deliveryMethod }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid OTP code. Please check and try again.');
      }
      setOtpVerified(true);
      setOtpNotice(`✨ Mobile number ${formData.phone} successfully verified!`);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Failed to verify OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step 1 Submit (Manual Flow)
  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.user_id.trim()) {
      setError('Please enter your Student Roll No. or Staff ID.');
      return;
    }
    setStep(2);
  };

  // Step 2 Submit (Manual Flow)
  const handleStep2Next = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!hasMinLen) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasCap) {
      setError('Password must contain at least one capital letter (A-Z).');
      return;
    }
    if (!hasNum) {
      setError('Password must contain at least one number (0-9).');
      return;
    }
    if (!hasSpec) {
      setError('Password must contain at least one special character (!@#$%^&*).');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    setStep(3);
  };

  // Google Registration Submit
  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.user_id.trim()) {
      setError('Please enter your Student Roll No. or Staff ID.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      setError('Please enter your mobile phone number.');
      return;
    }

    if (!otpVerified) {
      setError('Mobile phone number verification via OTP is mandatory before completing registration.');
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

  // Manual Registration Submit
  const handleManualFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      setError('Please enter your mobile phone number.');
      return;
    }

    if (!otpVerified) {
      setError('Mobile phone number verification via OTP is mandatory before completing account creation.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('user_id', formData.user_id.trim());
      data.append('email', formData.email.trim());
      data.append('phone', formData.phone.trim());
      data.append('password', formData.password);
      data.append('confirmPassword', formData.confirmPassword);
      if (profilePhoto) {
        data.append('profile_photo', profilePhoto);
      }

      const res = await register(data);
      if (res?.emailVerificationLink) {
        setEmailVerificationLink(res.emailVerificationLink);
        setRegistrationSuccess(true);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-6 bg-slate-50">
      <div className="max-w-xl w-full my-auto space-y-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-psg-navy/10">
        
        {/* Registration Success & Verification Card */}
        {registrationSuccess ? (
          <div className="space-y-6 text-center animate-scale-up py-4">
            <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-inner text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-black tracking-wider uppercase rounded-full">
                Account Successfully Created
              </span>
              <h2 className="text-2xl font-black text-psg-navy tracking-tight">
                Verify Your Email Address
              </h2>
              <p className="text-xs text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                Welcome to Quick Finder, <strong>{formData.name}</strong>! Your account for <strong>{formData.email}</strong> has been registered in <strong>Firebase Auth</strong> and saved to <strong>Firebase Realtime Database</strong>.
              </p>
            </div>

            {emailVerificationLink && (
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl space-y-3 shadow-md text-left">
                <div className="flex items-center gap-2 text-psg-navy">
                  <Mail className="w-5 h-5 text-psg-blue flex-shrink-0" />
                  <h3 className="font-extrabold text-sm">Official Firebase Verification Link</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Click the button below to verify your email address via Firebase Auth. Once verified, your status will update across the platform.
                </p>
                <div className="pt-2 flex flex-col gap-2.5">
                  <a
                    href={emailVerificationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>CLICK HERE TO VERIFY EMAIL</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard', { replace: true })}
                className="w-full py-3.5 px-4 rounded-2xl bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <span>CONTINUE TO DASHBOARD</span>
                <ArrowRight className="w-4 h-4 text-psg-gold" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <PsgLogo variant="light" size="lg" showTagline={true} className="justify-center" />
              <h2 className="text-xl font-extrabold text-psg-navy tracking-tight mt-1">
                Create Account
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isGoogleFlow
                  ? 'Complete your profile details and verify your mobile phone to finalize registration.'
                  : 'Register your profile to report lost belongings and track matches across campus.'}
              </p>
            </div>

        {/* Google Flow Banner */}
        {isGoogleFlow && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-psg-blue rounded-2xl text-xs font-extrabold flex items-center justify-between animate-fade-in-down">
            <div className="flex items-center gap-2">
              <GoogleIcon />
              <span>Google Email Verified: <strong>{formData.email}</strong></span>
            </div>
          </div>
        )}

        {/* Step Indicator Bar (For Manual Signup) */}
        {!isGoogleFlow && (
          <div className="flex items-center justify-between px-2 pt-1">
            <div className={`flex items-center gap-2 text-xs font-extrabold ${step === 1 ? 'text-psg-blue' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-psg-blue text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>1</span>
              <span>Details</span>
            </div>
            <div className={`flex-1 h-0.5 mx-3 ${step >= 2 ? 'bg-psg-blue' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center gap-2 text-xs font-extrabold ${step === 2 ? 'text-psg-blue' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-psg-blue text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>2</span>
              <span>Credentials</span>
            </div>
            <div className={`flex-1 h-0.5 mx-3 ${step >= 3 ? 'bg-psg-blue' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center gap-2 text-xs font-extrabold ${step === 3 ? 'text-psg-blue' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-psg-blue text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>3</span>
              <span>Verify Phone</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs animate-fade-in-down">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* --- GOOGLE REGISTRATION FLOW --- */}
        {isGoogleFlow && (
          <form onSubmit={handleGoogleSubmit} className="space-y-4 animate-fade-in-up">
            <div className="space-y-3.5">
              
              {/* Full Name */}
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
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none pl-10 transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Student Roll Number / Staff ID */}
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
                    placeholder="e.g. 26CS101 or arun_k"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none pl-10 transition"
                  />
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Department & Year Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                    Department *
                  </label>
                  <div className="relative">
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none pl-10 transition bg-white"
                    >
                      <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                      <option value="B.Com Commerce">B.Com Commerce</option>
                      <option value="B.Sc Physics">B.Sc Physics</option>
                      <option value="B.Sc Mathematics">B.Sc Mathematics</option>
                      <option value="BBA Management">BBA Management</option>
                      <option value="B.A English Literature">B.A English Literature</option>
                      <option value="M.Sc Computer Science">M.Sc Computer Science</option>
                      <option value="Other Department">Other Department</option>
                    </select>
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                    Year of Study *
                  </label>
                  <div className="relative">
                    <select
                      name="year_of_study"
                      value={formData.year_of_study}
                      onChange={handleChange}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none pl-10 transition bg-white"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="PG / Research">PG / Research</option>
                      <option value="Faculty / Staff">Faculty / Staff</option>
                    </select>
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                  Mobile Phone Number *
                </label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      name="phone"
                      required
                      disabled={otpSent || otpVerified}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition disabled:bg-slate-100 font-medium text-slate-800"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {!otpVerified && !otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      className="px-4 py-3 bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-60 flex-shrink-0 shadow"
                    >
                      {otpLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>SEND OTP</span>
                      )}
                    </button>
                  )}
                  {otpSent && !otpVerified && (
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(''); }}
                      className="px-3 py-3 border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition flex-shrink-0"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>

              {/* 4-Digit OTP Text Input Field */}
              {otpSent && !otpVerified && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy">
                      Enter 4-Digit OTP Code *
                    </label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || verifyingOtp}
                      className="text-xs font-bold text-psg-blue hover:underline disabled:opacity-50"
                    >
                      {otpLoading ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      name="otpCode"
                      maxLength={4}
                      pattern="[0-9]*"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="1234"
                      className="w-full text-center text-xl font-mono tracking-[0.4em] py-3 pl-10 pr-4 rounded-xl border border-slate-300 focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition bg-white font-extrabold text-slate-800"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpCode.length !== 4}
                    className="w-full py-3 px-4 rounded-xl bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verifyingOtp ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>VERIFY OTP</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Verification Status Banner */}
              {otpNotice && (
                <div className={`p-3 border rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-scale-up ${otpVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-psg-navy'}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${otpVerified ? 'text-emerald-600' : 'text-psg-blue'}`} />
                    <span>{otpNotice}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Action Buttons */}
            <div className="pt-3">
              {!otpVerified ? (
                <button
                  type="button"
                  onClick={otpSent ? handleVerifyOtp : handleSendOtp}
                  disabled={otpLoading || (otpSent && otpCode.length !== 4)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {otpLoading || verifyingOtp ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{otpSent ? 'VERIFY OTP CODE' : 'SEND OTP VIA CALL'}</span>
                      <ArrowRight className="w-4 h-4 text-psg-gold" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>COMPLETE REGISTRATION</span>
                      <ArrowRight className="w-4 h-4 text-psg-gold" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}

        {/* --- MANUAL REGISTRATION FLOW --- */}
        {!isGoogleFlow && (
          <>
            {/* STEP 1: Personal & Academic Info */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-4 animate-fade-in-up">
                <div className="space-y-3.5">
                  
                  {/* Full Name */}
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
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none pl-10 transition"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Student Roll Number / Staff ID */}
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
                        placeholder="e.g. 26CS101 or arun_k"
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none pl-10 transition"
                      />
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Department & Year Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                        Department *
                      </label>
                      <div className="relative">
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none pl-10 transition bg-white"
                        >
                          <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                          <option value="B.Com Commerce">B.Com Commerce</option>
                          <option value="B.Sc Physics">B.Sc Physics</option>
                          <option value="B.Sc Mathematics">B.Sc Mathematics</option>
                          <option value="BBA Management">BBA Management</option>
                          <option value="B.A English Literature">B.A English Literature</option>
                          <option value="M.Sc Computer Science">M.Sc Computer Science</option>
                          <option value="Other Department">Other Department</option>
                        </select>
                        <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                        Year of Study *
                      </label>
                      <div className="relative">
                        <select
                          name="year_of_study"
                          value={formData.year_of_study}
                          onChange={handleChange}
                          className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none pl-10 transition bg-white"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="PG / Research">PG / Research</option>
                          <option value="Faculty / Staff">Faculty / Staff</option>
                        </select>
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 mt-4"
                >
                  <span>CONTINUE TO CREDENTIALS</span>
                  <ArrowRight className="w-4 h-4 text-psg-gold" />
                </button>
              </form>
            )}

            {/* STEP 2: Email & Password Credentials */}
            {step === 2 && (
              <form onSubmit={handleStep2Next} className="space-y-4 animate-fade-in-up">
                <div className="space-y-3.5">
                  
                  {/* Email Address */}
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
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Password */}
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
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
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

                  {/* Password Rules Checklist */}
                  {formData.password && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Min 8 Characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasCap ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>1 Capital Letter (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNum ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>1 Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSpec ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>1 Special Char (!@#$)</span>
                      </div>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repeat password"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
                      />
                      {formData.confirmPassword && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold">
                          {passwordsMatch ? (
                            <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Match</span>
                          ) : (
                            <span className="text-rose-500">No match</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                  >
                    <span>CONTINUE TO VERIFY PHONE</span>
                    <ArrowRight className="w-4 h-4 text-psg-gold" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Phone Number & Production OTP Verification */}
            {step === 3 && (
              <form onSubmit={handleManualFinalSubmit} className="space-y-4 animate-fade-in-up">
                <div className="space-y-3.5">
                  
                  {/* Mobile Phone Number */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                      Mobile Phone Number *
                    </label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          name="phone"
                          required
                          disabled={otpSent || otpVerified}
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="9876543210"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition disabled:bg-slate-100 font-medium text-slate-800"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      {!otpVerified && !otpSent && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading}
                          className="px-4 py-3 bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-60 flex-shrink-0 shadow"
                        >
                          {otpLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>SEND OTP</span>
                          )}
                        </button>
                      )}
                      {otpSent && !otpVerified && (
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpCode(''); }}
                          className="px-3 py-3 border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition flex-shrink-0"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4-Digit OTP Text Input Field */}
                  {otpSent && !otpVerified && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in-up">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy">
                          Enter 4-Digit OTP Code *
                        </label>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading || verifyingOtp}
                          className="text-xs font-bold text-psg-blue hover:underline disabled:opacity-50"
                        >
                          {otpLoading ? 'Sending...' : 'Resend OTP'}
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="text"
                          name="otpCode"
                          maxLength={4}
                          pattern="[0-9]*"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="1234"
                          className="w-full text-center text-xl font-mono tracking-[0.4em] py-3 pl-10 pr-4 rounded-xl border border-slate-300 focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition bg-white font-extrabold text-slate-800"
                        />
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otpCode.length !== 4}
                        className="w-full py-3 px-4 rounded-xl bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {verifyingOtp ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>VERIFY OTP</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Profile Photo (Optional) */}
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

                  {/* Verification Status Banner */}
                  {otpNotice && (
                    <div className={`p-3 border rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-scale-up ${otpVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-psg-navy'}`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${otpVerified ? 'text-emerald-600' : 'text-psg-blue'}`} />
                        <span>{otpNotice}</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  {!otpVerified ? (
                    <button
                      type="button"
                      onClick={otpSent ? handleVerifyOtp : handleSendOtp}
                      disabled={otpLoading || (otpSent && otpCode.length !== 4)}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {otpLoading || verifyingOtp ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{otpSent ? 'VERIFY OTP CODE' : 'SEND OTP VIA CALL'}</span>
                          <ArrowRight className="w-4 h-4 text-psg-gold" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>CREATE ACCOUNT</span>
                          <ArrowRight className="w-4 h-4 text-psg-gold" />
                        </>
                      )}
                    </button>
                  )}
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
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
            <Link to="/login" className="font-extrabold text-psg-blue hover:text-psg-navy underline">
              Sign In here
            </Link>
          </p>
        </div>

          </>
        )}

      </div>
    </div>
  );
}
