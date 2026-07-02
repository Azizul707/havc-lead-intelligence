import React from 'react'

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-border-custom/40 rounded-lg animate-pulse ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div className="space-y-5 select-none">
      {/* Header skeleton */}
      <div className="flex items-start justify-between pb-5 border-b border-border-custom">
        <div>
          <Pulse className="h-6 w-40 mb-2" />
          <Pulse className="h-4 w-64" />
        </div>
        <div className="flex gap-2.5">
          <Pulse className="h-8 w-24 rounded-lg" />
          <Pulse className="h-8 w-24 rounded-lg" />
          <Pulse className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface p-5 rounded-card border border-border-custom animate-pulse flex flex-col justify-between h-[104px]">
            <div className="flex items-center justify-between">
              <Pulse className="h-3 w-28" />
              <Pulse className="h-8 w-8 rounded-lg" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <Pulse className="h-7 w-12" />
              <Pulse className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Schedule & Reminders row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom animate-pulse">
          <div className="px-5 py-4 border-b border-border-custom">
            <Pulse className="h-4 w-40 mb-1" />
            <Pulse className="h-3 w-60" />
          </div>
          <div className="p-5 space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-background border border-border-custom rounded-lg">
                <div className="space-y-1">
                  <Pulse className="h-3 w-32" />
                  <Pulse className="h-2.5 w-20" />
                </div>
                <Pulse className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom animate-pulse">
          <div className="px-5 py-4 border-b border-border-custom">
            <Pulse className="h-4 w-40 mb-1" />
            <Pulse className="h-3 w-60" />
          </div>
          <div className="p-5 space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-background border border-border-custom rounded-lg">
                <div className="space-y-1">
                  <Pulse className="h-3 w-40" />
                  <Pulse className="h-2.5 w-36" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-surface rounded-card border border-border-custom animate-pulse">
          <div className="px-5 py-4 border-b border-border-custom">
            <Pulse className="h-4 w-32 mb-1" />
            <Pulse className="h-3 w-52" />
          </div>
          <div className="p-5">
            <Pulse className="h-60 w-full rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom animate-pulse">
          <div className="px-5 py-4 border-b border-border-custom">
            <Pulse className="h-4 w-36 mb-1" />
            <Pulse className="h-3 w-44" />
          </div>
          <div className="p-5 flex flex-col items-center gap-4">
            <Pulse className="h-40 w-40 rounded-full" />
            <div className="grid grid-cols-2 gap-3 w-full max-w-[180px]">
              <Pulse className="h-3 w-full" />
              <Pulse className="h-3 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-surface rounded-card border border-border-custom overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-border-custom">
          <Pulse className="h-4 w-32 mb-1" />
          <Pulse className="h-3 w-52" />
        </div>
        <div>
          <div className="px-5 py-3 bg-background/40 border-b border-border-custom flex gap-4">
            <Pulse className="h-3 w-24" />
            <Pulse className="h-3 w-16" />
            <Pulse className="h-3 w-16" />
            <Pulse className="h-3 w-20" />
            <Pulse className="h-3 w-16" />
            <Pulse className="h-3 w-12" />
            <Pulse className="h-3 w-10" />
          </div>
          <div className="divide-y divide-border-custom/60">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <Pulse className="h-3.5 w-28" />
                <Pulse className="h-3 w-12" />
                <Pulse className="h-3 w-16" />
                <Pulse className="h-3 w-20" />
                <Pulse className="h-5 w-14 rounded-full" />
                <Pulse className="h-3 w-8" />
                <Pulse className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
