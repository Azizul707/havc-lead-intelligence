import React from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  size?: 'sm' | 'md'
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20',
  primary: 'bg-primary-custom/10 text-primary-custom border-primary-custom/20',
  success: 'bg-success-custom/10 text-success-custom border-success-custom/20',
  warning: 'bg-warning-custom/10 text-warning-custom border-warning-custom/20',
  danger: 'bg-danger-custom/10 text-danger-custom border-danger-custom/20',
  info: 'bg-info-custom/10 text-info-custom border-info-custom/20',
}

export function Badge({ children, variant = 'default', className = '', size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-block rounded-full font-bold border ${sizeClass} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, BadgeVariant> = {
    NEW: 'primary',
    CONTACTED: 'warning',
    SCHEDULED: 'info',
    COMPLETED: 'success',
    LOST: 'default',
  }
  const variant = statusStyles[status] || 'default'
  return <Badge variant={variant}>{status}</Badge>
}

export function PriorityBadge({ priority, className = '' }: { priority: string; className?: string }) {
  const priorityStyles: Record<string, BadgeVariant> = {
    LOW: 'default',
    MEDIUM: 'primary',
    HIGH: 'warning',
    CRITICAL: 'danger',
  }
  const variant = priorityStyles[priority] || 'default'
  return <Badge variant={variant} className={className}>{priority}</Badge>
}
