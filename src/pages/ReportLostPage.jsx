import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, AlertCircle, Sparkles, ArrowLeft, ShieldCheck, Lock, Wand2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageUploader from '../components/ImageUploader';
import MatchModal from '../components/MatchModal';

export default function ReportLostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Mobile',
    brand: '',
    model: '',
    colour: '',
    building: 'Main Block',
    lost_date: new Date().toLocaleDateString('en-CA'),
    lost_time: '',
    lost_location: '',
    description: '',
    // Private verification data (Hidden from public)
    serial_number: '',
    private_identifying_details: '',
    contact_number: user?.phone || '',
    contact_email: user?.email || '',
  });

  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchPopupData, setMatchPopupData] = useState(null);

  const categories = [
    'Mobile', 'Laptop', 'Wallet', 'ID Card', 'Keys', 'Bag', 'Books & Stationery', 'Electronics', 'Accessories', 'Water Bottles & Containers', 'Other'
  ];

  const campusBuildings = [
    'Main Block', 'CSE Block', 'ECE Block', 'Mech Block', 'Library', 'Canteen', 'Hostel Block', 'Sports Ground', 'Auditorium', 'Parking Area'
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
        lost_location: ext.location || prev.lost_location,
        building: ext.building || prev.building,
        description: aiText
      }));
    } catch {
      // Fallback local extraction
      setFormData(prev => ({ ...prev, description: aiText }));
    } finally {
      setAiLoading(false);
    }
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
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-psg-navy hover:text-psg-blue transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-psg-navy to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> Campus Lost Report System
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Report a Lost Item</h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Provide details below. Our 8-signal matching engine will automatically scan all found reports across campus to locate your item.
          </p>
        </div>
      </div>

      {/* AI Quick Report Assistant */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
          <Wand2 className="w-5 h-5 text-amber-600" />
          <span>AI Quick-Report Assistant</span>
        </div>
        <p className="text-xs text-amber-800">
          Paste a quick sentence (e.g. <em>"Lost black Milton water bottle near CSE lab yesterday"</em>) and AI will auto-fill your report fields!
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="e.g. Lost black Dell laptop in Library 2nd floor"
            className="flex-1 px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAiExtract}
            disabled={aiLoading || !aiText}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Section 1: Public Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
            <PlusCircle className="w-5 h-5 text-brand-600" />
            Public Item Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Item Title *</label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                placeholder="e.g. Black Milton Bottle"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Manufacturer</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Dell, Apple, Milton"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model / Color</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Model"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus Building *</label>
              <select
                name="building"
                value={formData.building}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              >
                {campusBuildings.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Approximate Location Details *</label>
              <input
                type="text"
                name="lost_location"
                value={formData.lost_location}
                onChange={handleChange}
                placeholder="e.g. 2nd floor lab near room 204"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date Lost *</label>
              <input
                type="date"
                name="lost_date"
                value={formData.lost_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Lost (Approx)</label>
              <input
                type="text"
                name="lost_time"
                value={formData.lost_time}
                onChange={handleChange}
                placeholder="e.g. 2:30 PM"
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
              placeholder="Describe general appearance, visible stickers, or broad features..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
            />
          </div>
        </div>

        {/* Section 2: Private Verification Information (SECURITY PROTECTED) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Private Verification Details (Hidden from Public)</span>
          </div>
          <p className="text-xs text-slate-500">
            This private information (serial number, hidden damage, unique sticker) is strictly confidential. It is used to verify ownership during claims and will NEVER be publicly displayed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number / IMEI (Private)</label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                placeholder="Private serial or unique ID"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Secret Damage / Contents (Private)</label>
              <input
                type="text"
                name="private_identifying_details"
                value={formData.private_identifying_details}
                onChange={handleChange}
                placeholder="e.g. Small scratch on bottom, key inside pocket"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Item Images (Optional)</label>
          <ImageUploader images={images} setImages={setImages} maxImages={4} />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>{loading ? 'ANALYZING & SUBMITTING...' : 'SUBMIT LOST REPORT'}</span>
        </button>
      </form>

      {/* Match Popup */}
      {matchPopupData && (
        <MatchModal
          match={matchPopupData}
          onClose={() => {
            setMatchPopupData(null);
            navigate('/my-items');
          }}
        />
      )}
    </div>
  );
}
