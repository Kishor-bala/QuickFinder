import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderHeart, Search, Upload, PlusCircle, CheckCircle, XCircle, AlertCircle, Sparkles, MapPin, Calendar, Check, X, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PsgLogo from '../components/PsgLogo';

export default function MyItemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('lost');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claimsReceived, setClaimsReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lostRes, foundRes, claimsRes] = await Promise.all([
        api.get('/lost-items?userOnly=true'),
        api.get('/found-items?userOnly=true'),
        api.get('/claims?type=received'),
      ]);
      setLostItems(lostRes.data.items || []);
      setFoundItems(foundRes.data.items || []);
      setClaimsReceived(claimsRes.data.claims || []);
    } catch (err) {
      console.error('Failed to load user items:', err);
      toast.error('Failed to load user listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClaimResponse = async (claimId, action) => {
    setActionLoading(claimId);
    try {
      await api.put(`/claims/${claimId}/respond`, { action });
      toast.success(`Claim ${action === 'accept' ? 'accepted' : 'rejected'} successfully.`);
      await fetchData();
    } catch (err) {
      console.error('Failed to respond to claim:', err);
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Searching':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-psg-blue border border-blue-200">Searching</span>;
      case 'Possible Match':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Possible Match</span>;
      case 'Claim Requested':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Claim Requested</span>;
      case 'Claimed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Claimed ✓</span>;
      case 'Closed':
      case 'Resolved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Closed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-psg-blue">
            PSG TECH • STUDENT RECORDS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-psg-navy tracking-tight font-['Outfit']">
            My Items & Campus Claims
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage your reported lost items, found uploads, and review incoming ownership claims.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/report-lost"
            className="px-4 py-2.5 rounded-xl bg-psg-navy text-white hover:bg-psg-royal text-xs font-extrabold flex items-center gap-1.5 transition shadow"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Report Lost Item</span>
          </Link>
          <Link
            to="/upload"
            className="px-4 py-2.5 rounded-xl bg-psg-navy text-white hover:bg-psg-royal text-xs font-extrabold flex items-center gap-1.5 transition shadow border border-white/20"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Found Item</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveTab('lost')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'lost'
              ? 'border-psg-navy text-psg-navy'
              : 'border-transparent text-slate-500 hover:text-psg-navy'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Lost Reports</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-psg-navy">
            {lostItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('found')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'found'
              ? 'border-psg-navy text-psg-navy'
              : 'border-transparent text-slate-500 hover:text-psg-navy'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Found Uploads</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-psg-navy">
            {foundItems.length}
          </span>
          {claimsReceived.filter(c => c.status === 'Pending').length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-psg-navy text-white animate-pulse">
              {claimsReceived.filter(c => c.status === 'Pending').length} pending claims
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-psg-navy mx-auto"></div>
          <p className="text-slate-500 text-xs font-medium mt-3">Loading your records...</p>
        </div>
      ) : activeTab === 'lost' ? (
        /* LOST ITEMS TAB */
        lostItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-md max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-psg-navy text-white flex items-center justify-center mx-auto shadow">
              <Search className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-psg-navy font-['Outfit']">No lost items reported yet</h3>
              <p className="text-slate-500 text-xs font-medium">
                Items you report as lost will appear here along with live match scores.
              </p>
            </div>
            <Link
              to="/report-lost"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-psg-navy hover:bg-psg-royal text-white font-extrabold text-xs shadow-md"
            >
              Report Lost Belonging
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lostItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-psg-navy text-white">
                    {item.category}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <div className="flex gap-3 items-center">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.item_name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                      Lost
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-base text-psg-navy truncate">
                      {item.item_name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate font-medium">
                      <MapPin className="w-3.5 h-3.5 text-psg-navy flex-shrink-0" />
                      {item.lost_location}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      Lost on {item.lost_date}
                    </p>
                  </div>
                </div>

                {item.matchCount > 0 && (
                  <div className="p-3 bg-psg-navy text-white rounded-2xl border border-psg-royal/40 flex items-center justify-between text-xs font-semibold">
                    <span className="font-extrabold text-white flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-white" />
                      {item.matchCount} Match(es) Found
                    </span>
                    <Link
                      to={`/find?search=${encodeURIComponent(item.item_name)}`}
                      className="font-bold text-white underline hover:text-slate-300"
                    >
                      View Results →
                    </Link>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Reported {new Date(item.created_at).toLocaleDateString()}</span>
                  <Link
                    to={`/find?search=${encodeURIComponent(item.item_name)}`}
                    className="font-bold text-psg-navy hover:text-slate-700"
                  >
                    Check Directory
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* FOUND ITEMS TAB */
        <div className="space-y-8">
          
          {/* Claims Inspector */}
          {claimsReceived.length > 0 && (
            <div className="bg-psg-navy rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2.5 text-white font-extrabold text-base font-['Outfit']">
                <ShieldAlert className="w-5 h-5 text-white" />
                <h3>Claims Received on Items You Found ({claimsReceived.length})</h3>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Review claimant explanations below. Accepting a claim marks the item as Claimed and safely unlocks contact details.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {claimsReceived.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 text-slate-900 shadow-md space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Claim for Item:
                        </span>
                        <h4 className="font-extrabold text-sm text-psg-navy">{claim.item_name}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        claim.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : claim.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-psg-navy text-white'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-medium">
                      <p className="text-slate-600">
                        Claimant: <strong className="text-psg-navy">{claim.claimant_name}</strong> (Roll: @{claim.claimant_uid})
                      </p>
                      <p className="text-slate-500">
                        Submitted: <strong>{new Date(claim.created_at).toLocaleDateString()}</strong>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-psg-navy tracking-wider">
                        Ownership Proof Explanation:
                      </span>
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic font-medium">
                        "{claim.message}"
                      </p>
                    </div>

                    {claim.proof_image && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-psg-navy uppercase tracking-wider">
                          Uploaded Proof Photo:
                        </span>
                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                          <img src={claim.proof_image} alt="Proof" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {/* Accept / Reject Controls */}
                    {claim.status === 'Pending' && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                        <button
                          onClick={() => handleClaimResponse(claim.id, 'accept')}
                          disabled={actionLoading === claim.id}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-psg-navy hover:bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 text-white" />
                          <span>ACCEPT CLAIM</span>
                        </button>
                        <button
                          onClick={() => handleClaimResponse(claim.id, 'reject')}
                          disabled={actionLoading === claim.id}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>REJECT</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Found Items Grid */}
          {foundItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-md max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-psg-navy text-white flex items-center justify-center mx-auto shadow">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-psg-navy font-['Outfit']">No found items uploaded yet</h3>
                <p className="text-slate-500 text-xs font-medium">
                  Items you upload as found will appear here along with incoming claims.
                </p>
              </div>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-xs shadow-md border border-white/20"
              >
                Upload Found Item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foundItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-psg-navy text-white">
                      {item.category}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex gap-3 items-center">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.item_name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                        Found
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-base text-psg-navy truncate">
                        {item.item_name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate font-medium">
                        <MapPin className="w-3.5 h-3.5 text-psg-blue flex-shrink-0" />
                        {item.found_location}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        Found on {item.found_date}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Uploaded {new Date(item.created_at).toLocaleDateString()}</span>
                    <Link
                      to={`/items/${item.id}`}
                      className="font-bold text-psg-blue hover:text-psg-navy"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
