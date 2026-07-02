/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
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
  ThumbsDown,
  Square,
  CheckSquare,
  Trash2,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Calendar,
  Bell,
  AlertCircle,
  Wrench
} from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import { formatRelativeTime } from '../../lib/utils/time'
import LeadDetailsDrawer from './LeadDetailsDrawer'
import { bulkDeleteLeads } from '../../app/(authenticated)/dashboard/actions'

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

  // Bulk Operations State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastType(type)
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Confirmation dialog state for bulk delete
  const [confirmDeleteState, setConfirmDeleteState] = useState<{ visible: boolean; count: number }>({ visible: false, count: 0 })

  // Realtime Active Sync setup
  useEffect(() => {
    const leadsChannel = supabase
      .channel('realtime-dashboard-leads-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hvac_leads' }, (p: any) => {
        if (p.eventType === 'INSERT') setLeadsList(prev => [p.new as Lead, ...prev])
        else if (p.eventType === 'UPDATE') setLeadsList(prev => prev.map(l => l.id === p.new.id ? { ...l, ...p.new } : l))
        else if (p.eventType === 'DELETE') setLeadsList(prev => prev.filter(l => l.id !== p.old.id))
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

  // Bulk operation handlers
  const toggleSelectLead = useCallback((id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }, [])

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedLeadIds.length === 0) return
    setBulkLoading(true)
    // Use triggerLeadAction for CONTACTED and COMPLETED, updateLeadStatusDirectly for LOST
    if (newStatus === 'LOST') {
      const { updateLeadStatusDirectly } = await import('../../app/(authenticated)/dashboard/actions')
      // Bulk update each lead individually via updateLeadStatusDirectly
      for (const leadId of selectedLeadIds) {
        const lead = leadsList.find(l => l.id === leadId)
        if (lead) {
          await updateLeadStatusDirectly(leadId, 'LOST', lead.status)
        }
      }
      setLeadsList(prev => prev.map(l => selectedLeadIds.includes(l.id) ? { ...l, status: 'LOST' } : l))
      triggerToast(`${selectedLeadIds.length} leads marked as Lost.`)
    } else if (newStatus === 'CONTACTED') {
      const { triggerLeadAction } = await import('../../app/(authenticated)/dashboard/actions')
      for (const leadId of selectedLeadIds) {
        await triggerLeadAction(leadId, 'contact')
      }
      setLeadsList(prev => prev.map(l => selectedLeadIds.includes(l.id) ? { ...l, status: 'CONTACTED' } : l))
      triggerToast(`${selectedLeadIds.length} leads marked as Contacted.`)
    } else if (newStatus === 'COMPLETED') {
      const { triggerLeadAction } = await import('../../app/(authenticated)/dashboard/actions')
      for (const leadId of selectedLeadIds) {
        await triggerLeadAction(leadId, 'complete')
      }
      setLeadsList(prev => prev.map(l => selectedLeadIds.includes(l.id) ? { ...l, status: 'COMPLETED' } : l))
      triggerToast(`${selectedLeadIds.length} leads marked as Completed.`)
    }
    setSelectedLeadIds([])
    setBulkLoading(false)
  }

  const handleBulkDelete = () => {
    if (selectedLeadIds.length === 0) return
    setConfirmDeleteState({ visible: true, count: selectedLeadIds.length })
  }

  const executeBulkDelete = async () => {
    setConfirmDeleteState(prev => ({ ...prev, visible: false }))
    if (selectedLeadIds.length === 0) return
    setBulkLoading(true)
    const res = await bulkDeleteLeads(selectedLeadIds)
    if (res.success) {
      setLeadsList(prev => prev.filter(l => !selectedLeadIds.includes(l.id)))
      triggerToast(`${selectedLeadIds.length} leads deleted successfully.`)
      setSelectedLeadIds([])
    } else {
      triggerToast(`Bulk delete failed: ${res.error}`, 'error')
    }
    setBulkLoading(false)
  }

  return (
    <div className="space-y-5 relative">
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 pb-5 border-b border-border-custom">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary/80">Real-time lead intelligence and routing overview.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as any)} className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 py-2 bg-surface border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 py-2 bg-surface border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30">
            <option value="all">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 py-2 bg-surface border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30">
            <option value="all">All Cities</option>
            {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
      </div>

      {/* KPI operational cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface p-5 rounded-card border border-border-custom shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-secondary/80 tracking-wide uppercase">Appointments Today</span>
            <div className="h-8 w-8 rounded-lg bg-primary-custom/8 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-custom" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-text-primary">{metrics.todayApps}</span>
            <span className="text-xs font-medium text-text-secondary/70">visits</span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-card border border-border-custom shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-secondary/80 tracking-wide uppercase">Pending Follow-ups</span>
            <div className="h-8 w-8 rounded-lg bg-warning-custom/8 flex items-center justify-center">
              <Bell className="h-4 w-4 text-warning-custom" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-text-primary">{metrics.pendingReminders}</span>
            <span className="text-xs font-medium text-text-secondary/70">reminders</span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-card border border-border-custom shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-secondary/80 tracking-wide uppercase">Overdue Alerts</span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${metrics.overdueReminders > 0 ? 'bg-danger-custom/8' : 'bg-text-secondary/8'}`}>
              <AlertCircle className={`h-4 w-4 ${metrics.overdueReminders > 0 ? 'text-danger-custom' : 'text-text-muted'}`} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tracking-tight ${metrics.overdueReminders > 0 ? 'text-danger-custom' : 'text-text-primary'}`}>
              {metrics.overdueReminders}
            </span>
            <span className="text-xs font-medium text-text-secondary/70">overdue</span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-card border border-border-custom shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-secondary/80 tracking-wide uppercase">Scheduled Jobs</span>
            <div className="h-8 w-8 rounded-lg bg-success-custom/8 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-success-custom" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-text-primary">{metrics.scheduledJobs}</span>
            <span className="text-xs font-medium text-text-secondary/70">active</span>
          </div>
        </div>
      </div>

      {/* Second Row: Today's Schedule & Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Today's Schedule Widget */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom shadow-sm card-hover flex flex-col">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Today&apos;s Schedule</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">Technician site visits planned for today.</p>
          </div>
          <div className="flex-1 p-5 space-y-2.5 max-h-[260px] overflow-y-auto scrollbar-thin">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appt: any) => (
                <div key={appt.id} onClick={() => handleRowClick(leadsList.find(l => l.id === appt.lead_id)!)} className="flex items-center justify-between p-3 bg-background border border-border-custom rounded-lg hover:border-primary-custom/40 hover:bg-background/80 cursor-pointer transition-all duration-150">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-medium text-text-primary truncate">{appt.customer_name}</p>
                    <p className="text-[11px] text-text-secondary/70 mt-0.5 truncate">{appt.service_type}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-medium text-text-secondary/80">{appt.appointment_time}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border leading-none ${getPriorityBadgeClass(appt.priority)}`}>{appt.priority}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-8 w-8 text-text-muted/50 mb-2" />
                <p className="text-xs font-medium text-text-secondary/70">No appointments scheduled</p>
                <p className="text-[11px] text-text-muted/60 mt-0.5">New appointments will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders Widget */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom shadow-sm card-hover flex flex-col">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Follow-up Reminders</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">Chronologically sorted customer callback alerts.</p>
          </div>
          <div className="flex-1 p-5 space-y-2.5 max-h-[260px] overflow-y-auto scrollbar-thin">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((rem: any) => (
                <div key={rem.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${rem.isOverdue ? 'bg-danger-custom/[0.03] border-danger-custom/20' : 'bg-background border-border-custom'}`}>
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-medium text-text-primary truncate">{rem.message}</p>
                    <p className="text-[11px] text-text-secondary/70 mt-0.5">
                      Due: <span className="font-medium text-text-secondary">{rem.reminder_date}</span> at <span className="font-medium text-text-secondary">{rem.reminder_time}</span>
                    </p>
                  </div>
                  {rem.isOverdue && (
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger-custom/10 text-danger-custom">OVERDUE</span>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BellOff className="h-8 w-8 text-text-muted/50 mb-2" />
                <p className="text-xs font-medium text-text-secondary/70">No pending reminders</p>
                <p className="text-[11px] text-text-muted/60 mt-0.5">New reminders will appear here.</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Leads Table */}
        <div className="lg:col-span-8 bg-surface rounded-card border border-border-custom shadow-sm card-hover overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border-custom flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-text-primary">Recent Leads</h2>
              <p className="text-xs text-text-secondary/70 mt-0.5">Click any row to open the intelligence drawer.</p>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {(filteredLeads || []).length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-custom bg-background/40">
                    <th className="px-5 py-3 w-10 text-center">
                      <button
                        onClick={() => {
                          if (selectedLeadIds.length === filteredLeads.length) {
                            setSelectedLeadIds([])
                          } else {
                            setSelectedLeadIds(filteredLeads.map(l => l.id))
                          }
                        }}
                        className="p-1 rounded hover:bg-background text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                      >
                        {selectedLeadIds.length === (filteredLeads || []).length && (filteredLeads || []).length > 0 ? (
                          <CheckSquare className="h-3.5 w-3.5 text-primary-custom" />
                        ) : (
                          <Square className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider">Source</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider">City</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider">Service</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider">Priority</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider">Score</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/60">
                  {(filteredLeads || []).slice(0, 10).map((lead: any) => (
                    <tr key={lead.id} onClick={() => handleRowClick(lead)} className={`hover:bg-background/40 transition-colors cursor-pointer group ${selectedLeadIds.includes(lead.id) ? 'bg-primary-custom/[0.02]' : ''}`}>
                      <td className="px-5 py-3.5 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelectLead(lead.id)}
                          className="p-1 rounded hover:bg-background text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                        >
                          {selectedLeadIds.includes(lead.id) ? (
                            <CheckSquare className="h-3.5 w-3.5 text-primary-custom" />
                          ) : (
                            <Square className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-text-primary group-hover:text-primary-custom transition-colors">{lead.customer_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary/80 bg-background/60 px-2.5 py-1 rounded-md border border-border-custom/60">
                          <Globe className="h-3 w-3 text-text-muted" />
                          {lead.source || 'Website'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary/80">{lead.city}</td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary/80 truncate max-w-28">{lead.service_type}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border leading-none ${getPriorityBadgeClass(lead.priority)}`}>{lead.priority}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-text-primary">{lead.lead_score}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none ${getStatusBadgeClass(lead.status)}`}>{lead.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-8 w-8 text-text-muted/50 mb-2" />
                <p className="text-xs font-semibold text-text-secondary/80">No leads found</p>
                <p className="text-[11px] text-text-muted/60 mt-0.5">Leads will appear here once ingested.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom shadow-sm card-hover flex flex-col">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Activity Feed</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">Real-time audit log of lead events.</p>
          </div>
          <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[400px] scrollbar-thin">
            {eventsList.length > 0 ? (
              eventsList.map((evt) => (
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

      {/* Dashboard Bulk Operations Floating Toolbar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border-custom shadow-xl rounded-xl p-3 z-40 flex items-center gap-4 animate-fade-in text-sm font-semibold max-w-lg w-full justify-between">
          <div className="flex items-center gap-2 px-1">
            <ShieldAlert className="h-4 w-4 text-primary-custom" />
            <span className="text-xs font-medium text-text-secondary">{selectedLeadIds.length} selected</span>
          </div>

          <div className="flex items-center gap-1.5">
            {bulkLoading ? (
              <Loader2 className="animate-spin h-4 w-4 text-primary-custom" />
            ) : (
              <>
                <button
                  onClick={() => handleBulkStatusChange('CONTACTED')}
                  className="px-2.5 py-1.5 bg-warning-custom/8 text-warning-custom rounded-lg text-[11px] font-semibold hover:bg-warning-custom/15 transition-colors cursor-pointer"
                >
                  Contacted
                </button>
                <button
                  onClick={() => handleBulkStatusChange('COMPLETED')}
                  className="px-2.5 py-1.5 bg-success-custom/8 text-success-custom rounded-lg text-[11px] font-semibold hover:bg-success-custom/15 transition-colors cursor-pointer"
                >
                  Complete
                </button>
                <button
                  onClick={() => handleBulkStatusChange('LOST')}
                  className="px-2.5 py-1.5 bg-text-secondary/8 text-text-secondary rounded-lg text-[11px] font-semibold hover:bg-text-secondary/15 transition-colors cursor-pointer"
                >
                  Lost
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="p-1.5 bg-danger-custom/8 text-danger-custom rounded-lg hover:bg-danger-custom/15 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Bulk Delete */}
      {confirmDeleteState.visible && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmDeleteState(prev => ({ ...prev, visible: false }))} />
          <div className="relative bg-surface w-full max-w-sm rounded-card border border-border-custom p-5 shadow-2xl animate-fade-in">
            <div className="flex items-start gap-3 pb-4 border-b border-border-custom mb-4">
              <div className="h-8 w-8 rounded-lg bg-warning-custom/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-warning-custom" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Delete Leads</h3>
                <p className="text-xs text-text-secondary/70 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary/80 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-text-primary">{confirmDeleteState.count}</strong> selected leads?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteState(prev => ({ ...prev, visible: false }))}
                className="px-4 py-2 border border-border-custom hover:bg-background rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkDelete}
                className="px-4 py-2 bg-danger-custom text-white hover:bg-danger-custom/90 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}