'use client'

import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react'
import { createClient } from '../../lib/supabase/client'
import { usePerformanceMonitor } from '../../lib/performance'
import { DashboardChartsLoading } from '../../components/ui/LazyLoading'
import { bulkDeleteLeads } from '../../app/(authenticated)/dashboard/actions'
import { KPICards } from './KPICards'
import { ScheduleWidget } from './ScheduleWidget'
import { RemindersWidget } from './RemindersWidget'
import { LeadTable } from './LeadTable'
import { ActivityFeed } from './ActivityFeed'
import { BulkToolbar } from './BulkToolbar'
import { DeleteDialog } from './DeleteDialog'

// Lazy load heavy chart + drawer components
const DashboardCharts = lazy(() => import('./DashboardCharts'))
const LeadDetailsDrawer = lazy(() => import('./LeadDetailsDrawer'))

// Shared types — import from one source to avoid duplicate-type conflicts
import type { Lead, LeadEvent, Appointment, Reminder } from './types'

// Local debounce hook for filter inputs (keeps UI responsive during heavy recompute)
function useDebounce<T>(value: T, delay: number): T {
  const [deferred, setDeferred] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDeferred(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return deferred
}

interface DashboardClientProps {
  initialLeads: Lead[]
  initialEvents: LeadEvent[]
  initialAppointments?: Appointment[]
  initialReminders?: Reminder[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DashboardClient({
  initialLeads,
  initialEvents,
  initialAppointments,
  initialReminders,
}: DashboardClientProps) {
  const supabase = createClient()

  // --- State ---------------------------------------------------------------
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads || [])
  const [eventsList, setEventsList] = useState<LeadEvent[]>(initialEvents || [])
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>(initialAppointments || [])
  const [remindersList, setRemindersList] = useState<Reminder[]>(initialReminders || [])

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const deferredTimeFilter = useDebounce(timeFilter, 150)
  const deferredPriorityFilter = useDebounce(priorityFilter, 150)
  const deferredCityFilter = useDebounce(cityFilter, 150)
  const deferredStatusFilter = useDebounce(statusFilter, 150)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _setStatusFilter = setStatusFilter

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const [confirmDeleteState, setConfirmDeleteState] = useState<{ visible: boolean; count: number }>({ visible: false, count: 0 })

  // --- Realtime subscriptions ----------------------------------------------
  useEffect(() => {
    const leadsChannel = supabase
      .channel('realtime-dashboard-leads-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hvac_leads' }, (payload) => {
        const eventType = payload.eventType
        const newRow = payload.new as Lead | undefined
        const oldRow = payload.old as { id: string } | undefined
        setLeadsList(prev => {
          if (eventType === 'INSERT' && newRow) return [newRow, ...prev]
          if (eventType === 'UPDATE' && newRow) return prev.map(l => l.id === newRow.id ? { ...l, ...newRow } : l)
          if (eventType === 'DELETE' && oldRow) return prev.filter(l => l.id !== oldRow.id)
          return prev
        })
      })
      .subscribe()

    const eventsChannel = supabase
      .channel('realtime-dashboard-events-v3')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lead_events' }, async (payload) => {
        const newEventRow = payload.new as LeadEvent | undefined
        if (!newEventRow) return
        const { data } = await supabase.from('hvac_leads').select('customer_name').eq('id', newEventRow.lead_id).maybeSingle()
        const newEvent: LeadEvent = {
          ...newEventRow,
          hvac_leads: { customer_name: (data as { customer_name?: string } | null | undefined)?.customer_name ?? 'Unknown Customer' },
        }
        setEventsList(prev => [newEvent, ...prev])
      })
      .subscribe()

    const appChannel = supabase
      .channel('realtime-dashboard-appointments-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        const eventType = payload.eventType
        const newRow = payload.new as Appointment | undefined
        setAppointmentsList(prev => {
          if (eventType === 'INSERT' && newRow) return [newRow, ...prev]
          if (eventType === 'UPDATE' && newRow) return prev.map(a => a.id === newRow.id ? { ...a, ...newRow } : a)
          return prev
        })
      })
      .subscribe()

    const remChannel = supabase
      .channel('realtime-dashboard-reminders-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, (payload) => {
        const eventType = payload.eventType
        const newRow = payload.new as Reminder | undefined
        setRemindersList(prev => {
          if (eventType === 'INSERT' && newRow) return [newRow, ...prev]
          if (eventType === 'UPDATE' && newRow) return prev.map(r => r.id === newRow.id ? { ...r, ...newRow } : r)
          return prev
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(leadsChannel)
      supabase.removeChannel(eventsChannel)
      supabase.removeChannel(appChannel)
      supabase.removeChannel(remChannel)
    }
  }, [supabase])

  // --- Performance measurement (development only) -------------------------
  const { startTimer } = usePerformanceMonitor()
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const timer = startTimer('dashboard-client-render')
    const t = setTimeout(() => timer.end(), 0)
    return () => clearTimeout(t)
  }, [startTimer])

  // --- Derived data --------------------------------------------------------
  const filteredLeads = useMemo(() => {
    const list = (leadsList || []) as Lead[]
    return list.filter((lead) => {
      if (deferredTimeFilter !== 'all') {
        const leadDate = new Date(lead.created_at)
        const now = new Date()
        const diffDays = Math.ceil(Math.abs(now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24))
        if (deferredTimeFilter === 'today' && leadDate.toDateString() !== now.toDateString()) return false
        if (deferredTimeFilter === '7days' && diffDays > 7) return false
        if (deferredTimeFilter === '30days' && diffDays > 30) return false
      }
      if (deferredPriorityFilter !== 'all' && lead.priority !== deferredPriorityFilter) return false
      if (deferredCityFilter !== 'all' && lead.city !== deferredCityFilter) return false
      if (deferredStatusFilter !== 'all' && lead.status !== deferredStatusFilter) return false
      return true
    })
  }, [leadsList, deferredTimeFilter, deferredPriorityFilter, deferredCityFilter, deferredStatusFilter])

  const todayAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    return (appointmentsList || []).filter((a) => a.appointment_date === todayStr && a.status === 'Scheduled')
  }, [appointmentsList])

  const upcomingReminders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    return (remindersList || [])
      .filter((r) => r.status === 'Pending')
      .map((rem) => ({ ...rem, isOverdue: rem.reminder_date < todayStr }))
      .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
  }, [remindersList])

  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayApps = appointmentsList.filter(a => a.appointment_date === todayStr && a.status === 'Scheduled').length
    const pendingReminders = remindersList.filter(r => r.status === 'Pending').length
    const overdueReminders = remindersList.filter(r => r.status === 'Pending' && r.reminder_date < todayStr).length
    const scheduledJobs = filteredLeads.filter(l => l.status === 'SCHEDULED').length
    return { todayApps, pendingReminders, overdueReminders, scheduledJobs }
  }, [appointmentsList, remindersList, filteredLeads])

  const leadTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toLocaleDateString('en-US', { weekday: 'short' })
    }).reverse()
    return last7Days.map(dayStr => ({
      day: dayStr,
      Leads: (filteredLeads || []).filter((lead) => new Date(lead.created_at).toLocaleDateString('en-US', { weekday: 'short' }) === dayStr).length,
    }))
  }, [filteredLeads])

  const priorityChartData = useMemo(() => {
    const priorities: Lead['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const colors = ['#9CA3AF', '#2563EB', '#F59E0B', '#EF4444']
    return priorities.map((p, idx) => ({
      name: p,
      value: (filteredLeads || []).filter(l => l.priority === p).length,
      color: colors[idx],
    })).filter(p => p.value > 0)
  }, [filteredLeads])

  const uniqueCities = useMemo(() => Array.from(new Set((leadsList || []).map((l) => l.city))), [leadsList])

  // --- Helpers -------------------------------------------------------------
  const triggerToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToastType(type)
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }, [])

  const handleRowClick = useCallback((lead: Lead) => {
    setSelectedLead(lead)
    setIsPanelOpen(true)
  }, [])

  const toggleSelectLead = useCallback((id: string) => {
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }, [])

  // --- Bulk actions --------------------------------------------------------
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedLeadIds.length === 0) return
    setBulkLoading(true)
    if (newStatus === 'LOST') {
      const { updateLeadStatusDirectly } = await import('../../app/(authenticated)/dashboard/actions')
      for (const leadId of selectedLeadIds) {
        const lead = leadsList.find(l => l.id === leadId)
        if (lead) await updateLeadStatusDirectly(leadId, 'LOST', lead.status)
      }
      setLeadsList(prev => prev.map(l => selectedLeadIds.includes(l.id) ? { ...l, status: 'LOST' as Lead['status'] } : l))
      triggerToast(`${selectedLeadIds.length} leads marked as Lost.`)
    } else {
      const { triggerLeadAction } = await import('../../app/(authenticated)/dashboard/actions')
      const action = newStatus === 'CONTACTED' ? 'contact' : 'complete'
      for (const leadId of selectedLeadIds) {
        await triggerLeadAction(leadId, action)
      }
      setLeadsList(prev => prev.map(l => selectedLeadIds.includes(l.id) ? { ...l, status: newStatus as Lead['status'] } : l))
      triggerToast(`${selectedLeadIds.length} leads marked as ${newStatus}.`)
    }
    setSelectedLeadIds([])
    setBulkLoading(false)
  }

  const handleBulkDelete = useCallback(() => {
    if (selectedLeadIds.length === 0) return
    setConfirmDeleteState({ visible: true, count: selectedLeadIds.length })
  }, [selectedLeadIds.length])

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

  const toggleSelectAll = useCallback(() => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([])
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id))
    }
  }, [selectedLeadIds.length, filteredLeads])

  // --- Render --------------------------------------------------------------
  return (
    <div className="space-y-5 relative">

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 pb-5 border-b border-border-custom">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary/80">Real-time lead scoring and pipeline overview.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as 'all' | 'today' | '7days' | '30days')} className="w-full sm:w-auto min-h-11 sm:min-h-0 px-3 py-2 bg-surface border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full sm:w-auto min-h-11 sm:min-h-0 px-3 py-2 bg-surface border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30">
            <option value="all">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-full sm:w-auto min-h-11 sm:min-h-0 px-3 py-2 bg-surface border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30">
            <option value="all">All Cities</option>
            {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards — memoized sub-component */}
      <KPICards metrics={metrics} />

      {/* Second Row: Schedule + Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <ScheduleWidget
          appointments={todayAppointments}
          leads={leadsList}
          onLeadClick={handleRowClick}
        />
        <RemindersWidget reminders={upcomingReminders} />
      </div>

      {/* Charts — lazy loaded */}
      <Suspense fallback={<DashboardChartsLoading />}>
        <DashboardCharts
          leadTrendData={leadTrendData}
          priorityChartData={priorityChartData}
          filteredLeadsLength={filteredLeads.length}
        />
      </Suspense>

      {/* Fourth Row: Leads Table + Activity Feed — memoized sub-components */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <LeadTable
          leads={filteredLeads}
          selectedIds={selectedLeadIds}
          onToggleSelect={toggleSelectLead}
          onToggleSelectAll={toggleSelectAll}
          onRowClick={handleRowClick}
        />
        <ActivityFeed events={eventsList} />
      </div>

      {/* Lead Details Drawer — lazy loaded */}
      {isPanelOpen && selectedLead && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-surface border border-border-custom rounded-card p-6 animate-pulse">Loading lead details…</div>
          </div>
        }>
          <LeadDetailsDrawer
            selectedLead={selectedLead}
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            onStatusUpdated={(newStatus) => {
              setLeadsList(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: newStatus } : l))
              setSelectedLead({ ...selectedLead, status: newStatus })
            }}
          />
        </Suspense>
      )}

      {/* Bulk Operations Toolbar */}
      <BulkToolbar
        selectedCount={selectedLeadIds.length}
        bulkLoading={bulkLoading}
        onMarkContacted={() => handleBulkStatusChange('CONTACTED')}
        onMarkComplete={() => handleBulkStatusChange('COMPLETED')}
        onMarkLost={() => handleBulkStatusChange('LOST')}
        onDelete={handleBulkDelete}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        visible={confirmDeleteState.visible}
        count={confirmDeleteState.count}
        onCancel={() => setConfirmDeleteState(prev => ({ ...prev, visible: false }))}
        onConfirm={executeBulkDelete}
      />

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-xs font-medium shadow-2xl animate-fade-in ${
          toastType === 'error' ? 'bg-danger-custom text-white' : 'bg-text-primary text-background'
        }`}>
          {toastMsg}
        </div>
      )}
    </div>
  )
}
