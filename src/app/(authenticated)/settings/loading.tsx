import React from 'react'

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-border-custom/40 rounded-lg animate-pulse ${className}`} />
}

export default function SettingsLoading() {
  return (
    <div className="space-y-5 select-none max-w-2xl">
      <div className="pb-5 border-b border-border-custom">
        <Pulse className="h-6 w-28 mb-1.5" />
        <Pulse className="h-4 w-52" />
      </div>

      <div className="bg-surface rounded-card border border-border-custom animate-pulse overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Pulse className="h-5 w-5 rounded" />
            <Pulse className="h-4 w-44" />
          </div>
          <Pulse className="h-3 w-96" />
          <Pulse className="h-10 w-full rounded-lg" />
        </div>
        <div className="px-6 py-5 border-t border-border-custom space-y-4">
          <div className="flex items-center gap-2.5">
            <Pulse className="h-5 w-5 rounded" />
            <Pulse className="h-4 w-44" />
          </div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center justify-between p-3.5 bg-background border border-border-custom rounded-lg">
                <div className="space-y-1.5">
                  <Pulse className="h-3.5 w-48" />
                  <Pulse className="h-3 w-36" />
                </div>
                <Pulse className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 bg-background/30 flex items-center justify-between">
          <Pulse className="h-4 w-36" />
          <Pulse className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
