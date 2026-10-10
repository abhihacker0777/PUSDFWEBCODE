import React from "react";

export default function PublicLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      {/* Search Bar Skeleton */}
      <div className="h-14 bg-white rounded-2xl shadow-sm border border-slate-200 w-full" />

      {/* Filter Tabs Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="h-10 bg-slate-200/80 rounded-lg" />
        <div className="h-10 bg-slate-200/80 rounded-lg" />
        <div className="h-10 bg-slate-200/80 rounded-lg" />
        <div className="h-10 bg-slate-200/80 rounded-lg" />
      </div>

      {/* Paper Cards Skeleton */}
      <div className="space-y-3 pt-4">
        <div className="h-16 bg-white rounded-xl shadow-xs border border-slate-200" />
        <div className="h-16 bg-white rounded-xl shadow-xs border border-slate-200" />
        <div className="h-16 bg-white rounded-xl shadow-xs border border-slate-200" />
      </div>
    </div>
  );
}
