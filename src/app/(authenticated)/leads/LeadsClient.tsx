/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { 
  ListFilter, KanbanSquare, Download, Search, MapPin, Globe, ArrowUpDown, 
  SlidersHorizontal, CheckSquare, Square, Trash2, ShieldAlert, FolderOpen, Loader2 // Loader2 ইম্পোর্টে যুক্ত করা হলো
} from 'lucide-react'
import { createClient } from '../../../lib/supabase/client'
import { updateLeadStatusDirectly, bulkUpdateLeadStatus, bulkDeleteLeads } from '../dashboard/actions'
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
}

export default function LeadsClient({ initialLeads }: LeadsClientProps) {
  const supabase = createClient()

  // Core list state
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads)

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'score-desc' | 'score-asc' | 'priority'>('newest')

  // Bulk operation state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Details drawer state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Supabase Realtime Sync
  useEffect(() => {
    const channel = supabase
      .channel('realtime-leads-list-crm-v3')
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

  // CSV Export লজিক
  const handleExportCSV = () => {
    const headers = ['Customer,Source,Phone,Email,City,Service Type,Priority,Lead Score,Status,Created At\n']
    const leadsToExport = selectedLeadIds.length > 0 
      ? leadsList.filter(l => selectedLeadIds.includes(l.id))
      : processedLeads

    const rows = leadsToExport.map(l => 
      `"${l.customer_name}","${l.source || 'Website'}","${l.phone}","${l.email || ''}","${l.city}","${l.service_type}","${l.priority}",${l.lead_score},"${l.status}","${new Date(l.created_at).toLocaleDateString()}"`
    )
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows.join('\n')).join('')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `hvac_leads_export_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // বাল্ক একশন লজিক
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

  return (
    <div className="space-y-6 relative">
      
      {/* Header and Switches */}
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

        {/* Dropdowns Filters */}
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

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-2 px-3 py-1.5 border border-border-custom rounded-button bg-background text-xs font-bold text-text-primary hover:bg-border-custom transition-colors ml-auto cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Selected CSV</span>
          </button>
        </div>
      </div>

      {/* Leads Table Container */}
      {processedLeads.length > 0 ? (
        <div className="bg-surface rounded-card border border-border-custom shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-custom bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="px-6 py-4 w-12 text-center">
                    <button 
                      onClick={toggleSelectAllLeads}
                      className="p-1 hover:bg-background rounded-button text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                    >
                      {selectedLeadIds.length === processedLeads.length ? (
                        <CheckSquare className="h-4 w-4 text-primary-custom" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Lead Score</th>
                  <th className="px-6 py-4">Status</th>
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
                    >
                      <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => toggleSelectLead(lead.id)}
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
        </div>
      ) : (
        /* Empty State Layout */
        <div className="bg-surface rounded-card border border-border-custom shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-3 py-16">
          <div className="h-12 w-12 rounded-full bg-border-custom/30 flex items-center justify-center text-text-secondary">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary">No Leads Found</h3>
          <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
            There are no hvac leads matching the search term or dropdown filter configurations. Try resetting them.
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