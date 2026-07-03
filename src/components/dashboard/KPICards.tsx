'use client'

import React from 'react'
import { Calendar, Bell, AlertCircle, Wrench } from 'lucide-react'
import type { KPIMetric } from './types'

type CardVariant = 'primary' | 'warning' | 'danger' | 'success'

const variantClasses: Record<CardVariant, { iconBg: string; iconText: string }> = {
  primary: { iconBg: 'bg-primary-custom/8', iconText: 'text-primary-custom' },
  warning: { iconBg: 'bg-warning-custom/8', iconText: 'text-warning-custom' },
  danger:  { iconBg: 'bg-danger-custom/8',  iconText: 'text-danger-custom' },
  success: { iconBg: 'bg-success-custom/8', iconText: 'text-success-custom' },
}

const CARDS: Array<{
  label: string
  sub: string
  icon: React.ComponentType<{ className: string }>
  variant: CardVariant
  key: keyof KPIMetric
}> = [
  { label: 'Appointments Today', sub: 'visits',     icon: Calendar,  variant: 'primary', key: 'todayApps' },
  { label: 'Pending Follow-ups', sub: 'reminders',  icon: Bell,      variant: 'warning', key: 'pendingReminders' },
  { label: 'Overdue Alerts',     sub: 'overdue',    icon: AlertCircle, variant: 'danger', key: 'overdueReminders' },
  { label: 'Scheduled Jobs',     sub: 'active',     icon: Wrench,    variant: 'success', key: 'scheduledJobs' },
]

interface KPICardsProps {
  metrics: KPIMetric
}

export const KPICards = React.memo(function KPICards({ metrics }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {CARDS.map((cfg) => {
        const value = metrics[cfg.key]
        const classes = variantClasses[cfg.variant]
        const Icon = cfg.icon
        const isOverdue = cfg.key === 'overdueReminders' && value > 0

        return (
          <div key={cfg.key} className="bg-surface p-5 rounded-card border border-border-custom shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-text-secondary/80 tracking-wide uppercase">{cfg.label}</span>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${classes.iconBg}`}>
                <Icon className={`h-4 w-4 ${classes.iconText}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tracking-tight ${isOverdue ? 'text-danger-custom' : 'text-text-primary'}`}>{value}</span>
              <span className="text-xs font-medium text-text-secondary/70">{cfg.sub}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
})

KPICards.displayName = 'KPICards'
