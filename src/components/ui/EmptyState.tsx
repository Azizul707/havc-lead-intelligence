import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`bg-surface rounded-card border border-border-custom shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4 py-16 ${className}`}>
      {icon && (
        <div className="h-14 w-14 rounded-full bg-border-custom/30 flex items-center justify-center text-text-secondary">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
