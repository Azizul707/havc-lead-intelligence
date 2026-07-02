/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  Download, Search, Globe, ArrowUpDown,
  SlidersHorizontal, CheckSquare, Square, Trash2, ShieldAlert, FolderOpen, Loader2,
  ChevronLeft, ChevronRight, AlertTriangle, X
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { bulkUpdateLeadStatus, bulkDeleteLeads } from '../dashboard/actions'
import LeadDetailsDrawer from '../../../components/dashboard/LeadDetailsDrawer'

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

interface LeadsClientProps {
  initialLeads: Lead[]
  totalCount: number
  currentPage: number
  pageSize: number
  totalPages: number
  initialSearch: string
  initialPriority: string
  initialCity: string
  initialSource: string
  initialService: string
  initialSort: string
  uniqueCities: string[]
  uniqueSources: string[]
  uniqueServices: string[]
  sortOrder: string
}

export default function LeadsClient({
  initialLeads,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  initialSearch,
  initialPriority,
  initialCity,
  initialSource,
  initialService,
  initialSort,
  uniqueCities,
  uniqueSources,
  uniqueServices,
  sortOrder: _sortOrder
}: LeadsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Local search input for immediate feedback; debounced navigation
  const [localSearch, setLocalSearch] = useState(initialSearch)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Bulk operation state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Details drawer state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

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

  // Debounced search navigation
  const navigateWithFilters = useCallback((overrides: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString())
    // Set overrides, reset to page 1
    Object.entries(overrides).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== 'newest') {
        sp.set(k, v)
      } else {
        sp.delete(k)
      }
    })
    sp.set('page', '1')
    const qs = sp.toString()
    router.push(qs ? `/leads?${qs}` : '/leads')
  }, [router, searchParams])

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigateWithFilters({ search: value, page: '1' })
    }, 400)
  }

  const handleFilterChange = (key: string, value: string) => {
    navigateWithFilters({ [key]: value, page: '1' })
  }

  const handleSortChange = (value: string) => {
    navigateWithFilters({ sort: value === 'newest' ? '' : value, page: '1' })
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return
    const sp = new URLSearchParams(searchParams.toString())
    if (page > 1) sp.set('page', String(page))
    else sp.delete('page')
    const qs = sp.toString()
    router.push(qs ? `/leads?${qs}` : '/leads')
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Supabase Realtime Sync (only for current page data effect — insert/update still update optimistically)
  useEffect(() => {
    const channel = supabase
      .channel('realtime-leads-paginated')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hvac_leads' },
        () => {
          // On any change, invalidate — but we keep current data stable
          // User can refresh or paginate to see updates
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // Priority sort lives client-side since Supabase can't sort by custom weight
  const processedLeads = useMemo(() => {
    if (_sortOrder !== 'priority') return initialLeads
    const weight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    return [...initialLeads].sort((a, b) => (weight[b.priority] || 0) - (weight[a.priority] || 0))
  }, [initialLeads, _sortOrder])

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Customer,Source,Phone,Email,City,Service Type,Priority,Lead Score,Status,Created At\n']
    const leadsToExport = selectedLeadIds.length > 0
      ? processedLeads.filter(l => selectedLeadIds.includes(l.id))
      : processedLeads

    const rows = leadsToExport.map(l =>
      `"${l.customer_name}","${l.source || 'Website'}","${l.phone}","${l.email || ''}","${l.city}","${l.service_type}","${l.priority}",${l.lead_score},"${l.status}","${new Date(l.created_at).toLocaleDateString()}"`
    )
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows.join('\n')).join('')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `hvac_leads_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Bulk actions
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAllLeads = () => {
    if (selectedLeadIds.length === processedLeads.length) {
      setSelectedLeadIds([])
    } else {
      setSelectedLeadIds(processedLeads.map(l => l.id))
    }
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-primary-custom/10 text-primary-custom border-primary-custom/20'
      case 'CONTACTED': return 'bg-warning-custom/10 text-warning-custom border-warning-custom/20'
      case 'SCHEDULED': return 'bg-info-custom/10 text-info-custom border-info-custom/20'
      case 'COMPLETED': return 'bg-success-custom/10 text-success-custom border-success-custom/20'
      default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    }
  }

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsPanelOpen(true)
  }

  // Pagination controls
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="space-y-5 relative">

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-xs font-medium shadow-2xl animate-fade-in ${
          toastType === 'error' ? 'bg-danger-custom text-white' : 'bg-text-primary text-background'
        }`}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 pb-5 border-b border-border-custom">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Leads</h1>
            <p className="text-sm text-text-secondary/80">Manage pipeline routing and customer dispatch jobs.</p>
          </div>
        </div>
      </div>

      {/* Advanced Filter and Search Bar */}
      <div className="bg-surface border border-border-custom rounded-card shadow-sm card-hover">
        <div className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">

            {/* Live Search */}
            <div className="flex-1 flex items-center gap-2 bg-background border border-border-custom rounded-lg px-3 py-2 text-text-secondary focus-within:border-primary-custom/60 focus-within:ring-2 focus-within:ring-primary-custom/10 transition-all">
              <Search className="h-4 w-4 shrink-0 text-text-muted" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, phone, city..."
                aria-label="Search leads"
                className="bg-transparent border-none outline-none text-sm w-full text-text-primary placeholder:text-text-muted/60"
              />
              {localSearch && (
                <button onClick={() => { setLocalSearch(''); handleSearchChange('') }} className="p-0.5 text-text-muted hover:text-text-secondary cursor-pointer" aria-label="Clear search">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sorter */}
            <div className="flex items-center gap-2 bg-background border border-border-custom rounded-lg px-3 py-2 text-text-secondary">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-text-muted" />
              <select
                value={initialSort === 'newest' && !searchParams.get('sort') ? 'newest' : initialSort}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Sort leads"
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

          {/* Dropdown Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 pt-3 border-t border-border-custom/50">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary/70 font-medium shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </div>

            <select
              value={initialPriority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              aria-label="Filter by priority"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-2 py-1.5 bg-background border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30"
            >
              <option value="all">Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={initialCity}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              aria-label="Filter by city"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-2 py-1.5 bg-background border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30"
            >
              <option value="all">City</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select
              value={initialSource}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              aria-label="Filter by source"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-2 py-1.5 bg-background border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30"
            >
              <option value="all">Source</option>
              {uniqueSources.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>

            <select
              value={initialService}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              aria-label="Filter by service type"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-2 py-1.5 bg-background border border-border-custom rounded-lg text-xs font-medium text-text-primary cursor-pointer hover:border-text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-custom/30"
            >
              <option value="all">Service</option>
              {uniqueServices.map(srv => (
                <option key={srv} value={srv}>{srv}</option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              aria-label="Export selected leads as CSV"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-border-custom rounded-lg bg-background text-xs font-medium text-text-primary hover:bg-border-custom/60 transition-colors cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results info */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-text-secondary/70 font-medium px-1">
          <span>{startItem}–{endItem} of {totalCount} leads</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      )}

      {/* Leads Table */}
      {processedLeads.length > 0 ? (
        <div className="bg-surface rounded-card border border-border-custom shadow-sm card-hover overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table" aria-label="Leads table">
              <thead>
                <tr className="border-b border-border-custom bg-background/40 sticky top-0 z-10">
                  <th className="px-5 py-3 w-10 text-center" scope="col">
                    <button
                      onClick={toggleSelectAllLeads}
                      aria-label={selectedLeadIds.length === processedLeads.length ? 'Deselect all leads' : 'Select all leads'}
                      className="p-1 rounded hover:bg-background text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                    >
                      {selectedLeadIds.length === processedLeads.length ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary-custom" />
                      ) : (
                        <Square className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider" scope="col">Customer</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider" scope="col">Source</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider" scope="col">Phone</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider" scope="col">City</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider" scope="col">Service</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider" scope="col">Priority</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider" scope="col">Score</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider" scope="col">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/60">
                {processedLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id)
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleRowClick(lead)}
                      className={`hover:bg-background/40 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-primary-custom/[0.02]' : ''
                      }`}
                      role="row"
                    >
                      <td className="px-5 py-3.5 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelectLead(lead.id)}
                          aria-label={isSelected ? `Deselect ${lead.customer_name}` : `Select ${lead.customer_name}`}
                          className="p-1 rounded hover:bg-background text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                        >
                          {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-primary-custom" /> : <Square className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-text-primary group-hover:text-primary-custom transition-colors">
                          {lead.customer_name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary/80 bg-background/60 px-2.5 py-1 rounded-md border border-border-custom/60">
                          <Globe className="h-3 w-3 text-text-muted" />
                          {lead.source || 'Website'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary/80">{lead.phone}</td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary/80">{lead.city}</td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary/80 truncate max-w-28">{lead.service_type}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border leading-none ${getPriorityBadgeClass(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-text-primary">{lead.lead_score}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border leading-none ${getStatusBadgeClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-3 sm:px-5 py-3 border-t border-border-custom bg-background/30 flex items-center justify-between gap-1.5 sm:gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border border-border-custom rounded-lg text-xs font-medium text-text-secondary hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }
                const isFirstOrLast = pageNum === 1 || pageNum === totalPages
                const isNearCurrent = Math.abs(pageNum - currentPage) <= 1
                const showOnMobile = isFirstOrLast || isNearCurrent
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={pageNum === currentPage ? 'page' : undefined}
                    className={`${showOnMobile ? 'inline-flex' : 'hidden sm:inline-flex'} min-w-[26px] sm:min-w-[30px] px-1 sm:px-2 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer items-center justify-center shrink-0 ${
                      pageNum === currentPage
                        ? 'bg-primary-custom/10 text-primary-custom font-semibold'
                        : 'text-text-secondary hover:bg-background'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border border-border-custom rounded-lg text-xs font-medium text-text-secondary hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-surface rounded-card border border-border-custom shadow-sm flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="h-12 w-12 rounded-xl border border-border-custom/50 flex items-center justify-center text-text-muted mb-4">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            {initialSearch || initialPriority !== 'all' || initialCity !== 'all' || initialSource !== 'all' || initialService !== 'all'
              ? 'No leads match your filters'
              : 'No leads ingested'}
          </h3>
          <p className="text-xs text-text-secondary/70 max-w-sm leading-relaxed mb-4">
            {(initialSearch || initialPriority !== 'all' || initialCity !== 'all' || initialSource !== 'all' || initialService !== 'all')
              ? 'Try adjusting your search terms or clearing the active filters.'
              : 'Leads will appear here once received from the ingestion workflow.'}
          </p>
          {(initialSearch || initialPriority !== 'all' || initialCity !== 'all' || initialSource !== 'all' || initialService !== 'all') && (
            <button
              onClick={() => router.push('/leads')}
              className="px-4 py-2 bg-primary-custom hover:bg-primary-hover text-xs font-medium text-white rounded-lg transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* CRM Bulk Operations Floating Toolbar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 bg-surface border-t sm:border border-border-custom shadow-xl sm:rounded-xl p-3 z-40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 animate-fade-in text-sm sm:max-w-lg w-full">
          <div className="flex items-center justify-between sm:justify-start gap-2 px-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary-custom" />
              <span className="text-xs font-medium text-text-secondary">{selectedLeadIds.length} selected</span>
            </div>
            {bulkLoading && <Loader2 className="animate-spin h-4 w-4 text-primary-custom ml-auto" />}
          </div>

          {!bulkLoading && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleBulkStatusChange('CONTACTED')}
                className="flex-1 sm:flex-none px-2.5 py-2 sm:py-1.5 bg-warning-custom/8 text-warning-custom rounded-lg text-xs font-semibold hover:bg-warning-custom/15 transition-colors cursor-pointer text-center"
                aria-label="Mark selected as contacted"
              >
                Contacted
              </button>
              <button
                onClick={() => handleBulkStatusChange('COMPLETED')}
                className="flex-1 sm:flex-none px-2.5 py-2 sm:py-1.5 bg-success-custom/8 text-success-custom rounded-lg text-xs font-semibold hover:bg-success-custom/15 transition-colors cursor-pointer text-center"
                aria-label="Mark selected as completed"
              >
                Complete
              </button>
              <button
                onClick={() => handleBulkStatusChange('LOST')}
                className="flex-1 sm:flex-none px-2.5 py-2 sm:py-1.5 bg-text-secondary/8 text-text-secondary rounded-lg text-xs font-semibold hover:bg-text-secondary/15 transition-colors cursor-pointer text-center"
                aria-label="Mark selected as lost"
              >
                Lost
              </button>
              <button
                onClick={handleBulkDelete}
                className="p-2 sm:p-1.5 bg-danger-custom/8 text-danger-custom rounded-lg hover:bg-danger-custom/15 transition-colors cursor-pointer"
                aria-label="Delete selected leads"
              >
                <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
          )}
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

      {/* Lead Details Drawer */}
      {isPanelOpen && selectedLead && (
        <LeadDetailsDrawer
          selectedLead={selectedLead}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          onStatusUpdated={(newStatus) => {
            setSelectedLead({ ...selectedLead, status: newStatus })
          }}
        />
      )}

    </div>
  )
}
