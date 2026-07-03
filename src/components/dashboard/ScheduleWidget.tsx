'use client'

import React from 'react'
import { Calendar } from 'lucide-react'
import type { Appointment, Lead } from './types'

interface ScheduleWidgetProps {
  appointments: Appointment[]
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return 'bg-danger-custom/10 text-danger-custom border-danger-custom/20'
    case 'HIGH': return 'bg-warning-custom/10 text-warning-custom border-warning-custom/20'
    case 'MEDIUM': return 'bg-primary-custom/10 text-primary-custom border-primary-custom/20'
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
  }
}

export const ScheduleWidget = React.memo(function ScheduleWidget({ appointments, leads, onLeadClick }: ScheduleWidgetProps) {
  return (
    <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom shadow-sm card-hover flex flex-col">
      <div className="px-5 py-4 border-b border-border-custom">
        <h2 className="text-sm font-semibold tracking-tight text-text-primary">Today&apos;s Schedule</h2>
        <p className="text-xs text-text-secondary/70 mt-0.5">Technician site visits planned for today.</p>
      </div>
      <div className="flex-1 p-5 space-y-2.5 max-h-[260px] overflow-y-auto scrollbar-thin">
        {appointments.length > 0 ? (
          appointments.map((appt) => {
            const lead = leads.find((l: Lead) => l.id === appt.lead_id)
            if (!lead) return null
            return (
              <div
                key={appt.id}
                onClick={() => onLeadClick(lead)}
                className="flex items-center justify-between p-3 bg-background border border-border-custom rounded-lg hover:border-primary-custom/40 hover:bg-background/80 cursor-pointer transition-all duration-150"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-xs font-medium text-text-primary truncate">{lead.customer_name}</p>
                  <p className="text-[11px] text-text-secondary/70 mt-0.5 truncate">{lead.service_type}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-text-secondary/80">{appt.appointment_time}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border leading-none ${getPriorityClass(lead.priority)}`}>
                    {lead.priority}
                  </span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Calendar className="h-8 w-8 text-text-muted/50 mb-2" />
            <p className="text-xs font-medium text-text-secondary/70">No appointments scheduled</p>
            <p className="text-[11px] text-text-muted/60 mt-0.5">New appointments will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
})

ScheduleWidget.displayName = 'ScheduleWidget'
