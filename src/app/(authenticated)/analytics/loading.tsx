import React from 'react'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 select-none">
      <div>
        <div className="h-7 w-64 bg-border-custom/50 rounded-md animate-pulse" />
        <div className="h-4 w-80 bg-border-custom/30 rounded-md mt-2 animate-pulse" />
      </div>

      {/* KPI Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface p-6 rounded-card border border-border-custom shadow-sm h-32 animate-pulse">
            <div className="h-3 w-20 bg-border-custom/50 rounded" />
            <div className="h-8 w-16 bg-border-custom/30 rounded mt-4" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-surface p-6 rounded-card border border-border-custom shadow-sm h-80 animate-pulse">
          <div className="h-4 w-40 bg-border-custom/50 rounded mb-6" />
          <div className="h-64 bg-border-custom/20 rounded" />
        </div>
        <div className="lg:col-span-4 bg-surface p-6 rounded-card border border-border-custom shadow-sm h-80 animate-pulse">
          <div className="h-4 w-32 bg-border-custom/50 rounded mb-6" />
          <div className="h-44 bg-border-custom/20 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bg-surface p-6 rounded-card border border-border-custom shadow-sm h-40 animate-pulse">
          <div className="h-4 w-36 bg-border-custom/50 rounded mb-6" />
          <div className="flex gap-4 justify-center">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 w-20 bg-border-custom/20 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
