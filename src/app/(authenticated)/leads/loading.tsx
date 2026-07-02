import React from 'react'

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-border-custom/40 rounded-lg animate-pulse ${className}`} />
}

export default function LeadsLoading() {
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
            <Pulse className="h-8 w-28 rounded-lg ml-auto" />
          </div>
        </div>
      </div>

      {/* Results info */}
      <Pulse className="h-4 w-48" />

      {/* Table skeleton */}
      <div className="bg-surface rounded-card border border-border-custom shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="border-b border-border-custom bg-background/40 px-5 py-3 flex items-center gap-4">
          <Pulse className="h-3.5 w-3.5 rounded" />
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-14" />
          <Pulse className="h-3 w-28" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-10" />
          <Pulse className="h-3 w-14" />
        </div>
        <div className="divide-y divide-border-custom/60">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <Pulse className="h-3.5 w-3.5 rounded" />
              <Pulse className="h-3.5 w-28" />
              <Pulse className="h-5 w-16 rounded-md" />
              <Pulse className="h-3.5 w-28" />
              <Pulse className="h-3.5 w-20" />
              <Pulse className="h-3.5 w-20" />
              <Pulse className="h-5 w-14 rounded-full" />
              <Pulse className="h-3.5 w-8" />
              <Pulse className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
        {/* Pagination skeleton */}
        <div className="px-5 py-3 border-t border-border-custom bg-background/30 flex items-center justify-between">
          <Pulse className="h-8 w-24 rounded-lg" />
          <div className="flex items-center gap-1">
            <Pulse className="h-8 w-8 rounded-lg" />
            <Pulse className="h-8 w-8 rounded-lg" />
            <Pulse className="h-8 w-8 rounded-lg" />
            <Pulse className="h-8 w-8 rounded-lg" />
            <Pulse className="h-8 w-8 rounded-lg" />
          </div>
          <Pulse className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
