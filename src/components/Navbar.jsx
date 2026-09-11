import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Upload, Bell, User, Shield, LogOut, Menu, X, CheckCheck, FolderHeart, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PsgLogo from './PsgLogo';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-psg-navy/95 backdrop-blur border-b border-blue-900/60 shadow-lg shadow-psg-navy/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Logo & Tagline */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center group">
            <PsgLogo variant="dark" size="md" showTagline={true} />
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated ? (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link
                to="/dashboard"
                className={`px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                  isActive('/dashboard')
                    ? 'text-psg-gold bg-white/10 shadow-inner'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                Home
              </Link>

              <Link
                to="/find"
                className={`px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/find')
                    ? 'text-psg-gold bg-white/10 shadow-inner'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Search className="w-4 h-4 text-psg-gold" />
                Find Items
              </Link>

              <Link
                to="/upload"
                className={`px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/upload')
                    ? 'text-psg-gold bg-white/10 shadow-inner'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Upload className="w-4 h-4 text-psg-gold" />
                Found Item
              </Link>

              <Link
                to="/report-lost"
                className={`px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/report-lost')
                    ? 'text-psg-gold bg-white/10 shadow-inner'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-rose-400" />
                Report Lost
              </Link>

              <Link
                to="/my-items"
                className={`px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/my-items')
                    ? 'text-psg-gold bg-white/10 shadow-inner'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <FolderHeart className="w-4 h-4 text-blue-300" />
                My Items
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                    isActive('/admin')
                      ? 'bg-psg-gold text-psg-navy border-psg-gold shadow-gold'
                      : 'bg-psg-gold/20 text-psg-gold border-psg-gold/40 hover:bg-psg-gold hover:text-psg-navy'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin Portal
                </Link>
              )}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center space-x-3">
              <Link
                to="/find"
                className="px-4 py-2 text-xs lg:text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                Browse Lost & Found
              </Link>
              <Link
                to="/login"
                className="px-5 py-2 text-xs lg:text-sm font-extrabold text-psg-gold border border-psg-gold/40 hover:border-psg-gold hover:bg-psg-gold/10 rounded-xl transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-xs lg:text-sm font-extrabold text-psg-navy bg-gradient-to-r from-psg-gold to-amber-400 hover:from-amber-400 hover:to-psg-gold rounded-xl shadow-lg shadow-psg-gold/25 transition-all transform hover:-translate-y-0.5"
              >
                Create Account
              </Link>
            </nav>
          )}

          {/* Right Controls (Notifications + Profile Avatar) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-3">
              
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-psg-navy animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-3 z-50 animate-fade-in text-slate-900">
                    <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-psg-navy text-sm">Campus Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-psg-gold/20 text-psg-amber border border-psg-gold/30">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-psg-blue hover:text-psg-navy font-bold flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs font-medium">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.type === 'match' || notif.type.includes('claim')) navigate('/my-items');
                              setNotifDropdownOpen(false);
                            }}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                              !notif.is_read ? 'bg-blue-50/60' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-lg leading-none mt-0.5">
                                {notif.type === 'match' ? '🎉' : notif.type === 'claim' ? '🔔' : 'ℹ️'}
                              </span>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                <span className="text-[10px] font-semibold text-slate-400 mt-1 block">
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 px-4 border-t border-slate-100 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-xs font-bold text-psg-blue hover:text-psg-navy block py-1"
                      >
                        View Notification Center →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile avatar */}
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-white"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-psg-gold to-amber-500 text-psg-navy flex items-center justify-center font-extrabold text-xs uppercase overflow-hidden shadow">
                  {user.profile_photo ? (
                    <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name?.charAt(0) || 'U'
                  )}
                </div>
                <span className="text-xs font-bold truncate max-w-[100px]">
                  {user.name?.split(' ')[0]}
                </span>
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-2 text-slate-200">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-psg-navy"></span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-blue-900/80 bg-psg-navy px-4 pt-3 pb-6 space-y-2 text-white animate-fade-in">
          {isAuthenticated ? (
            <>
              <div className="py-2.5 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-psg-gold text-psg-navy flex items-center justify-center font-black text-sm">
                  {user.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                  <p className="text-xs text-psg-gold font-medium">Roll / ID: {user.user_id}</p>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                Home Dashboard
              </Link>
              <Link
                to="/find"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                Find Lost Items
              </Link>
              <Link
                to="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                Upload Found Item
              </Link>
              <Link
                to="/report-lost"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                Report Lost Item
              </Link>
              <Link
                to="/my-items"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                My Items & Claims
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                Profile Settings
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2.5 rounded-xl text-sm font-extrabold text-psg-navy bg-psg-gold"
                >
                  Admin Control Portal
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-white/10"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2.5 pt-2">
              <Link
                to="/find"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 px-4 text-center font-bold text-white bg-white/10 rounded-xl"
              >
                Browse Campus Items
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 px-4 text-center font-bold text-psg-gold border border-psg-gold/40 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 px-4 text-center font-extrabold text-psg-navy bg-psg-gold rounded-xl shadow-lg"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
