import React from 'react'

export default function CRMLoading() {
  return (
    <div className="space-y-6 select-none">
      <div className="pb-4 border-b border-border-custom">
        <div className="h-7 w-52 bg-border-custom/50 rounded-md animate-pulse" />
        <div className="h-4 w-72 bg-border-custom/30 rounded-md mt-2 animate-pulse" />
      </div>

      {/* Filter bar */}
      <div className="bg-surface border border-border-custom rounded-card p-4 animate-pulse">
        <div className="flex gap-3">
          <div className="flex-1 h-9 bg-border-custom/30 rounded-input" />
          <div className="h-9 w-36 bg-border-custom/30 rounded-input" />
        </div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="grid grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map(col => (
          <div key={col} className="bg-surface rounded-card border border-border-custom p-4 min-h-[400px] animate-pulse">
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-border-custom">
              <div className="h-4 w-20 bg-border-custom/50 rounded" />
              <div className="h-5 w-6 bg-border-custom/30 rounded-full" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(card => (
                <div key={card} className="bg-background border border-border-custom p-4 rounded-card">
                  <div className="h-4 w-3/4 bg-border-custom/30 rounded mb-3" />
                  <div className="h-3 w-1/2 bg-border-custom/20 rounded mb-2" />
                  <div className="h-3 w-1/3 bg-border-custom/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
