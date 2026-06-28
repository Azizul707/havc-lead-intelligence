/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  X, Phone, Mail, Clock3, Sparkles, ArrowRight, UserCheck,
  CheckCircle2, Loader2, FileText, Trash2, Calendar,
  Copy, Map, PlusCircle, Activity, BellRing
} from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import { formatRelativeTime } from '../../lib/utils/time'
import { 
  appointmentSchema, noteSchema, reminderSchema,
  AppointmentInput, NoteInput, ReminderInput 
} from '../../lib/schemas'
import { 
  triggerLeadAction, 
  scheduleAppointment, 
  addLeadNote, 
  deleteLeadNote, 
  createReminder, 
  completeReminder 
} from '../../app/(authenticated)/dashboard/actions'

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
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Exit Animation State
  const [isClosing, setIsClosing] = useState(false)

  // Initialize RHF for Dispatch Notes
  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    reset: resetNote,
    formState: { errors: errorsNote, isSubmitting: isSubmittingNote }
  } = useForm<NoteInput>({
    resolver: zodResolver(noteSchema)
  })

  // Initialize RHF for Appointments Form
  const {
    register: registerApp,
    handleSubmit: handleSubmitApp,
    reset: resetApp,
    formState: { errors: errorsApp, isSubmitting: isSubmittingApp }
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema)
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
    }

    fetchData()

    const subChannel = supabase
      .channel(`drawer-realtime-console-${selectedLead.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lead_events', filter: `lead_id=eq.${selectedLead.id}` }, (p) => {
        setTimeline(prev => [p.new as LeadEvent, ...prev])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_notes', filter: `lead_id=eq.${selectedLead.id}` }, (p) => {
        if (p.eventType === 'INSERT') setNotes(prev => [p.new as LeadNote, ...prev])
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

  // Custom close handler to trigger smooth slide-out before unmounting (Feature 10)
  const handleCloseWithAnimation = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 200) // Match transition duration (200ms)
  }

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2500)
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    triggerToast(`${label} copied to clipboard!`)
  }

  const handleMaps = (city: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`, '_blank')
  }

  const handleAction = async (action: 'call' | 'contact' | 'complete') => {
    setActionLoading(action)
    const res = await triggerLeadAction(selectedLead.id, action)
    if (res.success) {
      const newStatus = (res as any).data?.newStatus
      if (newStatus && onStatusUpdated) {
        onStatusUpdated(newStatus)
      }
      triggerToast(`Lead successfully marked as ${action.toUpperCase()}`)
    } else {
      triggerToast(`Failed: ${res.error}`)
    }
    setActionLoading(null)
  }

  const onScheduleAppSubmit = async (data: AppointmentInput) => {
    const res = await scheduleAppointment(selectedLead.id, data.date, data.time, data.type, data.notes || '')
    if (res.success) {
      if (onStatusUpdated) onStatusUpdated('SCHEDULED')
      setShowAppModal(false)
      resetApp()
      triggerToast('Appointment scheduled successfully!')
    } else {
      alert(`Error: ${res.error}`)
    }
  }

  const onAddNoteSubmit = async (data: NoteInput) => {
    const res = await addLeadNote(selectedLead.id, data.note)
    if (res.success) {
      resetNote()
      triggerToast('Dispatch note saved!')
    } else {
      triggerToast(`Failed to save note: ${res.error}`)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this internal note?')) return
    const res = await deleteLeadNote(id, selectedLead.id)
    if (res.success) {
      triggerToast('Note deleted successfully.')
    } else {
      triggerToast(`Failed: ${res.error}`)
    }
  }

  const onAddReminderSubmit = async (data: ReminderInput) => {
    const res = await createReminder(selectedLead.id, data.date, data.time, data.priority, data.message)
    if (res.success) {
      setShowRemForm(false)
      resetRem()
      triggerToast('Follow-up reminder set!')
    } else {
      alert(`Error: ${res.error}`)
    }
  }

  const handleCompleteReminder = async (id: string) => {
    const res = await completeReminder(id, selectedLead.id)
    if (res.success) {
      triggerToast('Reminder marked as completed!')
    } else {
      triggerToast(`Failed: ${res.error}`)
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
      case 'AI_ANALYZED': return <Sparkles className="h-4 w-4 text-success-custom" />
      case 'STATUS_CHANGED': return <Activity className="h-4 w-4 text-warning-custom" />
      case 'EMAIL_SENT': return <Mail className="h-4 w-4 text-info-custom" />
      case 'NOTE_ADDED': return <FileText className="h-4 w-4 text-primary-custom" />
      default: return <Clock3 className="h-4 w-4 text-text-secondary" />
    }
  }

  const activeApp = appointments.find(a => a.status === 'Scheduled' || a.status === 'Confirmed')

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop fading out smoothly on close */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-xs transition-all duration-200 ${
          isClosing ? 'opacity-0 backdrop-blur-none pointer-events-none' : 'opacity-100'
        }`} 
        onClick={onClose} 
      />

      {/* Main Drawer Sheet Container sliding smoothly from right (150ms-250ms) */}
      <div className={`relative w-full max-w-2xl bg-surface h-full shadow-2xl border-l border-border-custom flex flex-col transition-transform duration-200 ease-in-out ${
        isClosing ? 'translate-x-full' : 'translate-x-0'
      } ${!isClosing ? 'animate-slide-in' : ''}`}>
        
        {/* Floating Toast Notification Feedback */}
        {toastMsg && (
          <div className="absolute top-4 left-4 z-50 px-4 py-2.5 bg-text-primary text-background rounded-button text-xs font-semibold flex items-center space-x-2 shadow-2xl animate-fade-in">
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Improved Lead Details Header */}
        <div className="px-6 py-5 border-b border-border-custom bg-background/50 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary-custom" />
              <span className="font-bold tracking-tight">Dispatcher Workspace Console</span>
            </div>
            <button onClick={handleCloseWithAnimation} className="p-1.5 rounded-button hover:bg-border-custom text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xl font-bold tracking-tight flex items-center space-x-2.5">
                <span>{selectedLead.customer_name}</span>
                <span className="text-xs font-bold text-primary-custom bg-primary-custom/10 px-1.5 py-0.5 rounded-md flex items-center space-x-0.5">
                  <Sparkles className="h-3 w-3" />
                  <span>{selectedLead.lead_score} Score</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary font-medium">
                <span className="capitalize">{selectedLead.source} Ingestion</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(selectedLead.priority)}`}>
                  {selectedLead.priority}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-custom/10 text-primary-custom">
                  {selectedLead.status}
                </span>
                {activeApp && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-custom/10 text-success-custom border border-success-custom/15">
                      Appt: {activeApp.appointment_date}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Contact Actions Header */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => window.open(`tel:${selectedLead.phone}`)} className="p-2 border border-border-custom rounded-button bg-surface hover:bg-background text-text-secondary hover:text-text-primary cursor-pointer transition-colors" title="Dial Phone">
                <Phone className="h-4 w-4" />
              </button>
              <button onClick={() => handleCopy(selectedLead.phone, 'Phone number')} className="p-2 border border-border-custom rounded-button bg-surface hover:bg-background text-text-secondary hover:text-text-primary cursor-pointer transition-colors" title="Copy Phone">
                <Copy className="h-4 w-4" />
              </button>
              {selectedLead.email && (
                <button onClick={() => handleCopy(selectedLead.email!, 'Email address')} className="p-2 border border-border-custom rounded-button bg-surface hover:bg-background text-text-secondary hover:text-text-primary cursor-pointer transition-colors" title="Copy Email">
                  <Mail className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => handleMaps(selectedLead.city)} className="p-2 border border-border-custom rounded-button bg-surface hover:bg-background text-text-secondary hover:text-text-primary cursor-pointer transition-colors" title="Open Maps">
                <Map className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Two-Column Layout */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Notes & Reminders & Timeline */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Note Logging Widget */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-primary-custom" />
                <span>Dispatcher Dispatch Notes</span>
              </h4>
              <form onSubmit={handleSubmitNote(onAddNoteSubmit)} className="space-y-2 bg-background p-4 rounded-card border border-border-custom">
                <textarea
                  {...registerNote('note')}
                  placeholder="Log any dispatch notes, customer callbacks or details..."
                  rows={2}
                  className={`w-full p-2.5 bg-surface border rounded-input text-xs text-text-primary leading-relaxed resize-none ${
                    errorsNote.note ? 'border-danger-custom' : 'border-border-custom'
                  }`}
                />
                {errorsNote.note && (
                  <p className="text-xs text-danger-custom font-semibold">{errorsNote.note.message}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingNote}
                  className="px-3.5 py-1.5 bg-primary-custom text-white hover:bg-primary-hover text-xs font-semibold rounded-button cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                >
                  {isSubmittingNote && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Save Dispatch Note</span>
                </button>
              </form>

              {/* Note Lists */}
              <div className="space-y-2.5 max-h-45 overflow-y-auto pr-1">
                {notes.map(note => (
                  <div key={note.id} className="bg-background border border-border-custom p-3.5 rounded-card flex items-start justify-between gap-3 hover:border-primary-custom/25 transition-colors">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold leading-relaxed text-text-primary">{note.note}</p>
                      <span className="text-[10px] text-text-muted font-medium">{formatRelativeTime(note.created_at)} • Dispatcher logged</span>
                    </div>
                    <button onClick={() => handleDeleteNote(note.id)} className="text-text-muted hover:text-danger-custom transition-colors p-1 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up Reminders Widget */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
                  <BellRing className="h-4 w-4 text-warning-custom" />
                  <span>Dispatcher Follow-ups</span>
                </h4>
                <button 
                  onClick={() => setShowRemForm(!showRemForm)}
                  className="text-xs text-primary-custom hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>Add Reminder</span>
                </button>
              </div>

              {/* Reminder Form */}
              {showRemForm && (
                <form onSubmit={handleSubmitRem(onAddReminderSubmit)} className="bg-background border border-border-custom p-4 rounded-card space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">Follow-up Date</label>
                      <input {...registerRem('date')} type="date" className={`w-full px-2.5 py-1.5 bg-surface border rounded-input text-xs ${errorsRem.date ? 'border-danger-custom' : 'border-border-custom'}`} />
                      {errorsRem.date && <p className="text-[10px] text-danger-custom font-semibold mt-0.5">{errorsRem.date.message}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">Callback Time</label>
                      <input {...registerRem('time')} type="time" className={`w-full px-2.5 py-1.5 bg-surface border rounded-input text-xs ${errorsRem.time ? 'border-danger-custom' : 'border-border-custom'}`} />
                      {errorsRem.time && <p className="text-[10px] text-danger-custom font-semibold mt-0.5">{errorsRem.time.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">Priority</label>
                      <select {...registerRem('priority')} className="w-full px-2.5 py-1.5 bg-surface border border-border-custom rounded-input text-xs cursor-pointer">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">Instruction Message</label>
                      <input 
                        {...registerRem('message')}
                        type="text" 
                        placeholder="e.g. Call back customer for quote confirmation" 
                        className={`w-full px-2.5 py-1.5 bg-surface border rounded-input text-xs ${errorsRem.message ? 'border-danger-custom' : 'border-border-custom'}`} 
                      />
                      {errorsRem.message && <p className="text-[10px] text-danger-custom font-semibold mt-0.5">{errorsRem.message.message}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setShowRemForm(false)} className="px-3 py-1.5 border border-border-custom hover:bg-surface text-xs font-semibold rounded-button cursor-pointer">Cancel</button>
                    <button type="submit" disabled={isSubmittingRem} className="px-3 py-1.5 bg-primary-custom text-white hover:bg-primary-hover text-xs font-semibold rounded-button cursor-pointer disabled:opacity-50 flex items-center space-x-1">
                      {isSubmittingRem && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>Set Reminder</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Reminders list */}
              <div className="space-y-2">
                {reminders.map(rem => (
                  <div key={rem.id} className="bg-background border border-border-custom p-3.5 rounded-card flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className={`text-xs font-semibold ${rem.status === 'Completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>{rem.message}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-text-secondary font-medium">
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${getPriorityBadgeClass(rem.priority)}`}>{rem.priority}</span>
                        <span>Due: {rem.reminder_date} at {rem.reminder_time}</span>
                        {rem.status === 'Completed' && <span className="text-success-custom">● Completed</span>}
                      </div>
                    </div>
                    {rem.status === 'Pending' && (
                      <button onClick={() => handleCompleteReminder(rem.id)} className="p-1 border border-border-custom hover:border-success-custom text-text-secondary hover:text-success-custom rounded-button transition-colors cursor-pointer" title="Mark Completed">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Lead Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Audit Lead Timeline</h4>
              <div className="bg-background border border-border-custom p-5 rounded-card space-y-4">
                {timeline.length > 0 ? (
                  <div className="relative border-l border-border-custom pl-4 ml-2 space-y-4">
                    {timeline.map((evt) => (
                      <div key={evt.id} className="relative">
                        <span className="absolute -left-6.25 top-0.5 bg-background border border-border-custom p-1 rounded-full shrink-0 flex items-center justify-center">
                          {getEventIcon(evt.event_type)}
                        </span>
                        <div className="pl-2">
                          <p className="text-xs font-semibold text-text-primary leading-relaxed">{evt.description}</p>
                          <span className="text-[10px] text-text-muted mt-0.5 block">{formatRelativeTime(evt.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-text-secondary block text-center py-4">No logged history found</span>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Metrics, Routing, Appointments */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Appointment status widget */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Appointment Reservation</h4>
              
              <div className="bg-background border border-border-custom p-4 rounded-card space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">Appt Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedLead.status === 'SCHEDULED' ? 'bg-success-custom/10 text-success-custom font-bold' : 'bg-background text-text-secondary border border-border-custom'}`}>
                    {selectedLead.status === 'SCHEDULED' ? 'Scheduled Active' : 'Unscheduled'}
                  </span>
                </div>

                {activeApp && (
                  <div className="p-3 bg-surface rounded-button border border-border-custom space-y-1.5 text-xs text-text-secondary">
                    <div className="font-bold text-text-primary">Visit Schedule Detail:</div>
                    <div>Date: <span className="font-semibold">{activeApp.appointment_date}</span></div>
                    <div>Time: <span className="font-semibold">{activeApp.appointment_time}</span></div>
                    <div>Type: <span className="font-semibold">{activeApp.appointment_type}</span></div>
                    {activeApp.notes && <div className="truncate">Notes: {activeApp.notes}</div>}
                  </div>
                )}

                <button
                  onClick={() => setShowAppModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-primary-custom hover:bg-primary-hover rounded-button text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Appointment Visit</span>
                </button>
              </div>
            </div>

            {/* AI analysis */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Intelligence Metrics</h4>
              <div className="bg-background border border-border-custom p-4 rounded-card flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-text-secondary">Lead Score</div>
                  <div className="text-3xl font-bold tracking-tight text-primary-custom">{selectedLead.lead_score}/100</div>
                </div>
                <span className="text-xs font-semibold bg-primary-custom/10 text-primary-custom px-2.5 py-1 rounded-full">
                  {selectedLead.lead_quality} QUALITY
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Recommended Routing</h4>
              <div className="bg-background border border-border-custom p-4 rounded-card space-y-2">
                <div className="flex items-center space-x-1.5 text-xs text-text-secondary font-semibold">
                  <Clock3 className="h-4 w-4" />
                  <span>RECOMMENDED RESPONSE</span>
                </div>
                <p className="text-sm font-bold text-text-primary">{selectedLead.recommended_response_time}</p>
              </div>

              <div className="bg-background border border-border-custom p-4 rounded-card space-y-2">
                <div className="flex items-center space-x-1.5 text-xs text-text-secondary font-semibold">
                  <ArrowRight className="h-4 w-4" />
                  <span>NEXT LOGICAL ACTION</span>
                </div>
                <p className="text-sm font-medium text-text-primary leading-relaxed">{selectedLead.recommended_action}</p>
              </div>
            </div>

            {/* Quick CRM Action Button States */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Quick CRM Actions</h4>
              {toastMsg && (
                <div className="p-3 bg-primary-custom/5 text-primary-custom text-xs font-semibold rounded-input border border-primary-custom/10">
                  {toastMsg}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleAction('call')}
                  disabled={actionLoading !== null}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-button text-sm font-semibold transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                >
                  <span className="flex items-center space-x-2.5">
                    <Phone className="h-4 w-4 text-primary-custom" />
                    <span>Call Customer</span>
                  </span>
                  {actionLoading === 'call' && <Loader2 className="h-4 w-4 animate-spin text-primary-custom" />}
                </button>

                {selectedLead.status === 'NEW' && (
                  <button
                    onClick={() => handleAction('contact')}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-button text-sm font-semibold transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                  >
                    <span className="flex items-center space-x-2.5">
                      <UserCheck className="h-4 w-4 text-warning-custom" />
                      <span>Mark Contacted</span>
                    </span>
                    {actionLoading === 'contact' && <Loader2 className="h-4 w-4 animate-spin text-warning-custom" />}
                  </button>
                )}
              </div>
            </div>

            {/* Internal Notes Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Internal Notes</h4>
              <div className="bg-background border border-border-custom p-4 rounded-card space-y-3">
                <textarea 
                  placeholder="Type internal notes for dispatch or technicians here..."
                  disabled
                  rows={3}
                  className="w-full p-2.5 bg-surface border border-border-custom rounded-input text-xs text-text-muted leading-relaxed resize-none focus:outline-none cursor-not-allowed opacity-80"
                />
                <button
                  disabled
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-background border border-border-custom rounded-button text-xs font-semibold text-text-muted cursor-not-allowed opacity-75"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Save Internal Dispatch Note</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border-custom bg-background/50 flex items-center justify-between">
          <div className="text-xs text-text-secondary font-medium">
            Lead ID: <span className="font-semibold">{selectedLead.id.substring(0, 8)}...</span>
          </div>
          <button onClick={handleCloseWithAnimation} className="px-4 py-2 border border-border-custom hover:bg-border-custom text-sm font-semibold rounded-button transition-colors cursor-pointer">
            Close Drawer
          </button>
        </div>

      </div>

      {/* ==========================================
          FEATURE 2: SCHEDULE APPOINTMENT DIALOG MODAL
          ========================================== */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAppModal(false)} />
          <div className="relative bg-surface w-full max-w-md rounded-card border border-border-custom p-6 shadow-2xl space-y-4 animate-fade-in text-sm text-text-primary">
            
            <div className="flex items-center justify-between pb-3 border-b border-border-custom">
              <h3 className="font-bold text-base">Schedule Site Visit Appointment</h3>
              <button onClick={() => setShowAppModal(false)} className="p-1 rounded-button hover:bg-background cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form validated via RHF */}
            <form onSubmit={handleSubmitApp(onScheduleAppSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Appointment Date</label>
                  <input 
                    {...registerApp('date')}
                    type="date" 
                    className={`w-full px-3 py-2 bg-background border rounded-input text-xs ${
                      errorsApp.date ? 'border-danger-custom' : 'border-border-custom'
                    }`} 
                  />
                  {errorsApp.date && (
                    <p className="text-xs text-danger-custom font-semibold mt-1">{errorsApp.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Visit Time</label>
                  <input 
                    {...registerApp('time')}
                    type="time" 
                    className={`w-full px-3 py-2 bg-background border rounded-input text-xs ${
                      errorsApp.time ? 'border-danger-custom' : 'border-border-custom'
                    }`} 
                  />
                  {errorsApp.time && (
                    <p className="text-xs text-danger-custom font-semibold mt-1">{errorsApp.time.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Visit Type</label>
                <select 
                  {...registerApp('type')}
                  className="w-full px-3 py-2 bg-background border border-border-custom rounded-input text-xs cursor-pointer"
                >
                  <option value="Installation">Equipment Installation</option>
                  <option value="Repair">Emergency System Repair</option>
                  <option value="Maintenance">Annual Maintenance Tune-Up</option>
                  <option value="Diagnostic">Initial AI Ingested Diagnosis</option>
                </select>
                {errorsApp.type && (
                  <p className="text-xs text-danger-custom font-semibold mt-1">{errorsApp.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Internal Notes for Technicians</label>
                <textarea 
                  {...registerApp('notes')}
                  placeholder="Log details like gate codes, system brand, attic location..." 
                  rows={3} 
                  className={`w-full p-2.5 bg-background border rounded-input text-xs resize-none ${
                    errorsApp.notes ? 'border-danger-custom' : 'border-border-custom'
                  }`} 
                />
                {errorsApp.notes && (
                  <p className="text-xs text-danger-custom font-semibold mt-1">{errorsApp.notes.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-border-custom">
                <button type="button" onClick={() => setShowAppModal(false)} className="px-4 py-2 border border-border-custom hover:bg-background rounded-button text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingApp} className="px-4 py-2 bg-primary-custom text-white hover:bg-primary-hover rounded-button text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center space-x-1">
                  {isSubmittingApp && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Book Appointment</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}