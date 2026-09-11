import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, AlertCircle, Sparkles, CheckCircle2, ArrowLeft, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageUploader from '../components/ImageUploader';
import MatchModal from '../components/MatchModal';
import PsgLogo from '../components/PsgLogo';

export default function ReportLostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Mobile',
    brand: '',
    model: '',
    colour: '',
    lost_date: new Date().toLocaleDateString('en-CA'),
    lost_time: '',
    lost_location: '',
    description: '',
    identifying_details: '',
    contact_number: user?.phone || '',
    contact_email: user?.email || '',
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchPopupData, setMatchPopupData] = useState(null);

  const categories = [
    'Mobile',
    'Laptop',
    'Wallet',
    'ID Card',
    'Keys',
    'Bag',
    'Books',
    'Electronics',
    'Accessories',
    'Other',
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.item_name || !formData.category || !formData.lost_date || !formData.lost_location) {
      setError('Please fill in all required fields (Item Name, Category, Date, Location).');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val) data.append(key, val);
      });

      images.forEach((img) => {
        data.append('images', img.file);
      });

      const res = await api.post('/lost-items', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const matches = res.data.matches || [];
      if (matches.length > 0) {
        setMatchPopupData(matches[0]);
      } else {
        navigate('/my-items');
      }
    } catch (err) {
      console.error('Lost item submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit report. Please check the form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-psg-navy hover:text-psg-blue transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header Banner */}
      <div className="bg-psg-navy rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-blue-900/60 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-psg-gold/40 flex items-center justify-center text-psg-gold shadow">
              <Search className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-psg-gold">
                PSG TECH • LOST PROPERTY REPORT
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-['Outfit']">
                Report Lost Belonging
              </h1>
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-xl leading-relaxed z-10 font-medium">
          Enter complete details about your lost item. PSG Quick Finder will automatically scan existing & future found item uploads across campus.
        </p>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        
        {error && (
          <div className="flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Item Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Item Name *
            </label>
            <input
              type="text"
              name="item_name"
              required
              value={formData.item_name}
              onChange={handleChange}
              placeholder="e.g. Lenovo ThinkPad Laptop or Black Leather Wallet"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition font-semibold"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Category *
            </label>
            <select
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition bg-white cursor-pointer font-semibold"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Colour */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Colour
            </label>
            <input
              type="text"
              name="colour"
              value={formData.colour}
              onChange={handleChange}
              placeholder="e.g. Black, Silver, Blue"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Brand / Manufacturer
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g. Apple, Samsung, Lenovo, Titan"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Model / Specification
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g. ThinkPad E14, iPhone 14 Pro"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
            />
          </div>

          {/* Approximate Date Lost */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Approximate Date Lost *
            </label>
            <input
              type="date"
              name="lost_date"
              required
              max={new Date().toLocaleDateString('en-CA')}
              value={formData.lost_date}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition cursor-pointer"
            />
          </div>

          {/* Approximate Time Lost */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Approximate Time Lost
            </label>
            <input
              type="time"
              name="lost_time"
              value={formData.lost_time}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition cursor-pointer"
            />
          </div>

          {/* Location Lost (Manual Free Text Input as requested) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Campus Location Lost * (Type Manually)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-psg-blue absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="lost_location"
                required
                value={formData.lost_location}
                onChange={handleChange}
                placeholder="e.g. Central Library 2nd Floor, GRD Auditorium, Computer Lab 3, Mech Block"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
              />
            </div>
          </div>

          {/* Detailed Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Detailed Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe appearance, condition, or contents (e.g. Black pouch with PSG roll number tag)."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
            />
          </div>

          {/* Unique Identifying Details */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Unique Identifying Marks (Used for claim verification)
            </label>
            <input
              type="text"
              name="identifying_details"
              value={formData.identifying_details}
              onChange={handleChange}
              placeholder="e.g. Specific sticker on back lid, student roll number inside battery slot"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Contact Mobile Phone Number
            </label>
            <input
              type="tel"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Contact Email Address
            </label>
            <input
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="name@psgtech.ac.in"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition"
            />
          </div>

          {/* Item Photos */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Item Reference Photos (Optional)
            </label>
            <ImageUploader images={images} setImages={setImages} maxFiles={5} />
          </div>

        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-sm shadow-lg flex items-center gap-2 transition-all disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-psg-gold" />
                <span>SUBMIT LOST REPORT</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Match Found Popup */}
      {matchPopupData && (
        <MatchModal
          match={matchPopupData}
          onClose={() => {
            setMatchPopupData(null);
            navigate('/my-items');
          }}
          onDismiss={() => {
            setMatchPopupData(null);
            navigate('/my-items');
          }}
        />
      )}

    </div>
  );
}
