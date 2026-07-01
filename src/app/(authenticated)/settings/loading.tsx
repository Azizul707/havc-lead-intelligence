import React from 'react'

export default function SettingsLoading() {
  return (
    <div className="space-y-6 select-none">
      <div className="pb-4 border-b border-border-custom">
        <div className="h-7 w-40 bg-border-custom/50 rounded-md animate-pulse" />
        <div className="h-4 w-60 bg-border-custom/30 rounded-md mt-2 animate-pulse" />
      </div>

      <div className="space-y-8 max-w-xl">
        {/* Profile section */}
        <div className="bg-surface rounded-card border border-border-custom p-6 space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-border-custom/50 rounded mb-4" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i}>
              <div className="h-3 w-24 bg-border-custom/50 rounded mb-2" />
              <div className="h-9 w-full bg-border-custom/30 rounded-input" />
            </div>
          ))}
        </div>

        {/* Password section */}
        <div className="bg-surface rounded-card border border-border-custom p-6 space-y-4 animate-pulse">
          <div className="h-4 w-40 bg-border-custom/50 rounded mb-4" />
          <div className="h-9 w-full bg-border-custom/30 rounded-input" />
          <div className="h-9 w-40 bg-border-custom/30 rounded-button" />
        </div>
      </div>
    </div>
  )
}
