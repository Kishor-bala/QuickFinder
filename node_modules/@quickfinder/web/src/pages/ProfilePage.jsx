import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Camera, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PsgLogo from '../components/PsgLogo';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profile_photo || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      if (profilePhoto) formData.append('profile_photo', profilePhoto);

      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(res.data.user);
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassSuccess('');
    setPassError('');

    if (newPassword !== confirmNewPassword) {
      setPassError('New passwords do not match.');
      setPassLoading(false);
      return;
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setPassSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Change password error:', err);
      setPassError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-psg-blue">
          PSG TECH • USER ACCOUNT
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-psg-navy tracking-tight font-['Outfit']">
          Student / Staff Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Manage your account credentials, contact information, and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* User Badge Card */}
        <div className="bg-psg-navy rounded-3xl p-6 text-white text-center space-y-4 shadow-xl border border-blue-900/60 h-fit">
          <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-4 border-psg-gold bg-psg-blue text-psg-navy flex items-center justify-center font-black text-3xl shadow-lg">
            {previewUrl ? (
              <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
            <label className="absolute inset-0 bg-psg-navy/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="w-6 h-6 text-psg-gold" />
              <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-white font-['Outfit']">{user?.name}</h3>
            <p className="text-xs font-bold text-psg-gold">Roll / ID: @{user?.user_id}</p>
            <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              user?.role === 'admin' ? 'bg-psg-gold text-psg-navy' : 'bg-white/10 text-slate-200'
            }`}>
              {user?.role === 'admin' ? 'Campus Administrator' : 'PSG CAS Student/Staff'}
            </span>
          </div>

          <div className="pt-3 border-t border-white/10 text-left text-xs space-y-2 text-slate-300 font-medium">
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-psg-gold flex-shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-psg-gold flex-shrink-0" />
              <span>{user?.phone}</span>
            </div>
          </div>
        </div>

        {/* Forms Container */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Edit Profile Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-psg-blue" />
              <h2 className="text-lg font-black text-psg-navy font-['Outfit']">Edit Personal Details</h2>
            </div>

            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-psg-blue outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-psg-blue outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Student Roll / Staff ID (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.user_id || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Primary Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs font-semibold cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2.5 rounded-xl bg-psg-navy hover:bg-slate-900 text-white text-xs font-extrabold shadow-md border border-psg-gold disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'UPDATE PROFILE'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-psg-blue" />
              <h2 className="text-lg font-black text-psg-navy font-['Outfit']">Change Password</h2>
            </div>

            {passSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{passSuccess}</span>
              </div>
            )}
            {passError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-psg-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-psg-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-psg-blue outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-6 py-2.5 rounded-xl bg-psg-blue hover:bg-psg-royal text-white text-xs font-extrabold transition disabled:opacity-50 shadow-md"
                >
                  {passLoading ? 'Updating...' : 'CHANGE PASSWORD'}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
