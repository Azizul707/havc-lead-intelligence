import React from 'react'

export default function DashboardLoading() {
  return (
    <div className="space-y-8 select-none">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-border-custom">
        <div>
          <div className="h-7 w-64 bg-border-custom/50 rounded-md animate-pulse" />
          <div className="h-4 w-80 bg-border-custom/30 rounded-md mt-2 animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-28 bg-border-custom/30 rounded-input animate-pulse" />
          <div className="h-9 w-28 bg-border-custom/30 rounded-input animate-pulse" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface p-6 rounded-card border border-border-custom shadow-sm h-36 animate-pulse">
            <div className="h-3 w-24 bg-border-custom/50 rounded" />
            <div className="h-8 w-20 bg-border-custom/30 rounded mt-4" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-surface p-6 rounded-card border border-border-custom shadow-sm h-90 animate-pulse">
          <div className="h-4 w-40 bg-border-custom/50 rounded mb-6" />
          <div className="h-64 bg-border-custom/20 rounded" />
        </div>
        <div className="lg:col-span-4 bg-surface p-6 rounded-card border border-border-custom shadow-sm h-90 animate-pulse">
          <div className="h-4 w-32 bg-border-custom/50 rounded mb-6" />
          <div className="h-44 bg-border-custom/20 rounded" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-surface rounded-card border border-border-custom shadow-sm animate-pulse">
        <div className="px-6 py-5 border-b border-border-custom">
          <div className="h-4 w-40 bg-border-custom/50 rounded" />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-1/5 bg-border-custom/30 rounded" />
              <div className="h-4 w-1/6 bg-border-custom/30 rounded" />
              <div className="h-4 w-1/6 bg-border-custom/30 rounded" />
              <div className="h-4 w-1/6 bg-border-custom/30 rounded" />
              <div className="h-4 w-1/6 bg-border-custom/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
