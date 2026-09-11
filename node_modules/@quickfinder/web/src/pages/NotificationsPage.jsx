import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Sparkles, ShieldAlert, CheckCircle, XCircle, Info, ExternalLink } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import PsgLogo from '../components/PsgLogo';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.is_read : true));

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  const handleClick = (notif) => {
    markAsRead(notif.id);
    if (notif.type === 'match' || notif.type.includes('claim')) {
      navigate('/my-items');
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'match':
        return <div className="w-10 h-10 rounded-2xl bg-psg-navy text-psg-gold flex items-center justify-center flex-shrink-0 shadow"><Sparkles className="w-5 h-5" /></div>;
      case 'claim':
        return <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-sm"><ShieldAlert className="w-5 h-5" /></div>;
      case 'claim_accepted':
        return <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm"><CheckCircle className="w-5 h-5" /></div>;
      case 'claim_rejected':
        return <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 shadow-sm"><XCircle className="w-5 h-5" /></div>;
      default:
        return <div className="w-10 h-10 rounded-2xl bg-blue-100 text-psg-blue flex items-center justify-center flex-shrink-0 shadow-sm"><Info className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-psg-blue">
            PSG TECH • NOTIFICATION CENTER
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-psg-navy tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-psg-gold" />
            <span>Campus Alerts</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white shadow">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            System updates, matching alerts, and claim verification status.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-psg-navy text-white hover:bg-slate-900 text-xs font-extrabold transition shadow"
          >
            <CheckCheck className="w-4 h-4 text-psg-gold" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition ${
            filter === 'all' ? 'bg-psg-navy text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition ${
            filter === 'unread' ? 'bg-psg-navy text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-md max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-psg-navy text-psg-gold flex items-center justify-center mx-auto shadow">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-black text-psg-navy text-base font-['Outfit']">No notifications</h3>
          <p className="text-slate-500 text-xs font-medium">
            {filter === 'unread' ? 'You have read all your notifications.' : 'Notifications will appear here when items match.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md divide-y divide-slate-100 overflow-hidden">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                !notif.is_read ? 'bg-blue-50/60' : ''
              }`}
            >
              {getNotifIcon(notif.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-sm text-psg-navy truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
                    {new Date(notif.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                  {notif.message}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleDelete(notif.id, e)}
                  className="p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
