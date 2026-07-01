/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  Download, Search, Globe, ArrowUpDown,
  SlidersHorizontal, CheckSquare, Square, Trash2, ShieldAlert, FolderOpen, Loader2,
  ChevronLeft, ChevronRight, AlertTriangle
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
      case 'NEW': return 'bg-primary-custom/10 text-primary-custom'
      case 'CONTACTED': return 'bg-warning-custom/10 text-warning-custom font-semibold'
      case 'SCHEDULED': return 'bg-info-custom/10 text-info-custom'
      case 'COMPLETED': return 'bg-success-custom/10 text-success-custom'
      default: return 'bg-text-secondary/10 text-text-secondary'
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
    <div className="space-y-6 relative">

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-button text-xs font-semibold shadow-2xl animate-fade-in ${
          toastType === 'error' ? 'bg-danger-custom text-white' : 'bg-text-primary text-background'
        }`}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border-custom">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">CRM Leads Dispatch Console</h1>
          <p className="text-sm text-text-secondary mt-1">Manage pipeline routing and customer dispatch jobs.</p>
        </div>
      </div>

      {/* Advanced Filter and Search Bar */}
      <div className="bg-surface border border-border-custom rounded-card p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">

          {/* Live Search */}
          <div className="flex-1 flex items-center space-x-2 bg-background border border-border-custom rounded-input px-3 py-2 text-text-secondary focus-within:border-primary-custom">
            <Search className="h-4 w-4" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by customer name, phone, city..."
              aria-label="Search leads"
              className="bg-transparent border-none outline-none text-sm w-full text-text-primary"
            />
          </div>

          {/* Sorter */}
          <div className="flex items-center space-x-2 bg-background border border-border-custom rounded-input px-3 py-2 text-text-secondary">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={initialSort === 'newest' && !searchParams.get('sort') ? 'newest' : initialSort}
              onChange={(e) => handleSortChange(e.target.value)}
              aria-label="Sort leads"
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

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border-custom/50 text-xs">
          <span className="text-text-secondary font-bold flex items-center space-x-1.5 shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </span>

          <select
            value={initialPriority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            aria-label="Filter by priority"
            className="px-2.5 py-1.5 bg-background border border-border-custom rounded-input font-medium cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            value={initialCity}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            aria-label="Filter by city"
            className="px-2.5 py-1.5 bg-background border border-border-custom rounded-input font-medium cursor-pointer"
          >
            <option value="all">All Cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={initialSource}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            aria-label="Filter by source"
            className="px-2.5 py-1.5 bg-background border border-border-custom rounded-input font-medium cursor-pointer"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>

          <select
            value={initialService}
            onChange={(e) => handleFilterChange('service', e.target.value)}
            aria-label="Filter by service type"
            className="px-2.5 py-1.5 bg-background border border-border-custom rounded-input font-medium cursor-pointer"
          >
            <option value="all">All Services</option>
            {uniqueServices.map(srv => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            aria-label="Export selected leads as CSV"
            className="flex items-center justify-center space-x-2 px-3 py-1.5 border border-border-custom rounded-button bg-background text-xs font-bold text-text-primary hover:bg-border-custom transition-colors ml-auto cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Results info */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between text-xs text-text-secondary font-medium px-1">
          <span>Showing {startItem}–{endItem} of {totalCount} leads</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      )}

      {/* Leads Table */}
      {processedLeads.length > 0 ? (
        <div className="bg-surface rounded-card border border-border-custom shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table" aria-label="Leads table">
              <thead>
                <tr className="border-b border-border-custom bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="px-6 py-4 w-12 text-center" scope="col">
                    <button
                      onClick={toggleSelectAllLeads}
                      aria-label={selectedLeadIds.length === processedLeads.length ? 'Deselect all leads' : 'Select all leads'}
                      className="p-1 hover:bg-background rounded-button text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                    >
                      {selectedLeadIds.length === processedLeads.length ? (
                        <CheckSquare className="h-4 w-4 text-primary-custom" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4" scope="col">Customer</th>
                  <th className="px-6 py-4" scope="col">Source</th>
                  <th className="px-6 py-4" scope="col">Phone</th>
                  <th className="px-6 py-4" scope="col">City</th>
                  <th className="px-6 py-4" scope="col">Service</th>
                  <th className="px-6 py-4" scope="col">Priority</th>
                  <th className="px-6 py-4" scope="col">Lead Score</th>
                  <th className="px-6 py-4" scope="col">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom text-sm">
                {processedLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id)
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleRowClick(lead)}
                      className={`hover:bg-background/80 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-primary-custom/[0.01]' : ''
                      }`}
                      role="row"
                    >
                      <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelectLead(lead.id)}
                          aria-label={isSelected ? `Deselect ${lead.customer_name}` : `Select ${lead.customer_name}`}
                          className="p-1 hover:bg-background rounded-button text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                        >
                          {isSelected ? <CheckSquare className="h-4 w-4 text-primary-custom" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-semibold text-text-primary group-hover:text-primary-custom transition-colors">
                        {lead.customer_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1 text-xs font-medium text-text-secondary bg-background px-2.5 py-1 rounded-full border border-border-custom">
                          <Globe className="h-3 w-3 text-text-muted" />
                          <span>{lead.source || 'Website'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{lead.phone}</td>
                      <td className="px-6 py-4 text-text-secondary">{lead.city}</td>
                      <td className="px-6 py-4 text-text-secondary truncate max-w-32">{lead.service_type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{lead.lead_score}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(lead.status)}`}>
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
          <div className="px-6 py-4 border-t border-border-custom bg-background/30 flex items-center justify-between">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className="flex items-center space-x-1 px-3 py-1.5 border border-border-custom rounded-button text-xs font-semibold text-text-secondary hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1.5">
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
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={pageNum === currentPage ? 'page' : undefined}
                    className={`min-w-[32px] px-2 py-1.5 text-xs font-semibold rounded-button transition-colors cursor-pointer ${
                      pageNum === currentPage
                        ? 'bg-primary-custom text-white'
                        : 'text-text-secondary hover:bg-background border border-border-custom'
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
              className="flex items-center space-x-1 px-3 py-1.5 border border-border-custom rounded-button text-xs font-semibold text-text-secondary hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-surface rounded-card border border-border-custom shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-3 py-16">
          <div className="h-12 w-12 rounded-full bg-border-custom/30 flex items-center justify-center text-text-secondary">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary">
            {initialSearch || initialPriority !== 'all' || initialCity !== 'all' || initialSource !== 'all' || initialService !== 'all'
              ? 'No Leads Match Your Filters'
              : 'No Leads Ingested'}
          </h3>
          <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
            {(initialSearch || initialPriority !== 'all' || initialCity !== 'all' || initialSource !== 'all' || initialService !== 'all')
              ? 'Try adjusting your search terms or clearing filters.'
              : 'Leads will appear here once they are received from the ingestion workflow.'}
          </p>
          {(initialSearch || initialPriority !== 'all' || initialCity !== 'all' || initialSource !== 'all' || initialService !== 'all') && (
            <button
              onClick={() => router.push('/leads')}
              className="px-4 py-2 bg-primary-custom hover:bg-primary-hover text-xs font-semibold text-white rounded-button transition-colors cursor-pointer"
            >
              Clear All Filters
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
                  aria-label="Mark selected as contacted"
                >
                  Contacted
                </button>
                <button
                  onClick={() => handleBulkStatusChange('COMPLETED')}
                  className="px-2.5 py-1.5 bg-success-custom/10 text-success-custom border border-success-custom/25 rounded-button text-xs font-bold hover:bg-success-custom/20 cursor-pointer"
                  aria-label="Mark selected as completed"
                >
                  Complete
                </button>
                <button
                  onClick={() => handleBulkStatusChange('LOST')}
                  className="px-2.5 py-1.5 bg-text-secondary/10 text-text-secondary border border-border-custom rounded-button text-xs font-bold hover:bg-background cursor-pointer"
                  aria-label="Mark selected as lost"
                >
                  Lost
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="p-1.5 bg-danger-custom/10 text-danger-custom border border-danger-custom/25 rounded-button hover:bg-danger-custom/20 cursor-pointer"
                  aria-label="Delete selected leads"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Bulk Delete */}
      {confirmDeleteState.visible && (
        <div className="fixed inset-0 z-[60] overflow-hidden flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setConfirmDeleteState(prev => ({ ...prev, visible: false }))} />
          <div className="relative bg-surface w-full max-w-sm rounded-card border border-border-custom p-6 shadow-2xl space-y-4 animate-fade-in text-sm text-text-primary">
            <div className="flex items-center space-x-3 pb-3 border-b border-border-custom">
              <div className="h-8 w-8 rounded-full bg-warning-custom/10 flex items-center justify-center text-warning-custom">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm">Delete Leads</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to delete {confirmDeleteState.count} selected leads? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteState(prev => ({ ...prev, visible: false }))}
                className="px-4 py-2 border border-border-custom hover:bg-background rounded-button text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkDelete}
                className="px-4 py-2 bg-danger-custom text-white hover:bg-danger-custom/80 rounded-button text-xs font-semibold cursor-pointer flex items-center space-x-1"
              >
                <span>Delete</span>
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
