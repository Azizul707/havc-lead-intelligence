import React from 'react'

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-border-custom/40 rounded-lg animate-pulse ${className}`} />
}

export default function ProfileLoading() {
  return (
    <div className="space-y-5 select-none max-w-2xl">
      <div className="pb-5 border-b border-border-custom">
        <Pulse className="h-6 w-28 mb-1.5" />
        <Pulse className="h-4 w-52" />
      </div>

      <div className="bg-surface rounded-card border border-border-custom animate-pulse">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2].map(i => (
              <div key={i}>
                <Pulse className="h-3 w-20 mb-1.5" />
                <Pulse className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2].map(i => (
              <div key={i}>
                <Pulse className="h-3 w-20 mb-1.5" />
                <Pulse className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2].map(i => (
              <div key={i}>
                <Pulse className="h-3 w-20 mb-1.5" />
                <Pulse className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 bg-background/30 border-t border-border-custom flex items-center justify-between">
          <Pulse className="h-4 w-40" />
          <Pulse className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
