import React, { useState } from 'react';
import { X, ShieldCheck, Upload, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ClaimModal({ foundItem, matchId, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a message explaining why you believe this item is yours.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('found_item_id', foundItem.id);
      if (matchId) formData.append('match_id', matchId);
      formData.append('message', message);
      if (proofImage) formData.append('proof_image', proofImage);

      await api.post('/claims', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Claim submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit claim request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Request to Claim Item</h3>
              <p className="text-xs text-slate-500">Claiming: {foundItem.item_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Why do you believe this item is yours? *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mention identifying features not in the public post, such as lock screen wallpaper, specific scratches, unique items inside, serial number, etc."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The finder will review this information before approving your claim.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Proof of Ownership / Photo (Optional)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-brand-500 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition">
                <Upload className="w-4 h-4 text-brand-600" />
                <span>Choose Photo / Bill</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {proofImage && (
                <span className="text-xs text-slate-600 font-medium truncate max-w-[200px]">
                  {proofImage.name}
                </span>
              )}
            </div>
            {previewUrl && (
              <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                <img src={previewUrl} alt="Proof preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Submitting Request...' : 'Submit Claim Request'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
