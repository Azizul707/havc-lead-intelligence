'use client'

import React from 'react'
import { BellOff } from 'lucide-react'
import type { Reminder } from './types'

interface RemindersWidgetProps {
  reminders: Reminder[]
}

export const RemindersWidget = React.memo(function RemindersWidget({ reminders }: RemindersWidgetProps) {
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom shadow-sm card-hover flex flex-col">
      <div className="px-5 py-4 border-b border-border-custom">
        <h2 className="text-sm font-semibold tracking-tight text-text-primary">Follow-up Reminders</h2>
        <p className="text-xs text-text-secondary/70 mt-0.5">Chronologically sorted customer callback alerts.</p>
      </div>
      <div className="flex-1 p-5 space-y-2.5 max-h-[260px] overflow-y-auto scrollbar-thin">
        {reminders.length > 0 ? (
          reminders.map((rem) => {
            const isOverdue = rem.reminder_date < todayStr
            return (
              <div
                key={rem.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  isOverdue ? 'bg-danger-custom/[0.03] border-danger-custom/20' : 'bg-background border-border-custom'
                }`}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-xs font-medium text-text-primary truncate">{rem.message}</p>
                  <p className="text-[11px] text-text-secondary/70 mt-0.5">
                    Due: <span className="font-medium text-text-secondary">{rem.reminder_date}</span> at{' '}
                    <span className="font-medium text-text-secondary">{rem.reminder_time}</span>
                  </p>
                </div>
                {isOverdue && (
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger-custom/10 text-danger-custom">
                    OVERDUE
                  </span>
                )}
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BellOff className="h-8 w-8 text-text-muted/50 mb-2" />
            <p className="text-xs font-medium text-text-secondary/70">No pending reminders</p>
            <p className="text-[11px] text-text-muted/60 mt-0.5">New reminders will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
})

RemindersWidget.displayName = 'RemindersWidget'