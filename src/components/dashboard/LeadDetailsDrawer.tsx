/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  X, Phone, Mail, Clock3, Sparkles, ArrowRight, UserCheck,
  CheckCircle2, Loader2, FileText, Trash2, Calendar,
  Copy, Map, PlusCircle, Activity, BellRing, Pencil,
  AlertTriangle, XCircle, Eye, CalendarCheck,
  ThumbsDown, AlertCircle
} from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import { formatRelativeTime } from '../../lib/utils/time'
import {
  appointmentSchema, noteSchema, reminderSchema,
  appointmentUpdateSchema,
  AppointmentInput, NoteInput, ReminderInput,
  AppointmentUpdateInput
} from '../../lib/schemas'
import {
  triggerLeadAction,
  scheduleAppointment,
  addLeadNote,
  deleteLeadNote,
  createReminder,
  completeReminder,
  updateAppointment,
  updateLeadNote
} from '../../app/(authenticated)/dashboard/actions'
import { getServiceTypes } from '../../app/(authenticated)/settings/service-types.actions'

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
}

interface LeadNote {
  id: string
  lead_id: string
  note: string
  created_at: string
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

interface LeadDetailsDrawerProps {
  selectedLead: Lead
  isOpen: boolean
  onClose: () => void
  onStatusUpdated?: (newStatus: any) => void
}

export default function LeadDetailsDrawer({
  selectedLead,
  onClose,
  onStatusUpdated
}: LeadDetailsDrawerProps) {
  const supabase = createClient()

  // Realtime lists states
  const [timeline, setTimeline] = useState<LeadEvent[]>([])
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])

  // Modal / Inline Form states
  const [showAppModal, setShowAppModal] = useState(false)
  const [showRemForm, setShowRemForm] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [toastExiting, setToastExiting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Service types for appointment type dropdown
  interface ServiceTypeItem {
    id: string
    user_id: string
    name: string
    display_order: number
    is_active: boolean
    created_at: string
    updated_at: string
  }
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>([])
  const [serviceTypesLoading, setServiceTypesLoading] = useState(false)

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'complete' | 'lost' | 'deleteNote'
    noteId?: string
    title: string
    message: string
  } | null>(null)

  // Appointment editing state
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null)

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [noteEditLoading, setNoteEditLoading] = useState(false)

  // Exit Animation State
  const [isClosing, setIsClosing] = useState(false)
  const [confirmClosing, setConfirmClosing] = useState(false)
  const [appModalClosing, setAppModalClosing] = useState(false)
  const [editModalClosing, setEditModalClosing] = useState(false)

  // Track which sections are visible for staggered entry animation
  const [visibleSections, setVisibleSections] = useState(false)
  const staggerTimersRef = React.useRef<NodeJS.Timeout[]>([])

  // Trigger section stagger on mount, clean up on unmount
  useEffect(() => {
    // Sections start invisible, become visible after the drawer opens (300ms) + small delays
    const t = setTimeout(() => setVisibleSections(true), 300)
    staggerTimersRef.current.push(t)
    return () => {
      staggerTimersRef.current.forEach(clearTimeout)
      staggerTimersRef.current = []
    }
  }, [])

  // Reset when isOpen / isClosing changes (drawer re-opens)
  useEffect(() => {
    if (!isClosing) return
    setVisibleSections(false)
    const t = setTimeout(() => setVisibleSections(true), 500)
    staggerTimersRef.current.push(t)
    return () => clearTimeout(t)
  }, [isClosing])

  // Track LEAD_VIEWED insertion per lead to avoid duplicates
  const viewedLeadRef = React.useRef<string | null>(null)

  // Initialize RHF for Dispatch Notes
  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    reset: resetNote,
    formState: { errors: errorsNote, isSubmitting: isSubmittingNote }
  } = useForm<NoteInput>({
    resolver: zodResolver(noteSchema)
  })

  // Initialize RHF for Appointments Form (create)
  const {
    register: registerApp,
    handleSubmit: handleSubmitApp,
    reset: resetApp,
    formState: { errors: errorsApp, isSubmitting: isSubmittingApp }
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema)
  })

  // Initialize RHF for Appointment Edit Form
  const {
    register: registerAppEdit,
    handleSubmit: handleSubmitAppEdit,
    reset: resetAppEdit,
    setValue: setAppEditValue,
    formState: { errors: errorsAppEdit, isSubmitting: isSubmittingAppEdit }
  } = useForm<AppointmentUpdateInput>({
    resolver: zodResolver(appointmentUpdateSchema)
  })

  // Initialize RHF for Reminders Form
  const {
    register: registerRem,
    handleSubmit: handleSubmitRem,
    reset: resetRem,
    formState: { errors: errorsRem, isSubmitting: isSubmittingRem }
  } = useForm<ReminderInput>({
    resolver: zodResolver(reminderSchema)
  })

  // Populate appointment edit form when editing
  useEffect(() => {
    if (editAppointment) {
      setAppEditValue('date', editAppointment.appointment_date)
      setAppEditValue('time', editAppointment.appointment_time)
      setAppEditValue('type', editAppointment.appointment_type as any)
      setAppEditValue('notes', editAppointment.notes || '')
    }
  }, [editAppointment, setAppEditValue])

  // Load service types for appointment dropdown
  useEffect(() => {
    const loadServiceTypes = async () => {
      setServiceTypesLoading(true)
      const result = await getServiceTypes()
      if (result.success && result.data) {
        setServiceTypes(result.data)
      }
      setServiceTypesLoading(false)
    }
    loadServiceTypes()
  }, [])

  // Supabase Realtime subscriptions & Initial data fetches
  useEffect(() => {
    if (!selectedLead) return

    const fetchData = async () => {
      const { data: timelineData } = await supabase.from('lead_events').select('*').eq('lead_id', selectedLead.id).order('created_at', { ascending: false })
      setTimeline(timelineData as LeadEvent[] || [])

      const { data: notesData } = await supabase.from('lead_notes').select('*').eq('lead_id', selectedLead.id).order('created_at', { ascending: false })
      setNotes(notesData as LeadNote[] || [])

      const { data: appData } = await supabase.from('appointments').select('*').eq('lead_id', selectedLead.id).order('created_at', { ascending: false })
      setAppointments(appData as Appointment[] || [])

      const { data: remData } = await supabase.from('reminders').select('*').eq('lead_id', selectedLead.id).order('created_at', { ascending: false })
      setReminders(remData as Reminder[] || [])

      // LEAD_VIEWED: insert only once per lead
      if (viewedLeadRef.current !== selectedLead.id) {
        viewedLeadRef.current = selectedLead.id
        const { data: existingView } = await (supabase.from('lead_events') as any)
          .select('id')
          .eq('lead_id', selectedLead.id)
          .eq('event_type', 'LEAD_VIEWED')
          .maybeSingle()

        if (!existingView) {
          await (supabase.from('lead_events') as any).insert({
            lead_id: selectedLead.id,
            event_type: 'LEAD_VIEWED',
            description: `Lead details viewed by dispatcher.`,
            metadata: {},
            created_by: null
          })
        }
      }
    }

    fetchData()

    const subChannel = supabase
      .channel(`drawer-realtime-console-${selectedLead.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lead_events', filter: `lead_id=eq.${selectedLead.id}` }, (p) => {
        setTimeline(prev => [p.new as LeadEvent, ...prev])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_notes', filter: `lead_id=eq.${selectedLead.id}` }, (p) => {
        if (p.eventType === 'INSERT') setNotes(prev => [p.new as LeadNote, ...prev])
        if (p.eventType === 'UPDATE') setNotes(prev => prev.map(n => n.id === p.new.id ? { ...n, ...p.new } : n))
        if (p.eventType === 'DELETE') setNotes(prev => prev.filter(n => n.id !== p.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `lead_id=eq.${selectedLead.id}` }, (p) => {
        if (p.eventType === 'INSERT') setAppointments(prev => [p.new as Appointment, ...prev])
        if (p.eventType === 'UPDATE') setAppointments(prev => prev.map(a => a.id === p.new.id ? { ...a, ...p.new } : a))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `lead_id=eq.${selectedLead.id}` }, (p) => {
        if (p.eventType === 'INSERT') setReminders(prev => [p.new as Reminder, ...prev])
        if (p.eventType === 'UPDATE') setReminders(prev => prev.map(r => r.id === p.new.id ? { ...r, ...p.new } : r))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subChannel)
    }
  }, [selectedLead, supabase])

  // Custom close handler to trigger smooth slide-out before unmounting
  const handleCloseWithAnimation = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastType(type)
    setToastMsg(msg)
    setToastExiting(false)
    setTimeout(() => {
      setToastExiting(true)
      setTimeout(() => {
        setToastMsg(null)
        setToastExiting(false)
      }, 200)
    }, 2300)
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    triggerToast(`${label} copied to clipboard!`)
  }

  const handleMaps = (city: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`, '_blank')
  }

  // --- Confirm Dialog Actions ---

  const executeConfirmedAction = async () => {
    if (!confirmDialog) return

    const dialog = confirmDialog
    setConfirmDialog(null)
    setActionLoading(dialog.type)

    if (dialog.type === 'complete') {
      const res = await triggerLeadAction(selectedLead.id, 'complete')
      if (res.success) {
        if (onStatusUpdated) onStatusUpdated('COMPLETED')
        triggerToast('Lead marked as Completed.')
      } else {
        triggerToast(`Failed: ${res.error}`, 'error')
      }
    } else if (dialog.type === 'lost') {
      const { updateLeadStatusDirectly } = await import('../../app/(authenticated)/dashboard/actions')
      const res = await updateLeadStatusDirectly(selectedLead.id, 'LOST', selectedLead.status)
      if (res.success) {
        if (onStatusUpdated) onStatusUpdated('LOST')
        triggerToast('Lead marked as Lost.')
      } else {
        triggerToast(`Failed: ${res.error}`, 'error')
      }
    } else if (dialog.type === 'deleteNote' && dialog.noteId) {
      const res = await deleteLeadNote(dialog.noteId, selectedLead.id)
      if (res.success) {
        triggerToast('Note deleted successfully.')
      } else {
        triggerToast(`Failed: ${res.error}`, 'error')
      }
    }

    setActionLoading(null)
  }

  // --- Quick Actions ---

  const handleAction = async (action: 'call' | 'contact') => {
    setActionLoading(action)
    const res = await triggerLeadAction(selectedLead.id, action)
    if (res.success) {
      const newStatus = (res as any).data?.newStatus
      if (newStatus && onStatusUpdated) {
        onStatusUpdated(newStatus)
      }
      triggerToast(`Action completed.`)
    } else {
      triggerToast(`Failed: ${res.error}`, 'error')
    }
    setActionLoading(null)
  }

  // --- Appointment Create ---

  const onScheduleAppSubmit = async (data: AppointmentInput) => {
    const res = await scheduleAppointment(selectedLead.id, data.date, data.time, data.type, data.notes || '')
    if (res.success) {
      if (onStatusUpdated) onStatusUpdated('SCHEDULED')
      setShowAppModal(false)
      resetApp()
      triggerToast('Appointment scheduled successfully!')
    } else {
      triggerToast(`Error: ${res.error}`, 'error')
    }
  }

  // --- Appointment Edit ---

  const onEditAppSubmit = async (data: AppointmentUpdateInput) => {
    if (!editAppointment) return
    const res = await updateAppointment(editAppointment.id, data.date, data.time, data.type, data.notes || '')
    if (res.success) {
      setEditAppointment(null)
      resetAppEdit()
      triggerToast('Appointment updated successfully!')
    } else {
      triggerToast(`Error: ${res.error}`, 'error')
    }
  }

  const openEditAppointment = (app: Appointment) => {
    setEditAppointment(app)
  }

  const closeEditAppointment = () => {
    setEditAppointment(null)
    resetAppEdit()
  }

  // --- Notes ---

  const onAddNoteSubmit = async (data: NoteInput) => {
    const res = await addLeadNote(selectedLead.id, data.note)
    if (res.success) {
      resetNote()
      triggerToast('Dispatch note saved!')
    } else {
      triggerToast(`Failed to save note: ${res.error}`, 'error')
    }
  }

  const startEditNote = (note: LeadNote) => {
    setEditingNoteId(note.id)
    setEditingNoteText(note.note)
  }

  const cancelEditNote = () => {
    setEditingNoteId(null)
    setEditingNoteText('')
  }

  const saveEditNote = async () => {
    if (!editingNoteId) return
    setNoteEditLoading(true)
    const res = await updateLeadNote(editingNoteId, editingNoteText)
    if (res.success) {
      triggerToast('Note updated successfully!')
      setEditingNoteId(null)
      setEditingNoteText('')
    } else {
      triggerToast(`Failed to update note: ${res.error}`, 'error')
    }
    setNoteEditLoading(false)
  }

  // --- Reminders ---

  const onAddReminderSubmit = async (data: ReminderInput) => {
    const res = await createReminder(selectedLead.id, data.date, data.time, data.priority, data.message)
    if (res.success) {
      setShowRemForm(false)
      resetRem()
      triggerToast('Follow-up reminder set!')
    } else {
      triggerToast(`Error: ${res.error}`, 'error')
    }
  }

  const handleCompleteReminder = async (id: string) => {
    const res = await completeReminder(id, selectedLead.id)
    if (res.success) {
      triggerToast('Reminder marked as completed!')
    } else {
      triggerToast(`Failed: ${res.error}`, 'error')
    }
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-danger-custom/10 text-danger-custom border-danger-custom/20'
      case 'HIGH': return 'bg-warning-custom/10 text-warning-custom border-warning-custom/20'
      case 'MEDIUM': return 'bg-primary-custom/10 text-primary-custom border-primary-custom/20'
      default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'LEAD_CREATED': return <PlusCircle className="h-4 w-4 text-primary-custom" />
      case 'LEAD_RECEIVED': return <PlusCircle className="h-4 w-4 text-primary-custom" />
      case 'LEAD_VIEWED': return <Eye className="h-4 w-4 text-info-custom" />
      case 'AI_ANALYZED': return <Sparkles className="h-4 w-4 text-success-custom" />
      case 'FIRST_RESPONSE': return <UserCheck className="h-4 w-4 text-success-custom" />
      case 'STATUS_CHANGED': return <Activity className="h-4 w-4 text-warning-custom" />
      case 'EMAIL_SENT': return <Mail className="h-4 w-4 text-info-custom" />
      case 'NOTE_ADDED': return <FileText className="h-4 w-4 text-primary-custom" />
      case 'APPOINTMENT_CREATED': return <CalendarCheck className="h-4 w-4 text-info-custom" />
      case 'APPOINTMENT_COMPLETED': return <CheckCircle2 className="h-4 w-4 text-success-custom" />
      case 'LEAD_COMPLETED': return <CheckCircle2 className="h-4 w-4 text-success-custom" />
      case 'LEAD_LOST': return <ThumbsDown className="h-4 w-4 text-danger-custom" />
      default: return <Clock3 className="h-4 w-4 text-text-secondary" />
    }
  }

  const activeApp = appointments.find(a => a.status === 'Scheduled' || a.status === 'Confirmed')
  const isTerminal = selectedLead.status === 'COMPLETED' || selectedLead.status === 'LOST'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-xs transition-all duration-[280ms] ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      />

      {/* Main Drawer Sheet */}
      <div className={`relative w-full max-w-lg md:max-w-2xl bg-surface h-full shadow-2xl border-l border-border-custom flex flex-col transition-transform duration-300 ease-in-out ${
        isClosing ? 'translate-x-full' : 'translate-x-0'
      }`}>

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className={`absolute top-4 left-4 z-50 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-2xl ${toastExiting ? 'toast-exit' : 'toast-enter'} ${
            toastType === 'error' ? 'bg-danger-custom text-white' : 'bg-text-primary text-background'
          }`}>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-4 border-b border-border-custom bg-background/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-custom" />
              <span className="text-sm font-semibold tracking-tight text-text-primary">Lead Workspace</span>
            </div>
            <button onClick={handleCloseWithAnimation} className="p-1.5 rounded-lg hover:bg-border-custom text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight text-text-primary">{selectedLead.customer_name}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary-custom/8 text-primary-custom leading-none">
                  <Sparkles className="h-3 w-3" />
                  {selectedLead.lead_score} Score
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-text-secondary/80 capitalize">{selectedLead.source}</span>
                <span className="text-text-muted">·</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border leading-none ${getPriorityBadgeClass(selectedLead.priority)}`}>
                  {selectedLead.priority}
                </span>
                <span className="text-text-muted">·</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-custom/8 text-primary-custom leading-none">
                  {selectedLead.status}
                </span>
                {activeApp && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success-custom/8 text-success-custom leading-none">
                      Appt: {activeApp.appointment_date}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Contact Actions Header */}
            <div className="flex items-center gap-1">
              <button onClick={() => window.open(`tel:${selectedLead.phone}`)} className="p-2 border border-border-custom/60 rounded-lg bg-surface hover:bg-background text-text-secondary hover:text-text-primary transition-colors cursor-pointer" title="Dial Phone">
                <Phone className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleCopy(selectedLead.phone, 'Phone number')} className="p-2 border border-border-custom/60 rounded-lg bg-surface hover:bg-background text-text-secondary hover:text-text-primary transition-colors cursor-pointer" title="Copy Phone">
                <Copy className="h-3.5 w-3.5" />
              </button>
              {selectedLead.email && (
                <button onClick={() => handleCopy(selectedLead.email!, 'Email address')} className="p-2 border border-border-custom/60 rounded-lg bg-surface hover:bg-background text-text-secondary hover:text-text-primary transition-colors cursor-pointer" title="Copy Email">
                  <Mail className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => handleMaps(selectedLead.city)} className="p-2 border border-border-custom/60 rounded-lg bg-surface hover:bg-background text-text-secondary hover:text-text-primary transition-colors cursor-pointer" title="Open Maps">
                <Map className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Two-Column Layout */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-6 scrollbar-thin">

          {/* LEFT COLUMN: Notes & Reminders & Timeline */}
          <div className="md:col-span-7 space-y-5">

            {/* Note Logging Widget */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary-custom" />
                <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Dispatch Notes</h4>
              </div>
              <form onSubmit={handleSubmitNote(onAddNoteSubmit)} className="space-y-2 bg-background border border-border-custom rounded-card p-4">
                <textarea
                  {...registerNote('note')}
                  placeholder="Log dispatch notes, customer callbacks or details..."
                  rows={2}
                  className={`w-full p-2.5 bg-surface border rounded-lg text-xs text-text-primary leading-relaxed resize-none outline-none focus:ring-2 focus:ring-primary-custom/15 ${
                    errorsNote.note ? 'border-danger-custom' : 'border-border-custom'
                  }`}
                />
                {errorsNote.note && (
                  <p className="text-xs text-danger-custom font-medium">{errorsNote.note.message}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingNote}
                  className="px-3 py-1.5 bg-primary-custom text-white hover:bg-primary-hover text-xs font-medium rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  {isSubmittingNote && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Save Note</span>
                </button>
              </form>

              {/* Note List */}
              <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin">
                {notes.map(note => (
                  <div key={note.id} className="bg-background border border-border-custom p-3.5 rounded-card flex items-start justify-between gap-3 hover:border-primary-custom/20 transition-colors">
                    {editingNoteId === note.id ? (
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          rows={2}
                          className="w-full p-2 bg-surface border border-border-custom rounded-lg text-xs text-text-primary leading-relaxed resize-none outline-none focus:ring-2 focus:ring-primary-custom/15"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={saveEditNote}
                            disabled={noteEditLoading}
                            className="px-3 py-1 bg-primary-custom text-white hover:bg-primary-hover text-xs font-medium rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1 transition-colors"
                          >
                            {noteEditLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                            <span>Save</span>
                          </button>
                          <button
                            onClick={cancelEditNote}
                            className="px-3 py-1 border border-border-custom hover:bg-surface text-xs font-medium rounded-lg cursor-pointer transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary leading-relaxed">{note.note}</p>
                          <span className="text-[11px] text-text-muted/80 mt-1 block">{formatRelativeTime(note.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => startEditNote(note)} className="text-text-muted hover:text-primary-custom transition-colors p-1 cursor-pointer" title="Edit note">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setConfirmDialog({
                              type: 'deleteNote',
                              noteId: note.id,
                              title: 'Delete Note',
                              message: 'Are you sure you want to delete this internal note?'
                            })}
                            className="text-text-muted hover:text-danger-custom transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up Reminders Widget */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BellRing className="h-3.5 w-3.5 text-warning-custom" />
                  <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Follow-up Reminders</h4>
                </div>
                <button
                  onClick={() => setShowRemForm(!showRemForm)}
                  className="text-[11px] text-primary-custom hover:text-primary-hover font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Clock3 className="h-3 w-3" />
                  <span>Add Reminder</span>
                </button>
              </div>

              {showRemForm && (
                <form onSubmit={handleSubmitRem(onAddReminderSubmit)} className="bg-background border border-border-custom rounded-card p-4 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-text-secondary/80 mb-1">Date</label>
                      <input {...registerRem('date')} type="date" className={`w-full px-2.5 py-1.5 bg-surface border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-custom/15 ${errorsRem.date ? 'border-danger-custom' : 'border-border-custom'}`} />
                      {errorsRem.date && <p className="text-[10px] text-danger-custom font-medium mt-0.5">{errorsRem.date.message}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-text-secondary/80 mb-1">Time</label>
                      <input {...registerRem('time')} type="time" className={`w-full px-2.5 py-1.5 bg-surface border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-custom/15 ${errorsRem.time ? 'border-danger-custom' : 'border-border-custom'}`} />
                      {errorsRem.time && <p className="text-[10px] text-danger-custom font-medium mt-0.5">{errorsRem.time.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-text-secondary/80 mb-1">Priority</label>
                      <select {...registerRem('priority')} className="w-full px-2.5 py-1.5 bg-surface border border-border-custom rounded-lg text-xs outline-none cursor-pointer">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-medium text-text-secondary/80 mb-1">Message</label>
                      <input
                        {...registerRem('message')}
                        type="text"
                        placeholder="e.g. Call back customer for quote"
                        className={`w-full px-2.5 py-1.5 bg-surface border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-custom/15 ${errorsRem.message ? 'border-danger-custom' : 'border-border-custom'}`}
                      />
                      {errorsRem.message && <p className="text-[10px] text-danger-custom font-medium mt-0.5">{errorsRem.message.message}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setShowRemForm(false)} className="px-3 py-1.5 border border-border-custom hover:bg-surface text-xs font-medium rounded-lg cursor-pointer transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmittingRem} className="px-3 py-1.5 bg-primary-custom text-white hover:bg-primary-hover text-xs font-medium rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1 transition-colors">
                      {isSubmittingRem && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>Set Reminder</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Reminders List */}
              <div className="space-y-2">
                {reminders.map(rem => {
                  const isHighPriority = rem.priority === 'HIGH' || rem.priority === 'CRITICAL'
                  return (
                    <div key={rem.id} className={`bg-background border rounded-card p-3.5 flex items-center justify-between gap-3 ${isHighPriority && rem.status === 'Pending' ? 'border-warning-custom/20 border-l-2 border-l-warning-custom' : 'border-border-custom'}`}>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium ${rem.status === 'Completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>{rem.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border leading-none ${getPriorityBadgeClass(rem.priority)}`}>{rem.priority}</span>
                          <span className="text-[11px] text-text-secondary/70">Due: {rem.reminder_date} at {rem.reminder_time}</span>
                          {rem.status === 'Completed' && <span className="text-[11px] text-success-custom font-medium">Completed</span>}
                        </div>
                      </div>
                      {rem.status === 'Pending' && (
                        <button onClick={() => handleCompleteReminder(rem.id)} className="p-1.5 border border-border-custom hover:border-success-custom text-text-secondary hover:text-success-custom rounded-lg transition-colors cursor-pointer shrink-0" title="Mark Completed">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Audit Lead Timeline */}
            <div className="space-y-3 pt-1">
              <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Lead Timeline</h4>
              <div className="bg-background border border-border-custom rounded-card p-4">
                {timeline.length > 0 ? (
                  <div className="relative ml-3 space-y-5">
                    {timeline.map((evt, idx) => {
                      const isLast = idx === timeline.length - 1
                      return (
                        <div key={evt.id} className="relative flex gap-4">
                          {/* Connector line */}
                          {!isLast && (
                            <div className="absolute left-[11px] top-[22px] bottom-[-16px] w-px bg-border-custom/50" />
                          )}
                          {/* Dot */}
                          <div className="relative z-10 shrink-0">
                            <div className="h-[22px] w-[22px] rounded-full bg-background border border-border-custom/60 flex items-center justify-center">
                              {getEventIcon(evt.event_type)}
                            </div>
                          </div>
                          {/* Content */}
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-xs font-medium text-text-primary leading-relaxed">{evt.description}</p>
                            <span className="text-[11px] text-text-muted/80 mt-0.5 block">{formatRelativeTime(evt.created_at)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary/60 text-center py-4">No timeline events found</p>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Metrics, Routing, Appointments */}
          <div className="md:col-span-5 space-y-5">

            {/* Appointment Widget */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Appointment</h4>

              <div className="bg-background border border-border-custom rounded-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-text-secondary/80">Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border leading-none ${selectedLead.status === 'SCHEDULED' ? 'bg-success-custom/10 text-success-custom border-success-custom/20' : 'bg-background text-text-secondary border-border-custom'}`}>
                    {selectedLead.status === 'SCHEDULED' ? 'Scheduled' : 'Unscheduled'}
                  </span>
                </div>

                {activeApp && (
                  <div className="p-3 bg-surface border border-border-custom rounded-lg space-y-1.5 text-xs">
                    <p className="text-xs font-semibold text-text-primary mb-1.5">Visit Details</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div>
                        <span className="text-[11px] font-medium text-text-secondary/70">Date</span>
                        <p className="text-xs font-medium text-text-primary">{activeApp.appointment_date}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-text-secondary/70">Time</span>
                        <p className="text-xs font-medium text-text-primary">{activeApp.appointment_time}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[11px] font-medium text-text-secondary/70">Type</span>
                        <p className="text-xs font-medium text-text-primary">{activeApp.appointment_type}</p>
                      </div>
                      {activeApp.notes && (
                        <div className="col-span-2">
                          <span className="text-[11px] font-medium text-text-secondary/70">Notes</span>
                          <p className="text-xs text-text-secondary/80 truncate">{activeApp.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => openEditAppointment(activeApp)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-background hover:bg-border-custom border border-border-custom rounded-lg text-[11px] font-medium text-text-primary transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowAppModal(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-custom/8 text-primary-custom hover:bg-primary-custom/15 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <Calendar className="h-3 w-3" />
                        New
                      </button>
                    </div>
                  </div>
                )}

                {!activeApp && (
                  <button
                    onClick={() => setShowAppModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-custom hover:bg-primary-hover rounded-lg text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Schedule Appointment
                  </button>
                )}
              </div>
            </div>

            {/* Intelligence Metrics */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Lead Score</h4>
              <div className="bg-background border border-border-custom rounded-card p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-text-secondary/80 mb-1">AI Score</div>
                  <div className="text-2xl font-bold tracking-tight text-primary-custom">{selectedLead.lead_score}<span className="text-text-muted text-base font-medium">/100</span></div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-custom/8 text-primary-custom">
                  {selectedLead.lead_quality}
                </span>
              </div>
            </div>

            {/* Recommended Routing */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Routing</h4>
              <div className="bg-background border border-border-custom rounded-card p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary/80 font-medium mb-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    Recommended Response
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{selectedLead.recommended_response_time}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary/80 font-medium mb-1">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Next Action
                  </div>
                  <p className="text-sm font-medium text-text-primary leading-relaxed">{selectedLead.recommended_action}</p>
                </div>
              </div>
            </div>

            {/* Quick CRM Action Buttons */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Actions</h4>

              <div className="space-y-2">
                {!isTerminal && (
                  <button
                    onClick={() => handleAction('call')}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-lg text-sm font-medium transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-primary-custom" />
                      <span>Call Customer</span>
                    </span>
                    {actionLoading === 'call' && <Loader2 className="h-4 w-4 animate-spin text-primary-custom" />}
                  </button>
                )}

                {selectedLead.status === 'NEW' && (
                  <button
                    onClick={() => handleAction('contact')}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-lg text-sm font-medium transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <UserCheck className="h-4 w-4 text-warning-custom" />
                      <span>Mark Contacted</span>
                    </span>
                    {actionLoading === 'contact' && <Loader2 className="h-4 w-4 animate-spin text-warning-custom" />}
                  </button>
                )}

                {selectedLead.status !== 'COMPLETED' && selectedLead.status !== 'LOST' && (
                  <button
                    onClick={() => setConfirmDialog({
                      type: 'complete',
                      title: 'Mark Lead Completed',
                      message: 'Are you sure you want to mark this lead as Completed? Any active appointments will also be completed.'
                    })}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-lg text-sm font-medium transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-success-custom" />
                      <span>Mark Completed</span>
                    </span>
                    {actionLoading === 'complete' && <Loader2 className="h-4 w-4 animate-spin text-success-custom" />}
                  </button>
                )}

                {selectedLead.status !== 'COMPLETED' && selectedLead.status !== 'LOST' && (
                  <button
                    onClick={() => setConfirmDialog({
                      type: 'lost',
                      title: 'Mark Lead Lost',
                      message: 'Are you sure you want to mark this lead as Lost? This action will close the lead.'
                    })}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-lg text-sm font-medium transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <XCircle className="h-4 w-4 text-danger-custom" />
                      <span>Mark Lost</span>
                    </span>
                    {actionLoading === 'lost' && <Loader2 className="h-4 w-4 animate-spin text-danger-custom" />}
                  </button>
                )}
              </div>
            </div>

            {/* Internal Notes Section (disabled - for future use) */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Internal Notes</h4>
              <div className="bg-background border border-border-custom rounded-card p-4 space-y-3">
                <textarea
                  placeholder="Type internal notes for dispatch or technicians here..."
                  disabled
                  rows={3}
                  className="w-full p-2.5 bg-surface border border-border-custom rounded-lg text-xs text-text-muted leading-relaxed resize-none cursor-not-allowed"
                />
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border-custom rounded-lg text-xs font-medium text-text-muted cursor-not-allowed"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Save Note
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-custom bg-background/30 flex items-center justify-between">
          <div className="text-xs text-text-secondary/70">
            Lead ID: <span className="font-medium text-text-secondary">{selectedLead.id.substring(0, 8)}...</span>
          </div>
          <button onClick={handleCloseWithAnimation} className="px-4 py-2 border border-border-custom hover:bg-background rounded-lg text-xs font-medium transition-colors cursor-pointer">
            Close
          </button>
        </div>

      </div>

      {/* ==========================================
          CONFIRMATION DIALOG
          ========================================== */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className="relative bg-surface w-full max-w-sm rounded-card border border-border-custom p-5 shadow-2xl animate-fade-in">
            <div className="flex items-start gap-3 pb-4 border-b border-border-custom mb-4">
              <div className="h-8 w-8 rounded-lg bg-warning-custom/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-warning-custom" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{confirmDialog.title}</h3>
                <p className="text-xs text-text-secondary/70 mt-0.5">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 border border-border-custom hover:bg-background rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-primary-custom text-white hover:bg-primary-hover rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {actionLoading !== null && <Loader2 className="h-3 w-3 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SCHEDULE APPOINTMENT DIALOG (Create)
          ========================================== */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAppModal(false)} />
          <div className="relative bg-surface w-full max-w-md rounded-card border border-border-custom p-5 shadow-2xl animate-fade-in">

            <div className="flex items-center justify-between pb-4 border-b border-border-custom mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Schedule Appointment</h3>
              <button onClick={() => setShowAppModal(false)} className="p-1 rounded-lg hover:bg-background cursor-pointer transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitApp(onScheduleAppSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary/80 mb-1">Date</label>
                  <input
                    {...registerApp('date')}
                    type="date"
                    className={`w-full px-3 py-2 bg-background border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-custom/15 ${
                      errorsApp.date ? 'border-danger-custom' : 'border-border-custom'
                    }`}
                  />
                  {errorsApp.date && <p className="text-xs text-danger-custom font-medium mt-1">{errorsApp.date.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary/80 mb-1">Time</label>
                  <input
                    {...registerApp('time')}
                    type="time"
                    className={`w-full px-3 py-2 bg-background border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-custom/15 ${
                      errorsApp.time ? 'border-danger-custom' : 'border-border-custom'
                    }`}
                  />
                  {errorsApp.time && <p className="text-xs text-danger-custom font-medium mt-1">{errorsApp.time.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary/80 mb-1">Type</label>
                <select
                  {...registerApp('type')}
                  className="w-full px-3 py-2 bg-background border border-border-custom rounded-lg text-xs outline-none cursor-pointer focus:ring-2 focus:ring-primary-custom/15"
                >
                  {serviceTypesLoading ? (
                    <option value="">Loading...</option>
                  ) : serviceTypes.filter(st => st.is_active).length === 0 ? (
                    <option value="">No service types available</option>
                  ) : (
                    [...serviceTypes]
                      .filter(st => st.is_active)
                      .sort((a, b) => a.display_order - b.display_order)
                      .map(st => (
                        <option key={st.id} value={st.name}>{st.name}</option>
                      ))
                  )}
                </select>
                {errorsApp.type && <p className="text-xs text-danger-custom font-medium mt-1">{errorsApp.type.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary/80 mb-1">Notes for Technicians</label>
                <textarea
                  {...registerApp('notes')}
                  placeholder="Gate codes, system location, access notes..."
                  rows={3}
                  className={`w-full p-2.5 bg-background border rounded-lg text-xs resize-none outline-none focus:ring-2 focus:ring-primary-custom/15 ${
                    errorsApp.notes ? 'border-danger-custom' : 'border-border-custom'
                  }`}
                />
                {errorsApp.notes && <p className="text-xs text-danger-custom font-medium mt-1">{errorsApp.notes.message}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-custom">
                <button type="button" onClick={() => setShowAppModal(false)} className="px-4 py-2 border border-border-custom hover:bg-background rounded-lg text-xs font-medium cursor-pointer transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmittingApp} className="px-4 py-2 bg-primary-custom text-white hover:bg-primary-hover rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors">
                  {isSubmittingApp && <Loader2 className="h-3 w-3 animate-spin" />}
                  Book Appointment
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ==========================================
          EDIT APPOINTMENT DIALOG
          ========================================== */}
      {editAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={closeEditAppointment} />
          <div className="relative bg-surface w-full max-w-md rounded-card border border-border-custom p-5 shadow-2xl animate-fade-in">

            <div className="flex items-center justify-between pb-4 border-b border-border-custom mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Edit Appointment</h3>
              <button onClick={closeEditAppointment} className="p-1 rounded-lg hover:bg-background cursor-pointer transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAppEdit(onEditAppSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary/80 mb-1">Date</label>
                  <input
                    {...registerAppEdit('date')}
                    type="date"
                    className={`w-full px-3 py-2 bg-background border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-custom/15 ${
                      errorsAppEdit.date ? 'border-danger-custom' : 'border-border-custom'
                    }`}
                  />
                  {errorsAppEdit.date && <p className="text-xs text-danger-custom font-medium mt-1">{errorsAppEdit.date.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary/80 mb-1">Time</label>
                  <input
                    {...registerAppEdit('time')}
                    type="time"
                    className={`w-full px-3 py-2 bg-background border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-custom/15 ${
                      errorsAppEdit.time ? 'border-danger-custom' : 'border-border-custom'
                    }`}
                  />
                  {errorsAppEdit.time && <p className="text-xs text-danger-custom font-medium mt-1">{errorsAppEdit.time.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary/80 mb-1">Type</label>
                <select
                  {...registerAppEdit('type')}
                  className="w-full px-3 py-2 bg-background border border-border-custom rounded-lg text-xs outline-none cursor-pointer focus:ring-2 focus:ring-primary-custom/15"
                >
                  {serviceTypesLoading ? (
                    <option value="">Loading...</option>
                  ) : serviceTypes.length === 0 ? (
                    <option value="">No service types available</option>
                  ) : (
                    [...serviceTypes]
                      .sort((a, b) => a.display_order - b.display_order)
                      .map(st => (
                        <option key={st.id} value={st.name}>{st.name} {!st.is_active ? '(inactive)' : ''}</option>
                      ))
                  )}
                </select>
                {errorsAppEdit.type && <p className="text-xs text-danger-custom font-medium mt-1">{errorsAppEdit.type.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary/80 mb-1">Notes for Technicians</label>
                <textarea
                  {...registerAppEdit('notes')}
                  placeholder="Gate codes, system location, access notes..."
                  rows={3}
                  className={`w-full p-2.5 bg-background border rounded-lg text-xs resize-none outline-none focus:ring-2 focus:ring-primary-custom/15 ${
                    errorsAppEdit.notes ? 'border-danger-custom' : 'border-border-custom'
                  }`}
                />
                {errorsAppEdit.notes && <p className="text-xs text-danger-custom font-medium mt-1">{errorsAppEdit.notes.message}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-custom">
                <button type="button" onClick={closeEditAppointment} className="px-4 py-2 border border-border-custom hover:bg-background rounded-lg text-xs font-medium cursor-pointer transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmittingAppEdit} className="px-4 py-2 bg-primary-custom text-white hover:bg-primary-hover rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors">
                  {isSubmittingAppEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
