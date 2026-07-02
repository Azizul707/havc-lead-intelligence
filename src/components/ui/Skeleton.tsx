import React from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-border-custom/40 rounded-lg animate-pulse ${className}`} />
}

export function CardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-surface rounded-card border border-border-custom p-6 animate-pulse ${className}`}>
      <Skeleton className="h-3 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/4" />
    </div>
  )
}

export function KPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface p-5 rounded-card border border-border-custom h-[104px] animate-pulse flex flex-col justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 'h-80' }: { height?: string }) {
  return (
    <div className={`bg-surface p-6 rounded-card border border-border-custom ${height} animate-pulse`}>
      <Skeleton className="h-4 w-1/4 mb-6" />
      <Skeleton className="h-3/4 w-full rounded-lg" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface rounded-card border border-border-custom animate-pulse overflow-hidden">
      <div className="px-6 py-4 border-b border-border-custom">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-border-custom/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
