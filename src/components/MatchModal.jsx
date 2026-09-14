import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, CheckCircle, X, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function MatchModal({ match, onClose, onDismiss }) {
  const navigate = useNavigate();

  if (!match) return null;

  const foundItem = match.foundItem || match;
  const imageUrl = (foundItem.images && foundItem.images.length > 0) ? foundItem.images[0] : null;

  const handleDismiss = async () => {
    if (match.matchId) {
      try {
        await api.put(`/matches/${match.matchId}/dismiss`);
      } catch (err) {
        console.error('Error dismissing match:', err);
      }
    }
    if (onDismiss) onDismiss();
    onClose();
  };

  const handleViewItem = () => {
    onClose();
    navigate(`/items/${foundItem.id || foundItem.found_item_id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-brand-100 max-w-md w-full overflow-hidden transform transition-all">
        
        {/* Top Celebration Header */}
        <div className="bg-psg-navy text-white p-6 text-center relative overflow-hidden border-b border-white/10">
          <div className="absolute top-2 right-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md mb-3 ring-4 ring-white/30 shadow-lg">
            <Sparkles className="w-7 h-7 text-white animate-bounce" />
          </div>
          <h3 className="text-xl font-black tracking-tight">🎉 Possible Match Found!</h3>
          <p className="text-slate-300 text-xs mt-1">
            We found an item that may belong to you.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* Card Preview */}
          <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {imageUrl ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                <img src={imageUrl} alt={foundItem.item_name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                Found
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                  {foundItem.category}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {match.score}% Match
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-base mt-1 truncate">
                {foundItem.item_name}
              </h4>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{foundItem.found_location}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Found on {foundItem.found_date}</span>
              </div>
            </div>
          </div>

          {/* Match reasons checklist */}
          {match.reasons && match.reasons.length > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 space-y-1.5 text-xs text-emerald-900">
              <span className="font-bold block text-emerald-800 mb-1">Why this matches:</span>
              {match.reasons.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleViewItem}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
            >
              <span>VIEW ITEM DETAILS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              NOT MY ITEM
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
