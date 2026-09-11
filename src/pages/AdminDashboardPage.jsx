import React, { useState, useEffect } from 'react';
import { Shield, Users, Search, Upload, Sparkles, CheckCircle, Clock, Trash2, Ban, Check, RefreshCw } from 'lucide-react';
import api from '../services/api';
import PsgLogo from '../components/PsgLogo';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, uRes, lRes, fRes, cRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/users'),
        api.get('/admin/lost-items'),
        api.get('/admin/found-items'),
        api.get('/admin/claims'),
      ]);

      setMetrics(mRes.data.metrics);
      setUsers(uRes.data.users || []);
      setLostItems(lRes.data.items || []);
      setFoundItems(fRes.data.items || []);
      setClaims(cRes.data.claims || []);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-psg-navy text-psg-gold flex items-center justify-center shadow-lg border border-psg-gold/40">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-psg-blue">PSG TECH</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-psg-gold text-psg-navy">
                Institutional Admin
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

      {/* Admin Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Users</span>
          <p className="text-2xl sm:text-3xl font-black text-psg-navy font-['Outfit']">{metrics?.totalUsers ?? '—'}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-psg-blue">Lost Items</span>
          <p className="text-2xl sm:text-3xl font-black text-psg-blue font-['Outfit']">{metrics?.totalLost ?? '—'}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-psg-amber">Found Items</span>
          <p className="text-2xl sm:text-3xl font-black text-psg-amber font-['Outfit']">{metrics?.totalFound ?? '—'}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">High Matches</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-['Outfit']">{metrics?.successfulMatches ?? '—'}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600">Claimed Items</span>
          <p className="text-2xl sm:text-3xl font-black text-teal-600 font-['Outfit']">{metrics?.claimedItems ?? '—'}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Pending Claims</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 font-['Outfit']">{metrics?.pendingClaims ?? '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
            activeTab === 'overview' ? 'bg-psg-navy text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
            activeTab === 'users' ? 'bg-psg-navy text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Students & Staff ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('lost')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
            activeTab === 'lost' ? 'bg-psg-navy text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Lost Reports ({lostItems.length})
        </button>
        <button
          onClick={() => setActiveTab('found')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
            activeTab === 'found' ? 'bg-psg-navy text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Found Listings ({foundItems.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
            activeTab === 'claims' ? 'bg-psg-navy text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Claims Audit ({claims.length})
        </button>
      </div>

      {/* Main Tab Views */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-psg-navy mx-auto"></div>
        </div>
      ) : activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
            <h3 className="font-extrabold text-psg-navy text-base font-['Outfit']">Recent Campus Found Uploads</h3>
            <div className="space-y-3">
              {foundItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 text-xs">
                  <div>
                    <p className="font-bold text-psg-navy">{item.item_name}</p>
                    <p className="text-slate-500 font-medium">{item.found_location} • by {item.user_name}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-psg-navy text-psg-gold">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
            <h3 className="font-extrabold text-psg-navy text-base font-['Outfit']">Recent Campus Lost Reports</h3>
            <div className="space-y-3">
              {lostItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 text-xs">
                  <div>
                    <p className="font-bold text-psg-navy">{item.item_name}</p>
                    <p className="text-slate-500 font-medium">{item.lost_location} • by {item.user_name}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-psg-blue">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-psg-navy font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Student / Staff Name</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Lost / Found Reports</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="font-extrabold text-psg-navy">{u.name}</p>
                      <p className="text-[11px] text-psg-blue font-bold">Roll / ID: @{u.user_id}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-700 font-medium">{u.email}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{u.phone}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.role === 'admin' ? 'bg-psg-gold text-psg-navy' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {u.lost_count} lost / {u.found_count} found
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs ${
                            u.is_active
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'lost' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-psg-navy font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Reporter</th>
                  <th className="p-4">Location & Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lostItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="font-extrabold text-psg-navy">{item.item_name}</p>
                      {item.brand && <span className="text-[11px] text-slate-400 font-medium">{item.brand} {item.model}</span>}
                    </td>
                    <td className="p-4 font-bold text-slate-700">{item.category}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.user_name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{item.user_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-700 font-medium">{item.lost_location}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{item.lost_date}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {item.status !== 'Closed' && (
                        <button
                          onClick={() => handleResolveItem('lost', item.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteItem('lost', item.id)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold"
                        title="Delete listing"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'found' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-psg-navy font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Finder</th>
                  <th className="p-4">Location & Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {foundItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="font-extrabold text-psg-navy">{item.item_name}</p>
                      {item.brand && <span className="text-[11px] text-slate-400 font-medium">{item.brand}</span>}
                    </td>
                    <td className="p-4 font-bold text-slate-700">{item.category}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.user_name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{item.user_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-700 font-medium">{item.found_location}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{item.found_date}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.status === 'Claimed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Claim Requested'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-50 text-psg-blue'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {item.status !== 'Resolved' && (
                        <button
                          onClick={() => handleResolveItem('found', item.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteItem('found', item.id)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold"
                        title="Delete listing"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-psg-navy font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Item Claimed</th>
                  <th className="p-4">Claimant</th>
                  <th className="p-4">Uploader / Finder</th>
                  <th className="p-4">Claim Explanation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="font-extrabold text-psg-navy">{claim.found_item_name}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{claim.item_category}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{claim.claimant_name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{claim.claimant_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{claim.uploader_name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{claim.uploader_email}</p>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-slate-600 italic truncate font-medium" title={claim.message}>
                        "{claim.message}"
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        claim.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : claim.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-psg-gold text-psg-navy'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 whitespace-nowrap font-medium">
                      {new Date(claim.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
