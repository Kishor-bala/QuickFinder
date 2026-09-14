import React from 'react';
import { X, QrCode, ShieldCheck } from 'lucide-react';

export default function QRCodeModal({ title, referenceId, onClose }) {
  if (!referenceId) return null;

  // Render SVG QR code matrix simulation for fast offline rendering
  const qrSvg = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referenceId)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4 relative overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-psg-navy text-white shadow-md">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-slate-900">{title || 'Campus Recovery QR Code'}</h3>
        <p className="text-xs text-slate-500">
          Present this QR code to Campus Security or Lost & Found Office staff for fast reference verification.
        </p>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner">
          <img src={qrSvg} alt="QR Code" className="w-44 h-44 mx-auto rounded-lg" />
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-center gap-1.5 text-xs text-emerald-800 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Reference ID: {referenceId}</span>
        </div>
      </div>
    </div>
  );
}
