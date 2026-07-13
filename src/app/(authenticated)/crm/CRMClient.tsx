/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  MapPin, Phone, Globe, Calendar, Sparkles, MoreHorizontal, Eye, UserCheck,
  CalendarCheck, CheckCircle2, AlertCircle, AlertTriangle,
  Loader2, Search, SlidersHorizontal, ArrowUpDown, Trash2, CheckSquare,
  Square, ShieldAlert, FolderOpen, X, GripVertical
} from 'lucide-react'
import { createClient } from '../../../lib/supabase/client'
import { updateLeadStatusDirectly, triggerLeadAction, bulkUpdateLeadStatus, bulkDeleteLeads } from '../dashboard/actions'
import LeadDetailsDrawer from '../../../components/dashboard/LeadDetailsDrawer' // ডিফল্ট ইম্পোর্ট ফিক্স করা হলো

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

interface CRMClientProps {
  initialLeads: Lead[]
}

export default function CRMClient({ initialLeads }: CRMClientProps) {
  const supabase = createClient()

  // Core CRM lists
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads)
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'score-desc' | 'score-asc' | 'priority'>('newest')

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

  // Confirmation dialog state
  const [confirmDeleteState, setConfirmDeleteState] = useState<{ visible: boolean; count: number }>({ visible: false, count: 0 })

  // Drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Supabase Realtime Sync
  useEffect(() => {
    const channel = supabase
      .channel('realtime-leads-crm-v3-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hvac_leads' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setLeadsList(prev => [payload.new as Lead, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setLeadsList(prev => prev.map(l => l.id === payload.new.id ? { ...l, ...payload.new } : l))
          } else if (payload.eventType === 'DELETE') {
            setLeadsList(prev => prev.filter(l => l.id === payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // ড্রপডাউন ইউনিক ফিল্টার লিস্ট জেনারেটর
  const uniqueCities = useMemo(() => Array.from(new Set(leadsList.map(l => l.city))), [leadsList])
  const uniqueSources = useMemo(() => Array.from(new Set(leadsList.map(l => l.source))), [leadsList])
  const uniqueServices = useMemo(() => Array.from(new Set(leadsList.map(l => l.service_type))), [leadsList])

  // সার্চ, ফিল্টার এবং সর্টিং মেকানিজম
  const processedLeads = useMemo(() => {
    const result = leadsList.filter((lead) => {
      const matchesSearch = 
        lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        lead.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.service_type.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter
      const matchesCity = cityFilter === 'all' || lead.city === cityFilter
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
      const matchesService = serviceFilter === 'all' || lead.service_type === serviceFilter

      return matchesSearch && matchesPriority && matchesCity && matchesSource && matchesService
    })

    // সর্টিং লজিক
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (sortOrder === 'score-desc') {
      result.sort((a, b) => b.lead_score - a.lead_score)
    } else if (sortOrder === 'score-asc') {
      result.sort((a, b) => a.lead_score - b.lead_score)
    } else if (sortOrder === 'priority') {
      const weight: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
      result.sort((a, b) => (weight[b.priority] || 0) - (weight[a.priority] || 0))
    }

    return result
  }, [leadsList, searchQuery, priorityFilter, cityFilter, sourceFilter, serviceFilter, sortOrder])

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, leadId: string, currentStatus: string) => {
    e.dataTransfer.setData('leadId', leadId)
    e.dataTransfer.setData('previousStatus', currentStatus)
    e.dataTransfer.effectAllowed = 'move'
    setActiveMenuId(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDraggedOverColumn(columnId)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: any) => {
    e.preventDefault()
    setDraggedOverColumn(null)
    
    const leadId = e.dataTransfer.getData('leadId')
    const previousStatus = e.dataTransfer.getData('previousStatus')

    if (previousStatus === newStatus || !leadId) return

    const backupList = [...leadsList]
    setLeadsList(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))

    const res = await updateLeadStatusDirectly(leadId, newStatus, previousStatus)
    if (!res.success) {
      setLeadsList(backupList)
      triggerToast(`Status update failed: ${res.error}`, 'error')
    }
  }

  // ১-ক্লিক কুইক অ্যাকশন বাটন হ্যান্ডলার
  const handleActionDirectly = async (lead: Lead, action: 'call' | 'contact' | 'schedule' | 'complete' | 'lost') => {
    setActiveMenuId(null)
    try {
      let res
      if (action === 'call') {
        res = await triggerLeadAction(lead.id, 'call')
      } else if (action === 'contact') {
        res = await triggerLeadAction(lead.id, 'contact')
      } else if (action === 'schedule') {
        res = await triggerLeadAction(lead.id, 'schedule')
      } else if (action === 'complete') {
        res = await triggerLeadAction(lead.id, 'complete')
      } else if (action === 'lost') {
        res = await updateLeadStatusDirectly(lead.id, 'LOST', lead.status)
      }

      if (res && res.success) {
        triggerToast(`Action completed successfully.`)
      } else {
        triggerToast(`Failed: ${res?.error || 'Unknown error'}`, 'error')
      }
    } catch {
      triggerToast('An error occurred.', 'error')
    }
  }

  // বাল্ক একশন লজিক
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkStatusChange = async (newStatus: any) => {
    if (selectedLeadIds.length === 0) return
    setBulkLoading(true)
    const res = await bulkUpdateLeadStatus(selectedLeadIds, newStatus)
    if (res.success) {
      triggerToast(`Successfully updated ${selectedLeadIds.length} leads.`)
      setSelectedLeadIds([])
    } else {
      triggerToast(`Bulk update failed: ${res.error}`, 'error')
    }
    setBulkLoading(false)
  }

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return
    setConfirmDeleteState({ visible: true, count: selectedLeadIds.length })
  }

  const executeBulkDelete = async () => {
    setConfirmDeleteState(prev => ({ ...prev, visible: false }))
    if (selectedLeadIds.length === 0) return
    setBulkLoading(true)
    const res = await bulkDeleteLeads(selectedLeadIds)
    if (res.success) {
      triggerToast('Selected leads deleted successfully.')
      setSelectedLeadIds([])
    } else {
      triggerToast(`Bulk delete failed: ${res.error}`, 'error')
    }
    setBulkLoading(false)
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-danger-custom/10 text-danger-custom border-danger-custom/20'
      case 'HIGH': return 'bg-warning-custom/10 text-warning-custom border-warning-custom/20'
      case 'MEDIUM': return 'bg-primary-custom/10 text-primary-custom border-primary-custom/20'
      default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    }
  }

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsPanelOpen(true)
  }

  const columnsList: { id: Lead['status']; name: string }[] = [
    { id: 'NEW', name: 'New Ingestion' },
    { id: 'CONTACTED', name: 'Contacted' },
    { id: 'SCHEDULED', name: 'Scheduled Visit' },
    { id: 'COMPLETED', name: 'Job Completed' },
    { id: 'LOST', name: 'Lost Deal' }
  ]

  return (
    <div className="space-y-5 relative">

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-xs font-medium shadow-2xl animate-fade-in ${
          toastType === 'error' ? 'bg-danger-custom text-white' : 'bg-text-primary text-background'
        }`}>
          {toastMsg}
        </div>
      )}

      {/* Header and Counters */}
      <div className="flex flex-col gap-4 pb-5 border-b border-border-custom">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">CRM Board</h1>
            <p className="text-sm text-text-secondary/80">Dispatcher kanban for pipeline management.</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border-custom rounded-card shadow-sm card-hover">
        <div className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">

            {/* Real-time search */}
            <div className="flex-1 flex items-center gap-2 bg-background border border-border-custom rounded-lg px-3 py-2 text-text-secondary focus-within:border-primary-custom/60 focus-within:ring-2 focus-within:ring-primary-custom/10 transition-all">
              <Search className="h-4 w-4 shrink-0 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, city..."
                className="bg-transparent border-none outline-none text-sm w-full text-text-primary placeholder:text-text-muted/60"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-0.5 text-text-muted hover:text-text-secondary cursor-pointer" aria-label="Clear search">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sorter */}
            <div className="flex items-center gap-2 bg-background border border-border-custom rounded-lg px-3 py-2 text-text-secondary">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-text-muted" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent border-none outline-none text-xs font-medium text-text-primary cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          {/* Dropdowns Row */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 pt-3 border-t border-border-custom/50">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary/70 font-medium mr-1 shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto min-h-11 sm:min-h-0 px-2.5 py-1.5 bg-background border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30"
            >
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full sm:w-auto min-h-11 sm:min-h-0 px-2.5 py-1.5 bg-background border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full sm:w-auto min-h-11 sm:min-h-0 px-2.5 py-1.5 bg-background border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30"
            >
              <option value="all">All Sources</option>
              {uniqueSources.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full sm:w-auto min-h-11 sm:min-h-0 px-2.5 py-1.5 bg-background border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30"
            >
              <option value="all">All Services</option>
              {uniqueServices.map(srv => (
                <option key={srv} value={srv}>{srv}</option>
              ))}
            </select>

            {/* Reset Filters */}
            {(priorityFilter !== 'all' || cityFilter !== 'all' || sourceFilter !== 'all' || serviceFilter !== 'all' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setPriorityFilter('all'); setCityFilter('all'); setSourceFilter('all'); setServiceFilter('all'); setSearchQuery('');
                }}
                className="text-xs font-medium text-primary-custom hover:text-primary-hover ml-auto cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board Layout */}
      {processedLeads.length > 0 ? (
        <div className="-mx-5 md:-mx-0 overflow-x-auto pb-4">
          <div className="grid grid-cols-5 gap-4 min-w-[900px] px-5 md:px-0 md:min-w-0">
          {columnsList.map((column) => {
            const columnLeads = processedLeads.filter(l => l.status === column.id)
            const isDraggedOver = draggedOverColumn === column.id

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragLeave={() => setDraggedOverColumn(null)}
                className={`flex flex-col bg-surface rounded-card border min-h-[500px] transition-all duration-200 ${
                  isDraggedOver
                    ? 'border-primary-custom/50 bg-primary-custom/[0.03] shadow-md ring-1 ring-primary-custom/10'
                    : 'border-border-custom'
                }`}
              >
                {/* Column Header */}
                <div className="sticky top-0 z-10 px-4 py-3 border-b border-border-custom bg-surface flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      column.id === 'NEW' ? 'bg-primary-custom' :
                      column.id === 'CONTACTED' ? 'bg-warning-custom' :
                      column.id === 'SCHEDULED' ? 'bg-info-custom' :
                      column.id === 'COMPLETED' ? 'bg-success-custom' : 'bg-text-secondary'
                    }`} />
                    <span className="text-sm font-semibold text-text-primary">{column.name}</span>
                  </div>
                  <span className={`inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-semibold leading-none px-1.5 ${
                    columnLeads.length > 0
                      ? 'bg-background text-text-secondary'
                      : 'bg-border-custom/30 text-text-muted'
                  }`}>
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Card Lists */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[580px] scrollbar-thin">
                  {columnLeads.length > 0 ? (
                    columnLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id)
                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id, column.id)}
                          className={`bg-background border rounded-card transition-all duration-150 group relative ${
                            isSelected
                              ? 'border-primary-custom ring-1 ring-primary-custom/20'
                              : 'border-border-custom hover:border-primary-custom/40 hover:shadow-sm'
                          } ${draggedOverColumn && !isDraggedOver ? 'opacity-60' : ''}`}
                        >
                          {/* Card Content */}
                          <div onClick={() => handleRowClick(lead)} className="p-3.5 cursor-pointer">
                            {/* Top row: Name + Score */}
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <span className="text-sm font-semibold text-text-primary group-hover:text-primary-custom transition-colors truncate">
                                {lead.customer_name}
                              </span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-primary-custom/8 text-primary-custom shrink-0 leading-none">
                                <Sparkles className="h-3 w-3" />
                                {lead.lead_score}
                              </span>
                            </div>

                            {/* Contact info */}
                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary/80">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                                <span>{lead.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary/80">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                                <span className="truncate">{lead.city}</span>
                              </div>
                            </div>

                            {/* Footer: Priority + Source + Date */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-border-custom/60">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border leading-none ${getPriorityBadgeClass(lead.priority)}`}>
                                {lead.priority}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                <span className="inline-flex items-center gap-1">
                                  <Globe className="h-2.5 w-2.5" />
                                  {lead.source || 'Website'}
                                </span>
                                <span className="text-border-custom">|</span>
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Action Bar (appears on hover) */}
                          <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSelectLead(lead.id); }}
                              className="p-1 rounded hover:bg-background/80 text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                              title={isSelected ? 'Deselect' : 'Select'}
                            >
                              {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-primary-custom" /> : <Square className="h-3.5 w-3.5" />}
                            </button>

                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenuId(activeMenuId === lead.id ? null : lead.id)
                                }}
                                className="p-1 rounded hover:bg-background/80 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                                title="Actions"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>

                              {activeMenuId === lead.id && (
                                <>
                                  <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                                  <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border-custom rounded-card shadow-lg z-30 py-1 overflow-hidden">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRowClick(lead); setActiveMenuId(null); }}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-background transition-colors cursor-pointer"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      View Details
                                    </button>
                                    <div className="border-t border-border-custom/50 my-1" />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'call'); setActiveMenuId(null); }}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-background transition-colors cursor-pointer"
                                    >
                                      <Phone className="h-3.5 w-3.5 text-primary-custom" />
                                      Call Customer
                                    </button>
                                    {lead.status === 'NEW' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'contact'); setActiveMenuId(null); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-background transition-colors cursor-pointer"
                                      >
                                        <UserCheck className="h-3.5 w-3.5 text-warning-custom" />
                                        Mark Contacted
                                      </button>
                                    )}
                                    {(lead.status === 'NEW' || lead.status === 'CONTACTED') && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'schedule'); setActiveMenuId(null); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-background transition-colors cursor-pointer"
                                      >
                                        <CalendarCheck className="h-3.5 w-3.5 text-info-custom" />
                                        Schedule Visit
                                      </button>
                                    )}
                                    {lead.status === 'SCHEDULED' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'complete'); setActiveMenuId(null); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-background transition-colors cursor-pointer"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-success-custom" />
                                        Mark Completed
                                      </button>
                                    )}
                                    <div className="border-t border-border-custom/50 my-1" />
                                    {lead.status !== 'COMPLETED' && lead.status !== 'LOST' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'lost'); setActiveMenuId(null); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-danger-custom hover:bg-danger-custom/5 transition-colors cursor-pointer"
                                      >
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        Mark Lost
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border-custom/30 rounded-card py-10 px-4 text-center select-none min-h-[120px]">
                      <div className="h-8 w-8 rounded-lg border border-border-custom/30 flex items-center justify-center text-text-muted/40 mb-2">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-text-muted/50 font-medium">Drop lead here</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      ) : (
        /* Empty State Layout */
        <div className="bg-surface rounded-card border border-border-custom shadow-sm flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="h-12 w-12 rounded-xl border border-border-custom/50 flex items-center justify-center text-text-muted mb-4">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">No leads found</h3>
          <p className="text-xs text-text-secondary/70 max-w-sm leading-relaxed mb-4">
            {(priorityFilter !== 'all' || cityFilter !== 'all' || sourceFilter !== 'all' || serviceFilter !== 'all' || searchQuery !== '')
              ? 'No leads match your current filters. Try adjusting them.'
              : 'Leads will appear here once they are received from the ingestion workflow.'}
          </p>
          {(priorityFilter !== 'all' || cityFilter !== 'all' || sourceFilter !== 'all' || serviceFilter !== 'all' || searchQuery !== '') && (
            <button
              onClick={() => {
                setPriorityFilter('all'); setCityFilter('all'); setSourceFilter('all'); setServiceFilter('all'); setSearchQuery('');
              }}
              className="px-4 py-2 bg-primary-custom hover:bg-primary-hover text-xs font-medium text-white rounded-lg transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* CRM Bulk Operations Floating Toolbar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border-custom shadow-xl rounded-xl p-3 z-40 flex items-center gap-4 animate-fade-in text-sm max-w-lg w-full justify-between">
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
                className="px-4 py-2 bg-danger-custom text-white hover:bg-danger-custom/90 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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