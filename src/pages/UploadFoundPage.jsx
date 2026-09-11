import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, CheckCircle2, Sparkles, AlertCircle, ArrowLeft, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageUploader from '../components/ImageUploader';

export default function UploadFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Mobile',
    brand: '',
    model: '',
    colour: '',
    found_date: new Date().toLocaleDateString('en-CA'),
    found_time: '',
    found_location: '',
    description: '',
    identifying_details: '',
    additional_notes: '',
    contact_number: user?.phone || '',
    contact_email: user?.email || '',
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

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

    if (!formData.item_name || !formData.category || !formData.found_date || !formData.found_location) {
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

      const res = await api.post('/found-items', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessData({
        item: res.data.item,
        matchesFound: res.data.matchesFound || 0,
        matches: res.data.matches || [],
      });
    } catch (err) {
      console.error('Found item upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload found item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-psg-navy tracking-tight font-['Outfit']">
            Item Uploaded Successfully
          </h1>
          <p className="text-base text-slate-600 max-w-md mx-auto font-medium">
            Thank you for helping keep the PSG Tech campus honest!
          </p>
        </div>

        {successData.matchesFound > 0 ? (
          <div className="p-6 bg-blue-50/80 border border-psg-blue/30 rounded-3xl text-left space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-psg-navy font-extrabold text-base">
              <Sparkles className="w-5 h-5 text-psg-gold" />
              <span>Potential Owner Found!</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Our automated matching system detected <strong>{successData.matchesFound}</strong> previously reported lost item(s) that match what you uploaded. We have notified the owner(s) to verify and submit ownership proof.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to={`/items/${successData.item.id}`}
                className="px-5 py-2.5 rounded-xl bg-psg-navy hover:bg-slate-900 text-white font-extrabold text-xs shadow-md"
              >
                View Your Listing
              </Link>
              <Link
                to="/my-items"
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-psg-navy font-bold text-xs hover:bg-slate-50"
              >
                Go to My Items
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-left space-y-2">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Your item has been uploaded to the PSG Quick Finder directory. We will notify you when a matching lost item report is filed.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to={`/items/${successData.item.id}`}
                className="px-5 py-2.5 rounded-xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-xs shadow-md"
              >
                View Listing Details
              </Link>
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-psg-navy font-bold text-xs hover:bg-slate-50"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

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
              <Upload className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-psg-gold">
                PSG TECH • FOUND PROPERTY UPLOAD
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-['Outfit']">
                Upload Found Belonging
              </h1>
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-xl leading-relaxed z-10 font-medium">
          Enter details of the item found on campus. Your contact details remain confidential until an ownership claim is verified.
        </p>
      </div>

      {/* Upload Form */}
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
              placeholder="e.g. Wildcraft Backpack or Black Samsung Smartphone"
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
              placeholder="e.g. Black, Navy Blue, Silver"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition"
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
              placeholder="e.g. Samsung, Apple, Wildcraft, Dell"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g. Galaxy S23, Air M2"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition"
            />
          </div>

          {/* Found Date */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Found Date *
            </label>
            <input
              type="date"
              name="found_date"
              required
              max={new Date().toLocaleDateString('en-CA')}
              value={formData.found_date}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition cursor-pointer"
            />
          </div>

          {/* Found Time */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Found Time
            </label>
            <input
              type="time"
              name="found_time"
              value={formData.found_time}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition cursor-pointer"
            />
          </div>

          {/* Found Location (Manual Free Text Input as requested) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Campus Found Location * (Type Manually)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-psg-blue absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="found_location"
                required
                value={formData.found_location}
                onChange={handleChange}
                placeholder="e.g. Central Library Table 4, GRD Auditorium Entrance, Canteen, Hostel Mess"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue focus:ring-2 focus:ring-psg-blue/20 outline-none transition"
              />
            </div>
          </div>

          {/* Detailed Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              General Appearance & Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe general appearance, condition, or items found together."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition"
            />
          </div>

          {/* Private Identifying Details */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Private Verification Marks (Hidden from public to verify claims)
            </label>
            <input
              type="text"
              name="identifying_details"
              value={formData.identifying_details}
              onChange={handleChange}
              placeholder="Private detail to confirm real owner (e.g. specific sticker, lockscreen image, contents)"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition"
            />
          </div>

          {/* Additional Notes / Custody */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Current Custody / Notes
            </label>
            <input
              type="text"
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              placeholder="e.g. Deposited with PSG Security Desk, or kept with Finder at Hostel Block B"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-psg-blue outline-none transition"
            />
          </div>

          {/* Item Photos */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-psg-navy mb-1.5">
              Item Photographs (Upload 1 or more photos)
            </label>
            <ImageUploader images={images} setImages={setImages} maxFiles={5} />
          </div>

        </div>

        {/* Submit Button */}
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
            className="px-8 py-3.5 rounded-xl bg-psg-navy hover:bg-slate-900 text-white border-2 border-psg-gold font-extrabold text-sm shadow-lg flex items-center gap-2 transition-all disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Upload className="w-4 h-4 text-psg-gold" />
                <span>UPLOAD FOUND ITEM</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
