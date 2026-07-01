import React from 'react'

export default function LeadsLoading() {
  return (
    <div className="space-y-6 select-none">
      <div className="pb-4 border-b border-border-custom">
        <div className="h-7 w-48 bg-border-custom/50 rounded-md animate-pulse" />
        <div className="h-4 w-64 bg-border-custom/30 rounded-md mt-2 animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="bg-surface border border-border-custom rounded-card p-4 animate-pulse">
        <div className="flex gap-3">
          <div className="flex-1 h-9 bg-border-custom/30 rounded-input" />
          <div className="h-9 w-36 bg-border-custom/30 rounded-input" />
        </div>
        <div className="flex gap-3 mt-3 pt-3 border-t border-border-custom/50">
          <div className="h-7 w-24 bg-border-custom/30 rounded-input" />
          <div className="h-7 w-28 bg-border-custom/30 rounded-input" />
          <div className="h-7 w-28 bg-border-custom/30 rounded-input" />
          <div className="h-7 w-28 bg-border-custom/30 rounded-input" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-surface rounded-card border border-border-custom shadow-sm animate-pulse">
        <div className="overflow-x-auto p-6 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="flex gap-4 py-3 border-b border-border-custom/50">
              <div className="h-4 w-32 bg-border-custom/30 rounded" />
              <div className="h-4 w-20 bg-border-custom/30 rounded" />
              <div className="h-4 w-28 bg-border-custom/30 rounded" />
              <div className="h-4 w-24 bg-border-custom/30 rounded" />
              <div className="h-4 w-24 bg-border-custom/30 rounded" />
              <div className="h-4 w-16 bg-border-custom/30 rounded" />
              <div className="h-4 w-16 bg-border-custom/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
