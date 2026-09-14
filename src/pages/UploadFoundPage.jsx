import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, CheckCircle2, Sparkles, AlertCircle, ArrowLeft, Shield, Lock, Wand2 } from 'lucide-react';
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
    building: 'Main Block',
    found_date: new Date().toLocaleDateString('en-CA'),
    found_time: '',
    found_location: '',
    description: '',
    handoverOption: 'I currently have the item',
    currentLocation: 'Main Administrative Block',
    private_identifying_details: '',
    contact_number: user?.phone || '',
    contact_email: user?.email || '',
  });

  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const categories = [
    'Mobile', 'Laptop', 'Wallet', 'ID Card', 'Keys', 'Bag', 'Books & Stationery', 'Electronics', 'Accessories', 'Water Bottles & Containers', 'Other'
  ];

  const campusBuildings = [
    'Main Block', 'CSE Block', 'ECE Block', 'Mech Block', 'Library', 'Canteen', 'Hostel Block', 'Sports Ground', 'Auditorium', 'Parking Area'
  ];

  const handoverOptions = [
    'I currently have the item',
    'Handed to Campus Security (Main Gate)',
    'Deposited at CSE Department Office',
    'Deposited at Central Lost & Found Office',
    'Deposited at Hostel Office'
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleAiExtract = async () => {
    if (!aiText) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/extract', { text: aiText });
      const ext = res.data.extracted || {};
      setFormData(prev => ({
        ...prev,
        category: ext.category || prev.category,
        colour: ext.color || prev.colour,
        brand: ext.brand || prev.brand,
        found_location: ext.location || prev.found_location,
        building: ext.building || prev.building,
        description: aiText
      }));
    } catch {
      setFormData(prev => ({ ...prev, description: aiText }));
    } finally {
      setAiLoading(false);
    }
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
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-lg">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Found Item Published!</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Thank you for helping keep campus trustworthy! Your report is now live and candidate owners will be auto-notified.
        </p>

        {successData.matchesFound > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-sm font-bold inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600 animate-bounce" />
            <span>🎉 Discovered {successData.matchesFound} potential lost report matches!</span>
          </div>
        )}

        <div className="flex justify-center gap-4 pt-4">
          <Link to="/my-items" className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition">
            View My Reports
          </Link>
          <Link to="/find" className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition">
            Browse All Items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-psg-navy hover:text-psg-blue transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold backdrop-blur-md">
            <Shield className="w-4 h-4" /> Campus Found Item Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Report a Found Item</h1>
          <p className="text-emerald-100 text-sm max-w-xl">
            Help reconnect items with their rightful owners. You can keep the item safe or hand it over to an authorized campus office.
          </p>
        </div>
      </div>

      {/* AI Quick Assistant */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
          <Wand2 className="w-5 h-5 text-emerald-600" />
          <span>AI Quick-Report Assistant</span>
        </div>
        <p className="text-xs text-emerald-800">
          Paste a quick sentence (e.g. <em>"Found black Casio watch at canteen table 4"</em>) and AI will auto-fill your report fields!
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="e.g. Found silver keys near Library ground floor"
            className="flex-1 px-4 py-2.5 rounded-xl border border-emerald-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAiExtract}
            disabled={aiLoading || !aiText}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {aiLoading ? 'Extracting...' : 'Auto-Fill'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Section 1: Public Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            Public Found Item Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Item Title *</label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                placeholder="e.g. Found Casio Watch"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Color</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Brand"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
                />
                <input
                  type="text"
                  name="colour"
                  value={formData.colour}
                  onChange={handleChange}
                  placeholder="Color"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Handover Status *</label>
              <select
                name="handoverOption"
                value={formData.handoverOption}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                {handoverOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus Building *</label>
              <select
                name="building"
                value={formData.building}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                {campusBuildings.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Exact Found Location *</label>
              <input
                type="text"
                name="found_location"
                value={formData.found_location}
                onChange={handleChange}
                placeholder="e.g. Canteen table 4"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date Found *</label>
              <input
                type="date"
                name="found_date"
                value={formData.found_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Found</label>
              <input
                type="text"
                name="found_time"
                value={formData.found_time}
                onChange={handleChange}
                placeholder="e.g. 11:15 AM"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Public Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Broad description of the found item..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
            />
          </div>
        </div>

        {/* Section 2: Private Identifying Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Private Verification Notes (Hidden from Public)</span>
          </div>
          <p className="text-xs text-slate-500">
            Note any secret identifying marks (e.g., sticker inside cover, damage, contents) to evaluate claimant ownership requests.
          </p>
          <input
            type="text"
            name="private_identifying_details"
            value={formData.private_identifying_details}
            onChange={handleChange}
            placeholder="e.g. Small scratch near charger port, keychain attached"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none"
          />
        </div>

        {/* Section 3: Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Item Photographs</label>
          <ImageUploader images={images} setImages={setImages} maxImages={4} />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Shield className="w-5 h-5" />
          <span>{loading ? 'PUBLISHING REPORT...' : 'PUBLISH FOUND ITEM REPORT'}</span>
        </button>
      </form>
    </div>
  );
}
