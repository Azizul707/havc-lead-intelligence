/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Clock3,
  Sparkles,
  Globe,
  PlusCircle,
  Activity,
  BellOff,
  Inbox,
  Mail,
  Eye,
  UserCheck,
  FileText,
  CalendarCheck,
  CheckCircle2,
  ThumbsDown
} from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import { formatRelativeTime } from '../../lib/utils/time'
import LeadDetailsDrawer from './LeadDetailsDrawer'

// Feature 3 & 15: Lazily import charts with layout-stable skeleton fallbacks to prevent CLS
const DashboardCharts = dynamic(() => import('./DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
      <div className="lg:col-span-8 h-90 bg-surface border border-border-custom rounded-card animate-pulse flex items-center justify-center text-xs text-text-secondary font-semibold">
        Loading historical lead trend...
      </div>
      <div className="lg:col-span-4 h-90 bg-surface border border-border-custom rounded-card animate-pulse flex items-center justify-center text-xs text-text-secondary font-semibold">
        Loading priority breakdown...
      </div>
    </div>
  )
})

interface Lead {
  id: string
  created_at: string
  customer_name: string
  phone: string
  email: string | null
  city: string
  service_type: string
  property_type: string
  issue_description: string
  lead_quality: 'LOW' | 'MEDIUM' | 'HIGH'
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'
  estimated_job_value: 'LOW' | 'MEDIUM' | 'HIGH'
  customer_intent: 'UNKNOWN' | 'SHOPPING' | 'READY_TO_BUY'
  recommended_response_time: string
  service_category: string
  summary: string
  recommended_action: string
  lead_score: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'LOST'
  source: string
}

interface LeadEvent {
  id: string
  lead_id: string
  event_type: string
  description: string
  created_at: string
  hvac_leads?: { customer_name: string }
}

interface Appointment {
  id: string
  lead_id: string
  appointment_date: string
  appointment_time: string
  appointment_type: string
  status: string
  notes: string | null
}

interface Reminder {
  id: string
  lead_id: string
  reminder_date: string
  reminder_time: string
  priority: string
  message: string
  status: string
}

interface DashboardClientProps {
  initialLeads: Lead[]
  initialEvents: LeadEvent[]
  initialAppointments?: Appointment[]
  initialReminders?: Reminder[]
}

export default function DashboardClient({ 
  initialLeads, 
  initialEvents,
  initialAppointments,
  initialReminders
}: DashboardClientProps) {
  const supabase = createClient()

  // Realtime Lists States (optimized with safe brackets fallback)
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads || [])
  const [eventsList, setEventsList] = useState<LeadEvent[]>(initialEvents || [])
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>(initialAppointments || [])
  const [remindersList, setRemindersList] = useState<Reminder[]>(initialReminders || [])

  // Drawer states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  
  // Filters State
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [statusFilter] = useState<string>('all')

  // Realtime Active Sync setup
  useEffect(() => {
    const leadsChannel = supabase
      .channel('realtime-dashboard-leads-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hvac_leads' }, (p: any) => {
        if (p.eventType === 'INSERT') setLeadsList(prev => [p.new as Lead, ...prev])
        else if (p.eventType === 'UPDATE') setLeadsList(prev => prev.map(l => l.id === p.new.id ? { ...l, ...p.new } : l))
      })
      .subscribe()

    const eventsChannel = supabase
      .channel('realtime-dashboard-events-v3')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lead_events' }, async (p: any) => {
        const { data } = await (supabase.from('hvac_leads') as any)
          .select('customer_name')
          .eq('id', p.new.lead_id)
          .maybeSingle()

        const customerName = (data as { customer_name?: string } | null | undefined)?.customer_name ?? 'Unknown Customer'
        const newEvent = { ...p.new, hvac_leads: { customer_name: customerName } } as LeadEvent
        setEventsList(prev => [newEvent, ...prev])
      })
      .subscribe()

    const appChannel = supabase
      .channel('realtime-dashboard-appointments-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (p: any) => {
        if (p.eventType === 'INSERT') setAppointmentsList(prev => [p.new as Appointment, ...prev])
        else if (p.eventType === 'UPDATE') setAppointmentsList(prev => prev.map(a => a.id === p.new.id ? { ...a, ...p.new } : a))
      })
      .subscribe()

    const remChannel = supabase
      .channel('realtime-dashboard-reminders-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, (p: any) => {
        if (p.eventType === 'INSERT') setRemindersList(prev => [p.new as Reminder, ...prev])
        else if (p.eventType === 'UPDATE') setRemindersList(prev => prev.map(r => r.id === p.new.id ? { ...r, ...p.new } : r))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(leadsChannel)
      supabase.removeChannel(eventsChannel)
      supabase.removeChannel(appChannel)
      supabase.removeChannel(remChannel)
    }
  }, [supabase])

  // Dynamic filter mappings
  const filteredLeads = useMemo(() => {
    const list = (leadsList || []) as any[]
    return list.filter((lead: any) => {
      if (timeFilter !== 'all') {
        const leadDate = new Date(lead.created_at)
        const now = new Date()
        const diffDays = Math.ceil(Math.abs(now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (timeFilter === 'today' && leadDate.toDateString() !== now.toDateString()) return false
        if (timeFilter === '7days' && diffDays > 7) return false
        if (timeFilter === '30days' && diffDays > 30) return false
      }
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false
      if (cityFilter !== 'all' && lead.city !== cityFilter) return false
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false
      return true
    })
  }, [leadsList, timeFilter, priorityFilter, cityFilter, statusFilter])

  const uniqueCities = useMemo(() => Array.from(new Set((leadsList || []).map((l: any) => l.city))), [leadsList])

  // Feature 10 operational KPI calculations
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    
    const todayApps = (appointmentsList || []).filter((a: any) => a.appointment_date === todayStr && a.status === 'Scheduled').length
    const pendingReminders = (remindersList || []).filter((r: any) => r.status === 'Pending').length
    const overdueReminders = (remindersList || []).filter((r: any) => r.status === 'Pending' && r.reminder_date < todayStr).length
    const scheduledJobs = (filteredLeads || []).filter((l: any) => l.status === 'SCHEDULED').length

    return { todayApps, pendingReminders, overdueReminders, scheduledJobs }
  }, [filteredLeads, appointmentsList, remindersList])

  // Feature 5 schedule mappings
  const todayAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const list = (appointmentsList || []) as any[]
    return list
      .filter((a: any) => a.appointment_date === todayStr && a.status === 'Scheduled')
      .map((appt: any) => {
        const lead = ((leadsList || []) as any[]).find((l: any) => l.id === appt.lead_id)
        return {
          ...appt,
          customer_name: (lead as any)?.customer_name || 'Unknown Customer',
          service_type: (lead as any)?.service_type || 'General Service',
          priority: (lead as any)?.priority || 'LOW'
        }
      })
  }, [appointmentsList, leadsList])

  // Feature 6 upcoming reminders sorted mapping
  const upcomingReminders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const list = (remindersList || []) as any[]
    return list
      .filter((r: any) => r.status === 'Pending')
      .map((rem: any) => {
        const isOverdue = rem.reminder_date < todayStr
        return { ...rem, isOverdue }
      })
      .sort((a: any, b: any) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
  }, [remindersList])

  // Area and Pie Chart data mapping (Feature 3)
  const leadTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toLocaleDateString('en-US', { weekday: 'short' })
    }).reverse()

    return last7Days.map(dayStr => {
      const count = (filteredLeads || []).filter((lead: any) => new Date(lead.created_at).toLocaleDateString('en-US', { weekday: 'short' }) === dayStr).length
      return { day: dayStr, Leads: count }
    })
  }, [filteredLeads])

  const priorityChartData = useMemo(() => {
    const priorities: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const colors = ['#9CA3AF', '#2563EB', '#F59E0B', '#EF4444']
    return priorities.map((p, idx) => {
      const count = (filteredLeads || []).filter((l: any) => l.priority === p).length
      return { name: p, value: count, color: colors[idx] }
    }).filter(p => p.value > 0)
  }, [filteredLeads])

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-danger-custom/10 text-danger-custom border-danger-custom/20'
      case 'HIGH': return 'bg-warning-custom/10 text-warning-custom border-warning-custom/20'
      case 'MEDIUM': return 'bg-primary-custom/10 text-primary-custom border-primary-custom/20'
      default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-primary-custom/10 text-primary-custom'
      case 'CONTACTED': return 'bg-warning-custom/10 text-warning-custom'
      case 'SCHEDULED': return 'bg-info-custom/10 text-info-custom'
      case 'COMPLETED': return 'bg-success-custom/10 text-success-custom'
      default: return 'bg-text-secondary/10 text-text-secondary'
    }
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

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsPanelOpen(true)
  }

  return (
    <div className="space-y-8 relative">
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-b-border-custom">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">HVAC Lead Command Center</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time artificial intelligence qualification and routing engine.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as any)} className="px-3 py-2 bg-surface border border-border-custom rounded-input text-sm font-medium cursor-pointer">
            <option value="all">All Time</option>
            <option value="today">Today Only</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 bg-surface border border-border-custom rounded-input text-sm font-medium cursor-pointer">
            <option value="all">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="px-3 py-2 bg-surface border border-border-custom rounded-input text-sm font-medium cursor-pointer">
            <option value="all">All Cities</option>
            {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
      </div>

      {/* KPI operational cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-text-secondary">Today&apos;s Appointments</span>
          <h3 className="text-2xl font-bold tracking-tight text-primary-custom">{metrics.todayApps} Visits</h3>
        </div>
        <div className="bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-text-secondary">Pending Follow-ups</span>
          <h3 className="text-2xl font-bold tracking-tight text-warning-custom">{metrics.pendingReminders} Reminders</h3>
        </div>
        <div className="bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-text-secondary">Overdue Follow-ups</span>
          <h3 className={`text-2xl font-bold tracking-tight ${metrics.overdueReminders > 0 ? 'text-danger-custom animate-pulse' : 'text-text-primary'}`}>
            {metrics.overdueReminders} Alert
          </h3>
        </div>
        <div className="bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-text-secondary">Scheduled Tech Jobs</span>
          <h3 className="text-2xl font-bold tracking-tight text-success-custom">{metrics.scheduledJobs} Active</h3>
        </div>
      </div>

      {/* Second Row: Today's Schedule & Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Today's Schedule Widget */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom shadow-sm p-6 flex flex-col">
          <div className="pb-4 border-b border-border-custom mb-4">
            <h2 className="text-base font-bold tracking-tight text-text-primary">Today&apos;s Appointments Schedule</h2>
            <p className="text-xs text-text-secondary mt-0.5">Technician site visits scheduled for today.</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-62.5 space-y-3 pr-1">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appt: any) => (
                <div key={appt.id} onClick={() => handleRowClick(leadsList.find(l => l.id === appt.lead_id)!)} className="flex items-center justify-between p-3 bg-background border border-border-custom rounded-card hover:border-primary-custom cursor-pointer transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-text-primary">{appt.customer_name}</p>
                    <p className="text-[10px] text-text-secondary">{appt.service_type} • {appt.appointment_type}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-text-secondary font-medium">{appt.appointment_time}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(appt.priority)}`}>{appt.priority}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary py-12">
                <Inbox className="h-5 w-5 mr-1" />
                <span>No appointments booked for today</span>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders Widget */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom shadow-sm p-6 flex flex-col">
          <div className="pb-4 border-b border-border-custom mb-4">
            <h2 className="text-base font-bold tracking-tight text-text-primary">Upcoming Follow-up Reminders</h2>
            <p className="text-xs text-text-secondary mt-0.5">Chronologically sorted customer callback alerts.</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-62.5 space-y-3 pr-1">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((rem: any) => (
                <div key={rem.id} className={`flex items-center justify-between p-3 border rounded-card transition-colors ${rem.isOverdue ? 'bg-danger-custom/2 border-danger-custom/30' : 'bg-background border-border-custom'}`}>
                  <div className="space-y-0.5 flex-1 min-w-0 pr-3">
                    <p className="text-xs font-semibold text-text-primary truncate">{rem.message}</p>
                    <p className="text-[10px] text-text-secondary font-medium">Due: {rem.reminder_date} at {rem.reminder_time}</p>
                  </div>
                  {rem.isOverdue && (
                    <span className="text-[10px] font-bold text-danger-custom bg-danger-custom/10 px-2 py-0.5 rounded-full animate-pulse">OVERDUE</span>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary py-12">
                <BellOff className="h-5 w-5 mr-1" />
                <span>No pending follow-ups found</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Third Row: Recharts Trend area & Priority breakdown - Dynamically Imported (Feature 3) */}
      <DashboardCharts 
        leadTrendData={leadTrendData}
        priorityChartData={priorityChartData}
        filteredLeadsLength={(filteredLeads || []).length}
      />

      {/* Fourth Row: Recent leads & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leads Table */}
        <div className="lg:col-span-8 bg-surface rounded-card border border-border-custom shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-border-custom flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-text-primary">Recent Qualified Leads</h2>
              <p className="text-xs text-text-secondary mt-0.5">Click on any row to open the intelligence drawer.</p>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {(filteredLeads || []).length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-custom bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Lead Score</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom text-sm">
                  {(filteredLeads || []).slice(0, 10).map((lead: any) => (
                    <tr key={lead.id} onClick={() => handleRowClick(lead)} className="hover:bg-background/80 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-semibold text-text-primary group-hover:text-primary-custom transition-colors">{lead.customer_name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1 text-xs font-medium text-text-secondary bg-background px-2.5 py-1 rounded-full border border-border-custom">
                          <Globe className="h-3 w-3 text-text-muted" />
                          <span>{lead.source || 'Website'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{lead.city}</td>
                      <td className="px-6 py-4 text-text-secondary truncate max-w-32">{lead.service_type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(lead.priority)}`}>{lead.priority}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{lead.lead_score}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(lead.status)}`}>{lead.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-text-secondary">
                <span className="text-base font-semibold">No Leads Ingested</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom shadow-sm p-6 flex flex-col justify-between">
          <div className="pb-4 border-b border-border-custom mb-4">
            <h2 className="text-base font-bold tracking-tight text-text-primary">Recent Activity Feed</h2>
            <p className="text-xs text-text-secondary mt-0.5">Real-time audit log of active leads.</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-87.5 pr-1">
            {eventsList.length > 0 ? (
              eventsList.map((evt) => (
                <div key={evt.id} className="flex items-start space-x-3 text-sm p-1 hover:bg-background/40 rounded-lg transition-colors">
                  <div className="p-1.5 bg-background rounded-button border border-border-custom shrink-0 mt-0.5">
                    {getEventIcon(evt.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary leading-normal">{evt.description}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-text-muted font-medium">
                      <span>{evt.hvac_leads?.customer_name || 'System Auto'}</span>
                      <span>{formatRelativeTime(evt.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary py-12">
                No active events logged
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Reusable Lead Details Console Drawer */}
      {isPanelOpen && selectedLead && (
        <LeadDetailsDrawer
          selectedLead={selectedLead}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          onStatusUpdated={(newStatus) => {
            setLeadsList(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: newStatus } : l))
            setSelectedLead({ ...selectedLead, status: newStatus })
          }}
        />
      )}

    </div>
  )
}