import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Upload, Sparkles, ArrowRight, Bell, AlertTriangle, ShieldCheck, CheckCircle2, MapPin, Calendar, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MatchModal from '../components/MatchModal';
import PsgLogo from '../components/PsgLogo';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [activeMatchPopup, setActiveMatchPopup] = useState(null);
  const [userStats, setUserStats] = useState({ lostCount: 0, foundCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [matchRes, lostRes, foundRes] = await Promise.all([
          api.get('/matches'),
          api.get('/lost-items?userOnly=true'),
          api.get('/found-items?userOnly=true'),
        ]);

        const userMatches = matchRes.data.matches || [];
        setMatches(userMatches);
        setUserStats({
          lostCount: lostRes.data.items?.length || 0,
          foundCount: foundRes.data.items?.length || 0,
        });

        // Show match modal once if high match score >= 80%
        const highMatch = userMatches.find((m) => m.match_score >= 80 && m.match_status === 'pending');
        if (highMatch && !sessionStorage.getItem(`seen_match_${highMatch.id}`)) {
          setActiveMatchPopup(highMatch);
          sessionStorage.setItem(`seen_match_${highMatch.id}`, 'true');
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* PSG Institutional Welcome Banner */}
      <div className="bg-psg-navy rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-blue-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        
        {/* Banner Content */}
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-psg-gold/30 text-psg-gold text-xs font-extrabold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            PSG CAS CAMPUS DASHBOARD
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-['Outfit']">
            Welcome, <span className="text-psg-gold">{user?.name}</span>!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
            Roll / ID: <strong>{user?.user_id}</strong> • Access your lost item reports, upload found belongings, and track claim notifications.
          </p>
        </div>

        {/* User Stats Grid */}
        <div className="flex items-center gap-3 z-10 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-center min-w-[105px] shadow-sm">
            <span className="block text-2xl sm:text-3xl font-black text-white font-['Outfit']">{userStats.lostCount}</span>
            <span className="text-[10px] sm:text-xs text-slate-300 font-extrabold uppercase tracking-wider">Lost Reports</span>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-center min-w-[105px] shadow-sm">
            <span className="block text-2xl sm:text-3xl font-black text-psg-gold font-['Outfit']">{userStats.foundCount}</span>
            <span className="text-[10px] sm:text-xs text-slate-300 font-extrabold uppercase tracking-wider">Found Uploads</span>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-center min-w-[105px] shadow-sm">
            <span className="block text-2xl sm:text-3xl font-black text-emerald-400 font-['Outfit']">{matches.length}</span>
            <span className="text-[10px] sm:text-xs text-slate-300 font-extrabold uppercase tracking-wider">Active Matches</span>
          </div>
        </div>

        {/* Decorative Glow */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 rounded-full bg-psg-gold/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Action Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black text-psg-navy tracking-tight font-['Outfit']">
          Select Campus Action
        </h2>
        <p className="text-slate-500 text-sm font-medium">Choose an option below to search or report belongings</p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        
        {/* CARD 1: 🔍 SEARCH & REPORT LOST */}
        <div className="group relative bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl hover:shadow-2xl hover:border-psg-blue transition-all duration-300 flex flex-col justify-between overflow-hidden">
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-psg-navy text-psg-gold flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-md">
              <Search className="w-8 h-8 stroke-[2.5]" />
            </div>
            
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-psg-blue text-xs font-extrabold uppercase tracking-wider">
                Module 1
              </div>
              <h3 className="text-3xl font-black text-psg-navy tracking-tight font-['Outfit'] group-hover:text-psg-blue transition-colors">
                FIND LOST BELONGINGS
              </h3>
              <p className="text-slate-600 text-sm sm:text-base font-semibold">
                "Search found items or report what you lost"
              </p>
              <p className="text-slate-500 text-xs leading-relaxed pt-1 font-medium">
                Browse all items found on campus or submit a lost item report. Our engine continuously runs multi-field similarity matching.
              </p>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            <Link
              to="/find"
              className="w-full py-4 px-6 rounded-2xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
            >
              <span>BROWSE FOUND DIRECTORY</span>
              <ArrowRight className="w-4 h-4 text-psg-gold" />
            </Link>

            <Link
              to="/report-lost"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-center text-xs font-extrabold text-psg-navy hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              <PlusCircle className="w-4 h-4 text-rose-500" />
              <span>Report a Lost Item</span>
            </Link>
          </div>
        </div>

        {/* CARD 2: 📤 UPLOAD FOUND ITEM */}
        <div className="group relative bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl hover:shadow-2xl hover:border-psg-gold transition-all duration-300 flex flex-col justify-between overflow-hidden">
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-psg-gold text-psg-navy flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-md">
              <Upload className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-psg-amber text-xs font-extrabold uppercase tracking-wider">
                Module 2
              </div>
              <h3 className="text-3xl font-black text-psg-navy tracking-tight font-['Outfit'] group-hover:text-psg-amber transition-colors">
                UPLOAD FOUND ITEM
              </h3>
              <p className="text-slate-600 text-sm sm:text-base font-semibold">
                "Report something you found on campus"
              </p>
              <p className="text-slate-500 text-xs leading-relaxed pt-1 font-medium">
                Upload photos, specify campus location, and add a verification question. Help reconnect owners with their lost belongings!
              </p>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            <Link
              to="/upload"
              className="w-full py-4 px-6 rounded-2xl bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-sm shadow-lg border-2 border-psg-gold flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
            >
              <span>UPLOAD FOUND ITEM</span>
              <ArrowRight className="w-4 h-4 text-psg-gold" />
            </Link>

            <Link
              to="/my-items"
              className="w-full inline-block py-3 px-4 text-center text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              View My Reported Items & Claims
            </Link>
          </div>
        </div>

      </div>

      {/* Active High Matches Alert Section */}
      {matches.length > 0 && (
        <div className="max-w-5xl mx-auto bg-blue-50/80 border border-psg-blue/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-psg-navy text-psg-gold flex items-center justify-center shadow">
                <Sparkles className="w-5 h-5 text-psg-gold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-psg-navy font-['Outfit']">
                  Potential Campus Matches Found!
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Quick Finder identified potential matches for your reported lost items.
                </p>
              </div>
            </div>
            <Link
              to="/my-items"
              className="text-xs font-extrabold text-psg-blue hover:text-psg-navy underline"
            >
              View all ({matches.length})
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {matches.slice(0, 3).map((match) => (
              <div
                key={match.id}
                onClick={() => navigate(`/items/${match.found_item_id}`)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    {match.found_category}
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {match.match_score}% Match
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {match.found_images && match.found_images.length > 0 ? (
                    <img
                      src={match.found_images[0]}
                      alt={match.found_item_name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                      No photo
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-psg-navy truncate">
                      {match.found_item_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate font-medium">
                      <MapPin className="w-3 h-3 flex-shrink-0 text-psg-blue" />
                      {match.found_location}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium truncate">Reported: {match.lost_item_name}</span>
                  <span className="font-extrabold text-psg-blue flex items-center gap-1 flex-shrink-0">
                    View →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Found Popup Modal */}
      {activeMatchPopup && (
        <MatchModal
          match={{
            matchId: activeMatchPopup.id,
            score: activeMatchPopup.match_score,
            reasons: activeMatchPopup.match_reasons,
            foundItem: {
              id: activeMatchPopup.found_item_id,
              item_name: activeMatchPopup.found_item_name,
              category: activeMatchPopup.found_category,
              found_location: activeMatchPopup.found_location,
              found_date: activeMatchPopup.found_date,
              images: activeMatchPopup.found_images,
            },
          }}
          onClose={() => setActiveMatchPopup(null)}
          onDismiss={() => {
            setMatches((prev) => prev.filter((m) => m.id !== activeMatchPopup.id));
            setActiveMatchPopup(null);
          }}
        />
      )}

    </div>
  );
}
