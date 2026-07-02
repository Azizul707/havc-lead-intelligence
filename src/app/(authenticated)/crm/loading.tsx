import React from 'react'

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-border-custom/40 rounded-lg animate-pulse ${className}`} />
}

export default function CRMLoading() {
  return (
    <div className="space-y-5 select-none">
      {/* Header skeleton */}
      <div className="pb-5 border-b border-border-custom">
        <Pulse className="h-6 w-32 mb-1.5" />
        <Pulse className="h-4 w-56" />
      </div>

      {/* Filter bar skeleton */}
      <div className="bg-surface border border-border-custom rounded-card">
        <div className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Pulse className="flex-1 h-10 rounded-lg" />
            <Pulse className="h-10 w-36 rounded-lg" />
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border-custom/50">
            <Pulse className="h-4 w-12" />
            <Pulse className="h-8 w-28 rounded-lg" />
            <Pulse className="h-8 w-28 rounded-lg" />
            <Pulse className="h-8 w-28 rounded-lg" />
            <Pulse className="h-8 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(col => (
          <div key={col} className="bg-surface rounded-card border border-border-custom min-h-[450px] animate-pulse">
            <div className="px-4 py-3 border-b border-border-custom flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Pulse className="h-2.5 w-2.5 rounded-full" />
                <Pulse className="h-4 w-20" />
              </div>
              <Pulse className="h-[22px] w-[22px] rounded-full" />
            </div>
            <div className="p-3 space-y-3">
              {[1, 2, 3].map(card => (
                <div key={card} className="bg-background border border-border-custom rounded-card p-3.5">
                  <div className="flex justify-between items-start mb-2.5">
                    <Pulse className="h-4 w-28" />
                    <Pulse className="h-5 w-12 rounded-md" />
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <Pulse className="h-3 w-32" />
                    <Pulse className="h-3 w-24" />
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-border-custom/60">
                    <Pulse className="h-4 w-14 rounded-full" />
                    <div className="flex gap-2">
                      <Pulse className="h-3 w-12" />
                      <Pulse className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
