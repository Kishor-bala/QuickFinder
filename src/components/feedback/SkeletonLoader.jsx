import React from 'react';

export function SkeletonLoader({ className = '', count = 1 }) {
  const skeletons = Array.from({ length: count });
  return (
    <>
      {skeletons.map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
        />
      ))}
    </>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm animate-pulse">
      <div className="w-full h-44 bg-slate-200 rounded-xl" />
      <div className="space-y-2">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </div>
      <div className="flex justify-between pt-2">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export default SkeletonLoader;
