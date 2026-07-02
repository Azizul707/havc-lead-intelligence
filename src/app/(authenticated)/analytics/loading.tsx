import React from 'react'

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-border-custom/40 rounded-lg animate-pulse ${className}`} />
}

export default function AnalyticsLoading() {
  return (
    <div className="space-y-5 select-none">
      {/* Header skeleton */}
      <div className="pb-5 border-b border-border-custom">
        <Pulse className="h-6 w-32 mb-1.5" />
        <Pulse className="h-4 w-56" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface p-5 rounded-card border border-border-custom animate-pulse flex flex-col justify-between h-[104px]">
            <div className="flex items-center justify-between">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-8 w-8 rounded-lg" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <Pulse className="h-7 w-16" />
              <Pulse className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Trend + Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-surface rounded-card border border-border-custom animate-pulse">
          <div className="px-5 py-4 border-b border-border-custom">
            <Pulse className="h-4 w-36 mb-1" />
            <Pulse className="h-3 w-52" />
          </div>
          <div className="p-5">
            <Pulse className="h-56 w-full rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom animate-pulse">
          <div className="px-5 py-4 border-b border-border-custom">
            <Pulse className="h-4 w-36 mb-1" />
            <Pulse className="h-3 w-44" />
          </div>
          <div className="p-5 flex flex-col items-center gap-4">
            <Pulse className="h-40 w-40 rounded-full" />
            <div className="grid grid-cols-2 gap-2 w-full max-w-[160px]">
              <Pulse className="h-3 w-full" />
              <Pulse className="h-3 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly + Emergency + Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {[1, 2, 3].map(col => (
          <div key={col} className="lg:col-span-4 bg-surface rounded-card border border-border-custom animate-pulse">
            <div className="px-5 py-4 border-b border-border-custom">
              <Pulse className="h-4 w-32 mb-1" />
              <Pulse className="h-3 w-44" />
            </div>
            <div className="p-5">
              {col === 1 ? (
                <Pulse className="h-52 w-full rounded-lg" />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Pulse className="h-40 w-40 rounded-full" />
                  <div className="grid grid-cols-2 gap-2 w-full max-w-[160px]">
                    <Pulse className="h-3 w-full" />
                    <Pulse className="h-3 w-full" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="bg-surface rounded-card border border-border-custom animate-pulse">
        <div className="px-5 py-4 border-b border-border-custom">
          <Pulse className="h-4 w-36 mb-1" />
          <Pulse className="h-3 w-52" />
        </div>
        <div className="p-6 flex justify-center gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Pulse className="h-20 w-24 rounded-lg" />
              <Pulse className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Service + City */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {[1, 2].map(col => (
          <div key={col} className="lg:col-span-6 bg-surface rounded-card border border-border-custom animate-pulse">
            <div className="px-5 py-4 border-b border-border-custom">
              <Pulse className="h-4 w-40 mb-1" />
              <Pulse className="h-3 w-56" />
            </div>
            <div className="p-5">
              <Pulse className="h-56 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
