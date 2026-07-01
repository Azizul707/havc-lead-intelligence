import React from 'react'

export default function ProfileLoading() {
  return (
    <div className="space-y-6 select-none">
      <div className="pb-4 border-b border-border-custom">
        <div className="h-7 w-36 bg-border-custom/50 rounded-md animate-pulse" />
        <div className="h-4 w-56 bg-border-custom/30 rounded-md mt-2 animate-pulse" />
      </div>

      <div className="max-w-xl space-y-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-3 w-24 bg-border-custom/50 rounded mb-2" />
            <div className="h-9 w-full bg-border-custom/30 rounded-input" />
          </div>
        ))}
        <div className="h-9 w-32 bg-border-custom/30 rounded-button animate-pulse" />
      </div>
    </div>
  )
}
