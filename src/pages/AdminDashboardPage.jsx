import React, { useState, useEffect } from 'react';
import { Shield, Users, Search, Upload, Sparkles, CheckCircle, Clock, Trash2, Ban, Check, RefreshCw, BarChart2, Megaphone, FileText, MapPin, Key, UserX, UserCheck, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [matches, setMatches] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('normal');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, uRes, lRes, fRes, cRes, matchRes, aRes, annRes, logRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/users'),
        api.get('/admin/lost-items'),
        api.get('/admin/found-items'),
        api.get('/admin/claims'),
        api.get('/admin/match-center').catch(() => ({ data: { matches: [] } })),
        api.get('/admin/analytics').catch(() => ({ data: {} })),
        api.get('/admin/announcements').catch(() => ({ data: {} })),
        api.get('/admin/audit-logs').catch(() => ({ data: {} })),
      ]);

      setMetrics(mRes.data.metrics);
      setUsers(uRes.data.users || []);
      setLostItems(lRes.data.items || []);
      setFoundItems(fRes.data.items || []);
      setClaims(cRes.data.claims || []);
      setMatches(matchRes.data.matches || []);
      setAnalytics(aRes.data?.analytics || null);
      setAnnouncements(annRes.data?.announcements || []);
      setAuditLogs(logRes.data?.logs || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/status`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle user status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchAdminData();
      alert('User deleted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleSendResetPasswordLink = async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/reset-password`);
      alert(res.data.message || 'Password reset link sent to user email.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send password reset link.');
    }
  };

  const handleUpdateRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Change role of user to ${newRole.toUpperCase()}?`)) return;
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} listing?`)) return;
    try {
      await api.delete(`/admin/items/${type}/${id}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  const handleResolveItem = async (type, id) => {
    try {
      await api.put(`/admin/items/${type}/${id}/resolve`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve item.');
    }
  };

  const handleReviewMatch = async (matchId, action) => {
    try {
      await api.post(`/admin/matches/${matchId}/review`, { action });
      fetchAdminData();
      alert(`Match ${action === 'MATCH_CONFIRMED' ? 'confirmed' : 'dismissed'} successfully.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review match.');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    try {
      await api.post('/admin/announcements', { title: annTitle, content: annContent, priority: annPriority });
      setAnnTitle('');
      setAnnContent('');
      fetchAdminData();
      alert('Campus announcement published!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish announcement.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-psg-navy text-psg-gold flex items-center justify-center shadow-lg border border-psg-gold/40">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-psg-blue">PSG TECH</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-psg-gold text-psg-navy">
                Super-Admin Access Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-psg-navy tracking-tight font-['Outfit']">
              Admin Control Center
            </h1>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-psg-navy text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-psg-blue" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {['overview', 'matchCenter', 'users', 'lost', 'found', 'claims', 'analytics', 'announcements', 'audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide uppercase transition whitespace-nowrap ${
              activeTab === tab ? 'bg-psg-navy text-psg-gold shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'matchCenter' ? 'Match Center' : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 font-bold text-sm">Loading admin analytics & records...</div>
      ) : (
        <div className="space-y-6">
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-3xl font-black text-psg-navy block">{metrics.totalUsers}</span>
                <span className="text-[10px] font-bold uppercase text-slate-500">Total Users</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-3xl font-black text-rose-600 block">{metrics.totalLostItems}</span>
                <span className="text-[10px] font-bold uppercase text-slate-500">Lost Reports</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-3xl font-black text-emerald-600 block">{metrics.totalFoundItems}</span>
                <span className="text-[10px] font-bold uppercase text-slate-500">Found Uploads</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-3xl font-black text-brand-600 block">{metrics.successfulMatches}</span>
                <span className="text-[10px] font-bold uppercase text-slate-500">Active Matches</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-3xl font-black text-amber-600 block">{metrics.pendingClaims}</span>
                <span className="text-[10px] font-bold uppercase text-slate-500">Pending Claims</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-3xl font-black text-teal-600 block">{metrics.claimedItems}</span>
                <span className="text-[10px] font-bold uppercase text-slate-500">Resolved Returns</span>
              </div>
            </div>
          )}

          {/* Tab: Match Center */}
          {activeTab === 'matchCenter' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
                <div>
                  <h3 className="font-black text-psg-navy text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" /> AI 8-Factor Candidate Match Center
                  </h3>
                  <p className="text-xs text-slate-600">Review AI suggested potential matches between Lost reports and Found listings (Threshold ≥ 70%).</p>
                </div>
                <span className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-xl shadow">{matches.length} Candidates</span>
              </div>

              {matches.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-3xl border border-slate-200 text-slate-500 font-medium text-xs">
                  No candidate matches requiring admin review at this time.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map(m => (
                    <div key={m.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          m.confidenceLevel === 'VERY_HIGH' ? 'bg-emerald-100 text-emerald-800' :
                          m.confidenceLevel === 'HIGH' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {m.confidenceLevel || 'CANDIDATE'} MATCH ({m.matchScore ? Math.round(m.matchScore * 100) : 0}%)
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(m.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-rose-600 uppercase block">Lost Item</span>
                          <span className="font-extrabold text-slate-900 block">{m.lostItemTitle || m.lostItemId}</span>
                          <span className="text-[10px] text-slate-500">{m.lostCategory}</span>
                        </div>
                        <div className="border-l pl-3 border-slate-200">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase block">Found Listing</span>
                          <span className="font-extrabold text-slate-900 block">{m.foundItemTitle || m.foundItemId}</span>
                          <span className="text-[10px] text-slate-500">{m.foundCategory}</span>
                        </div>
                      </div>

                      {m.factorBreakdown && (
                        <div className="text-[10px] space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-600 uppercase block">Matched Factors:</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(m.factorBreakdown).map(([factor, val]) => val > 0 && (
                              <span key={factor} className="px-2 py-0.5 bg-white text-slate-700 font-semibold rounded border border-slate-200">
                                {factor}: {Math.round(val * 100)}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleReviewMatch(m.id, 'MATCH_CONFIRMED')}
                          className="flex-1 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow hover:bg-emerald-700 transition flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Confirm Match
                        </button>
                        <button
                          onClick={() => handleReviewMatch(m.id, 'MATCH_DISMISSED')}
                          className="py-2 px-4 bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Users */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b">
                  <tr>
                    <th className="p-4">Name / ID</th>
                    <th className="p-4">Email / Phone</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Reputation</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Super-Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="p-4 font-bold text-slate-900">{u.name} <span className="text-slate-400 block text-[10px]">{u.user_id || u.id}</span></td>
                      <td className="p-4">{u.email}<span className="block text-[10px] text-slate-400">{u.phone}</span></td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-brand-50 text-brand-700'
                        }`}>
                          {u.role || 'student'}
                        </span>
                      </td>
                      <td className="p-4 text-emerald-600 font-bold">+{u.reputationScore || 0} pts</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${u.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {u.is_active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          {u.is_active !== false ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleSendResetPasswordLink(u.id)}
                          className="px-2.5 py-1 rounded-lg border border-brand-200 bg-brand-50 text-[10px] font-bold text-brand-700 hover:bg-brand-100"
                          title="Send Password Reset Email via Firebase Auth"
                        >
                          <Key className="w-3 h-3 inline mr-1" /> Reset Pass
                        </button>
                        <button
                          onClick={() => handleUpdateRole(u.id, u.role)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Role Toggle
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3 & 4: Lost & Found List */}
          {(activeTab === 'lost' || activeTab === 'found') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeTab === 'lost' ? lostItems : foundItems).map(item => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{item.category}</span>
                    <span className="text-xs font-bold text-slate-500">{item.lost_date || item.found_date}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{item.item_name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{item.building || item.lost_location || item.found_location}</p>
                  <div className="pt-2 flex gap-2">
                    <button onClick={() => handleResolveItem(activeTab, item.id)} className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100">Resolve</button>
                    <button onClick={() => handleDeleteItem(activeTab, item.id)} className="py-1.5 px-3 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Analytics & Hotspots */}
          {activeTab === 'analytics' && analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" /> Campus Hotspot Buildings
                </h3>
                <div className="space-y-2">
                  {analytics.topLocations?.map((loc, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-bold">
                      <span className="text-slate-800">{loc.location}</span>
                      <span className="px-2.5 py-1 bg-brand-100 text-brand-800 rounded-full">{loc.count} reports</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-emerald-600" /> Top Reported Categories
                </h3>
                <div className="space-y-2">
                  {analytics.topCategories?.map((cat, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-bold">
                      <span className="text-slate-800">{cat.category}</span>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">{cat.count} items</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Announcements */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateAnnouncement} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-500" /> Publish Campus Announcement
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Announcement Title"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    required
                    className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
                  />
                  <select
                    value={annPriority}
                    onChange={e => setAnnPriority(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Announcement</option>
                  </select>
                </div>
                <textarea
                  placeholder="Announcement Details for campus community..."
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
                />
                <button type="submit" className="px-6 py-2.5 bg-psg-navy text-psg-gold font-bold text-xs rounded-xl shadow hover:bg-slate-900 transition">
                  PUBLISH ANNOUNCEMENT
                </button>
              </form>

              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">{ann.title}</span>
                      <span className="text-[10px] text-slate-400">{new Date(ann.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-600">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 7: Audit Logs */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td className="p-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 font-bold text-psg-navy">{log.action}</td>
                      <td className="p-4 text-slate-700">{log.actorId}</td>
                      <td className="p-4 text-slate-500 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

