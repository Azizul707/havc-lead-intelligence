import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const padClass = padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6'
  return (
    <div className={`bg-surface rounded-card border border-border-custom shadow-sm ${padClass} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`pb-4 border-b border-border-custom mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-base font-bold tracking-tight text-text-primary ${className}`}>{children}</h2>
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs text-text-secondary mt-0.5 ${className}`}>{children}</p>
}
