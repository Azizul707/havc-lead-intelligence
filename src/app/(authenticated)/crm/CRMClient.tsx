/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  MapPin, Phone, Globe, Calendar, Sparkles, MoreHorizontal, Eye, UserCheck, 
  CalendarCheck, CheckCircle2, AlertCircle, X, Clock3, ArrowRight, 
  Loader2, FileText, Search, SlidersHorizontal, ArrowUpDown, Trash2, CheckSquare, 
  Square, ShieldAlert, FolderOpen, PlusCircle, Activity
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
  }, [])

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
      alert(`Status update failed: ${res.error}`)
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
        alert(`Action completed successfully.`)
      } else {
        alert(`Failed: ${res?.error || 'Unknown error'}`)
      }
    } catch {
      alert('An error occurred.')
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
      alert(`Successfully updated ${selectedLeadIds.length} leads.`)
      setSelectedLeadIds([])
    } else {
      alert(`Bulk update failed: ${res.error}`)
    }
    setBulkLoading(false)
  }

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return
    if (!confirm(`Are you absolutely sure you want to delete ${selectedLeadIds.length} selected leads?`)) return
    setBulkLoading(true)
    const res = await bulkDeleteLeads(selectedLeadIds)
    if (res.success) {
      alert('Selected leads deleted successfully.')
      setSelectedLeadIds([])
    } else {
      alert(`Bulk delete failed: ${res.error}`)
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
    <div className="space-y-6 relative">
      
      {/* Header and Counters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border-custom">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">CRM Operations Board</h1>
          <p className="text-sm text-text-secondary mt-1">Dispatcher command center for field lead status management.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border-custom rounded-card p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Real-time search */}
          <div className="flex-1 flex items-center space-x-2 bg-background border border-border-custom rounded-input px-3 py-2 text-text-secondary focus-within:border-primary-custom">
            <Search className="h-4 w-4" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, city..." 
              className="bg-transparent border-none outline-none text-sm w-full text-text-primary"
            />
          </div>

          {/* Sorter */}
          <div className="flex items-center space-x-2 bg-background border border-border-custom rounded-input px-3 py-2 text-text-secondary">
            <ArrowUpDown className="h-4 w-4" />
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent border-none outline-none text-xs font-semibold text-text-primary cursor-pointer"
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
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border-custom/50 text-xs">
          <span className="text-text-secondary font-bold flex items-center space-x-1.5 shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </span>

          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border-custom rounded-input font-medium cursor-pointer"
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
            className="px-2.5 py-1.5 bg-background border border-border-custom rounded-input font-medium cursor-pointer"
          >
            <option value="all">All Cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select 
            value={sourceFilter} 
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border-custom rounded-input font-medium cursor-pointer"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>

          <select 
            value={serviceFilter} 
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border-custom rounded-input font-medium cursor-pointer"
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
              className="text-primary-custom hover:underline font-bold ml-auto cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Layout */}
      {processedLeads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 overflow-x-auto pb-4 min-w-[1000px] md:min-w-0">
          {columnsList.map((column) => {
            const columnLeads = processedLeads.filter(l => l.status === column.id)
            const isDraggedOver = draggedOverColumn === column.id

            return (
              <div 
                key={column.id} 
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragLeave={() => setDraggedOverColumn(null)}
                className={`flex flex-col bg-surface rounded-card border p-4 min-h-[550px] transition-colors ${
                  isDraggedOver ? 'border-primary-custom bg-primary-custom/5 shadow-md' : 'border-border-custom'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-custom">
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      column.id === 'NEW' ? 'bg-primary-custom' :
                      column.id === 'CONTACTED' ? 'bg-warning-custom' :
                      column.id === 'SCHEDULED' ? 'bg-info-custom' :
                      column.id === 'COMPLETED' ? 'bg-success-custom' : 'bg-text-secondary'
                    }`} />
                    <span className="text-sm font-bold text-text-primary">{column.name}</span>
                  </div>
                  <span className="text-xs font-bold text-text-secondary bg-background px-2 py-0.5 rounded-full">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Card Lists */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {columnLeads.length > 0 ? (
                    columnLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id)
                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id, column.id)}
                          className={`bg-background border p-4 rounded-card shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative ${
                            isSelected ? 'border-primary-custom bg-primary-custom/[0.02]' : 'border-border-custom hover:border-primary-custom'
                          }`}
                        >
                          {/* Top Card Controls */}
                          <div className="absolute right-3 top-3 z-10 flex items-center space-x-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleSelectLead(lead.id); }}
                              className="p-1 hover:bg-background rounded-button text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                            >
                              {isSelected ? <CheckSquare className="h-4 w-4 text-primary-custom" /> : <Square className="h-4 w-4" />}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuId(activeMenuId === lead.id ? null : lead.id)
                              }}
                              className="p-1 hover:bg-background rounded-button text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {activeMenuId === lead.id && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                                <div className="absolute right-0 mt-6 w-44 bg-surface border border-border-custom rounded-button shadow-lg z-30 py-1 text-xs font-semibold text-text-primary">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRowClick(lead); setActiveMenuId(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-background flex items-center space-x-2.5 cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'call'); setActiveMenuId(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-background flex items-center space-x-2.5 cursor-pointer"
                                  >
                                    <Phone className="h-3.5 w-3.5 text-primary-custom" />
                                    <span>Call Customer</span>
                                  </button>
                                  {lead.status === 'NEW' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'contact'); setActiveMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-background flex items-center space-x-2.5 cursor-pointer"
                                    >
                                      <UserCheck className="h-3.5 w-3.5 text-warning-custom" />
                                      <span>Mark Contacted</span>
                                    </button>
                                  )}
                                  {(lead.status === 'NEW' || lead.status === 'CONTACTED') && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'schedule'); setActiveMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-background flex items-center space-x-2.5 cursor-pointer"
                                    >
                                      <CalendarCheck className="h-3.5 w-3.5 text-info-custom" />
                                      <span>Schedule Visit</span>
                                    </button>
                                  )}
                                  {lead.status === 'SCHEDULED' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'complete'); setActiveMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-background flex items-center space-x-2.5 cursor-pointer"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 text-success-custom" />
                                      <span>Mark Completed</span>
                                    </button>
                                  )}
                                  {lead.status !== 'COMPLETED' && lead.status !== 'LOST' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleActionDirectly(lead, 'lost'); setActiveMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-background text-danger-custom flex items-center space-x-2.5 cursor-pointer"
                                    >
                                      <AlertCircle className="h-3.5 w-3.5" />
                                      <span>Mark Lost</span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Card Content Body */}
                          <div onClick={() => handleRowClick(lead)} className="space-y-2 cursor-pointer">
                            <div className="flex items-start justify-between gap-2 pr-12">
                              <span className="text-sm font-bold text-text-primary group-hover:text-primary-custom transition-colors truncate">
                                {lead.customer_name}
                              </span>
                              <span className="text-xs font-bold text-primary-custom bg-primary-custom/10 px-1.5 py-0.5 rounded-md shrink-0 flex items-center space-x-0.5">
                                <Sparkles className="h-3 w-3" />
                                <span>{lead.lead_score}</span>
                              </span>
                            </div>

                            <div className="flex flex-col space-y-1.5 text-xs text-text-secondary">
                              <div className="flex items-center space-x-1.5">
                                <Phone className="h-3.5 w-3.5 text-text-muted" />
                                <span>{lead.phone}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <MapPin className="h-3.5 w-3.5 text-text-muted" />
                                <span className="truncate">{lead.city} ({lead.service_type})</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border-custom">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(lead.priority)}`}>
                                {lead.priority}
                              </span>
                              <span className="inline-flex items-center space-x-1 text-[9px] font-semibold text-text-secondary bg-surface px-2 py-0.5 rounded-full border border-border-custom">
                                <Globe className="h-2.5 w-2.5 text-text-muted" />
                                <span>{lead.source || 'Website'}</span>
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 mt-2 text-[10px] text-text-muted">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-border-custom/40 rounded-card p-6 text-center text-text-secondary/60 text-xs font-semibold py-12 select-none">
                      Drop lead here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State Layout */
        <div className="bg-surface rounded-card border border-border-custom shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-3 py-16">
          <div className="h-12 w-12 rounded-full bg-border-custom/30 flex items-center justify-center text-text-secondary">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary">No Operations Found</h3>
          <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
            There are no qualified HVAC leads matching the search term or dropdown filter configurations. Try resetting them above.
          </p>
          {(priorityFilter !== 'all' || cityFilter !== 'all' || sourceFilter !== 'all' || serviceFilter !== 'all' || searchQuery !== '') && (
            <button
              onClick={() => {
                setPriorityFilter('all'); setCityFilter('all'); setSourceFilter('all'); setServiceFilter('all'); setSearchQuery('');
              }}
              className="px-4 py-2 bg-primary-custom hover:bg-primary-hover text-xs font-semibold text-white rounded-button transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* CRM Bulk Operations Floating Toolbar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border-2 border-primary-custom rounded-card shadow-2xl p-4 z-40 flex items-center space-x-4 animate-fade-in text-sm font-semibold max-w-lg w-full justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-primary-custom" />
            <span>{selectedLeadIds.length} Selected</span>
          </div>

          <div className="flex items-center space-x-2">
            {bulkLoading ? (
              <Loader2 className="animate-spin h-5 w-5 text-primary-custom" />
            ) : (
              <>
                <button 
                  onClick={() => handleBulkStatusChange('CONTACTED')}
                  className="px-2.5 py-1.5 bg-warning-custom/10 text-warning-custom border border-warning-custom/25 rounded-button text-xs font-bold hover:bg-warning-custom/20 cursor-pointer"
                >
                  Contacted
                </button>
                <button 
                  onClick={() => handleBulkStatusChange('COMPLETED')}
                  className="px-2.5 py-1.5 bg-success-custom/10 text-success-custom border border-success-custom/25 rounded-button text-xs font-bold hover:bg-success-custom/20 cursor-pointer"
                >
                  Complete
                </button>
                <button 
                  onClick={() => handleBulkStatusChange('LOST')}
                  className="px-2.5 py-1.5 bg-text-secondary/10 text-text-secondary border border-border-custom rounded-button text-xs font-bold hover:bg-background cursor-pointer"
                >
                  Lost
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="p-1.5 bg-danger-custom/10 text-danger-custom border border-danger-custom/25 rounded-button hover:bg-danger-custom/20 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
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