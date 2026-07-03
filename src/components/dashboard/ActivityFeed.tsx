'use client'

import React from 'react'
import {
  Clock3, Sparkles, PlusCircle, Activity,
  Eye, UserCheck, FileText, Mail,
  CalendarCheck, CheckCircle2, ThumbsDown,
} from 'lucide-react'
import { formatRelativeTime } from '../../lib/utils/time'
import type { LeadEvent } from './types'

interface ActivityFeedProps {
  events: LeadEvent[]
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'LEAD_CREATED':
    case 'LEAD_RECEIVED': return <PlusCircle className="h-4 w-4 text-primary-custom" />
    case 'LEAD_VIEWED': return <Eye className="h-4 w-4 text-info-custom" />
    case 'AI_ANALYZED': return <Sparkles className="h-4 w-4 text-success-custom" />
    case 'FIRST_RESPONSE': return <UserCheck className="h-4 w-4 text-success-custom" />
    case 'STATUS_CHANGED': return <Activity className="h-4 w-4 text-warning-custom" />
    case 'EMAIL_SENT': return <Mail className="h-4 w-4 text-info-custom" />
    case 'NOTE_ADDED': return <FileText className="h-4 w-4 text-primary-custom" />
    case 'APPOINTMENT_CREATED': return <CalendarCheck className="h-4 w-4 text-info-custom" />
    case 'APPOINTMENT_COMPLETED':
    case 'LEAD_COMPLETED': return <CheckCircle2 className="h-4 w-4 text-success-custom" />
    case 'LEAD_LOST': return <ThumbsDown className="h-4 w-4 text-danger-custom" />
    default: return <Clock3 className="h-4 w-4 text-text-secondary" />
  }
}

export const ActivityFeed = React.memo(function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom shadow-sm card-hover flex flex-col">
      <div className="px-5 py-4 border-b border-border-custom">
        <h2 className="text-sm font-semibold tracking-tight text-text-primary">Activity Feed</h2>
        <p className="text-xs text-text-secondary/70 mt-0.5">Real-time audit log of lead events.</p>
      </div>
      <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-400px scrollbar-thin">
        {events.length > 0 ? (
          events.map((evt) => (
            <div key={evt.id} className="flex items-start gap-3">
              <div className="p-1.5 bg-background rounded-lg border border-border-custom/60 shrink-0 mt-0.5">
                {getEventIcon(evt.event_type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-text-secondary/90 leading-relaxed">{evt.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-medium text-text-muted">{evt.hvac_leads?.customer_name || 'System'}</span>
                  <span className="text-[11px] text-text-muted/70">{formatRelativeTime(evt.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Activity className="h-8 w-8 text-text-muted/50 mb-2" />
            <p className="text-xs font-medium text-text-secondary/70">No recent activity</p>
            <p className="text-[11px] text-text-muted/60 mt-0.5">Events will appear here in real time.</p>
          </div>
        )}
      </div>
    </div>
  )
})

ActivityFeed.displayName = 'ActivityFeed'
