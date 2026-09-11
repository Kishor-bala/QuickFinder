import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 my-auto">
        <div className="w-16 h-16 bg-brand-50 border border-brand-200 text-brand-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Search className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-brand-100 text-brand-700 text-xs font-black rounded-full uppercase tracking-wider">
            404 Error • Page Not Found
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Lost Your Way?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            The page or listing you are looking for doesn't exist, was moved, or has been removed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/"
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>RETURN HOME</span>
          </Link>
          <Link
            to="/find"
            className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-brand-500 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-brand-600" />
            <span>BROWSE ITEMS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
