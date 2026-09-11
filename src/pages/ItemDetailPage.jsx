import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Tag, ShieldCheck, CheckCircle2, Sparkles, ArrowLeft, AlertCircle, Phone, Mail, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClaimModal from '../components/ClaimModal';
import PsgLogo from '../components/PsgLogo';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/found-items/${id}`);
      setItem(res.data.item);
    } catch (err) {
      console.error('Failed to fetch item details:', err);
      setError('Item not found or could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-psg-navy"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-psg-navy font-['Outfit']">Listing Unavailable</h2>
        <p className="text-xs text-slate-500 font-medium">{error || 'This listing may have been removed.'}</p>
        <Link to="/find" className="inline-block px-6 py-3 bg-psg-navy text-white rounded-xl text-xs font-bold shadow">
          Back to Directory
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === item.user_id;
  const images = item.images && item.images.length > 0 ? item.images : [];
  const currentPhoto = images[selectedPhotoIdx] || images[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-psg-navy hover:text-psg-blue transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to search results
      </button>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Photo Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-[4/3] rounded-3xl bg-slate-100 overflow-hidden border border-slate-200 shadow-xl">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={item.item_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                No Photographs Available
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-4 left-4">
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${
                item.status === 'Claimed'
                  ? 'bg-emerald-600 text-white'
                  : item.status === 'Claim Requested'
                  ? 'bg-psg-gold text-psg-navy'
                  : 'bg-psg-navy/90 text-psg-gold border border-psg-gold/30 backdrop-blur'
              }`}>
                {item.status}
              </span>
            </div>

            {/* User Match % badge */}
            {item.userMatch && (
              <div className="absolute top-4 right-4">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-psg-gold" />
                  {item.userMatch.match_score}% Match
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhotoIdx(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedPhotoIdx === idx
                      ? 'border-psg-blue ring-2 ring-psg-blue/30 scale-105'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Information Card */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-psg-navy text-psg-gold">
                  {item.category}
                </span>
                {item.brand && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {item.brand}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-psg-navy tracking-tight font-['Outfit']">
                {item.item_name}
              </h1>
            </div>

            {/* Discovery Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Found Location:</span>
                <p className="font-extrabold text-psg-navy flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-psg-blue flex-shrink-0" />
                  {item.found_location}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Found Date & Time:</span>
                <p className="font-extrabold text-psg-navy flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-psg-blue flex-shrink-0" />
                  {item.found_date} {item.found_time && `at ${item.found_time}`}
                </p>
              </div>

              {item.colour && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Colour:</span>
                  <p className="font-extrabold text-psg-navy flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-psg-blue flex-shrink-0" />
                    {item.colour}
                  </p>
                </div>
              )}

              {item.model && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Model:</span>
                  <p className="font-extrabold text-psg-navy">
                    {item.model}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-psg-navy">
                General Appearance & Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium">
                {item.description || 'No additional description provided by finder.'}
              </p>
            </div>

            {/* Custody notes */}
            {item.additional_notes && (
              <div className="space-y-1 text-xs">
                <span className="font-extrabold text-psg-navy uppercase tracking-wider text-[10px]">
                  Current Campus Custody:
                </span>
                <p className="text-slate-800 bg-amber-50 border border-amber-200 p-3 rounded-xl font-medium">
                  {item.additional_notes}
                </p>
              </div>
            )}

            {/* Match Checklist */}
            {item.userMatch && item.userMatch.match_reasons && item.userMatch.match_reasons.length > 0 && (
              <div className="p-5 rounded-2xl bg-blue-50 border border-psg-blue/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-psg-navy flex items-center gap-1.5 font-['Outfit']">
                    <Sparkles className="w-4 h-4 text-psg-gold" />
                    Why we think this matches your report:
                  </h4>
                  <span className="text-xs font-black text-psg-blue">
                    {item.userMatch.match_score}% Confidence
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-psg-navy font-semibold">
                  {item.userMatch.match_reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-psg-blue flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Protection Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-psg-navy text-xs font-extrabold">
                <ShieldCheck className="w-4 h-4 text-psg-blue" />
                <span>Finder Contact Privacy Protection</span>
              </div>
              {item.canViewContact ? (
                <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                  <p className="text-emerald-700 font-bold">
                    ✓ Verified Claim: Finder contact information unlocked!
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-800 font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Finder: <strong>{item.uploader_name}</strong>
                  </p>
                  {item.contact_number && (
                    <p className="flex items-center gap-1.5 text-slate-800 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Phone: <a href={`tel:${item.contact_number}`} className="text-psg-blue font-bold hover:underline">{item.contact_number}</a>
                    </p>
                  )}
                  {item.contact_email && (
                    <p className="flex items-center gap-1.5 text-slate-800 font-semibold">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email: <a href={`mailto:${item.contact_email}`} className="text-psg-blue font-bold hover:underline">{item.contact_email}</a>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  The finder's phone number and email address are concealed until an ownership claim request is verified.
                </p>
              )}
            </div>

            {/* Claim Action Button */}
            {!isOwner && (
              <div className="pt-2">
                {item.userClaim ? (
                  <div className={`p-4 rounded-2xl text-center text-xs font-bold ${
                    item.userClaim.status === 'Accepted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : item.userClaim.status === 'Rejected'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {item.userClaim.status === 'Accepted' && '🎉 Your ownership claim was accepted by the finder!'}
                    {item.userClaim.status === 'Pending' && '⏳ Claim request pending review by the finder.'}
                    {item.userClaim.status === 'Rejected' && 'Your previous claim request was declined.'}
                  </div>
                ) : item.status === 'Claimed' ? (
                  <div className="p-4 rounded-2xl bg-slate-100 text-center text-xs font-bold text-slate-600">
                    This item has already been successfully claimed and recovered.
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login');
                      } else {
                        setClaimModalOpen(true);
                      }
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-sm border-2 border-psg-gold shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <ShieldCheck className="w-5 h-5 text-psg-gold" />
                    <span>REQUEST TO CLAIM THIS ITEM</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Claim Modal */}
      {claimModalOpen && (
        <ClaimModal
          foundItem={item}
          matchId={item.userMatch?.id}
          onClose={() => setClaimModalOpen(false)}
          onSuccess={() => {
            fetchItem();
          }}
        />
      )}

    </div>
  );
}
