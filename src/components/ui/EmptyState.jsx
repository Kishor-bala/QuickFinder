import React from 'react';
import { PackageOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'Try adjusting your search criteria or report a new item.',
  action = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

export default EmptyState;
