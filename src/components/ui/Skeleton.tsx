import React from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-border-custom/40 rounded animate-pulse ${className}`} />
}

export function CardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-surface rounded-card border border-border-custom shadow-sm p-6 animate-pulse ${className}`}>
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/4" />
    </div>
  )
}

export function KPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface p-6 rounded-card border border-border-custom shadow-sm h-32 animate-pulse">
          <Skeleton className="h-3 w-20 mb-4" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 'h-80' }: { height?: string }) {
  return (
    <div className={`bg-surface p-6 rounded-card border border-border-custom shadow-sm ${height} animate-pulse`}>
      <Skeleton className="h-4 w-1/4 mb-6" />
      <Skeleton className="h-3/4 w-full" />
    </div>
  )
}
