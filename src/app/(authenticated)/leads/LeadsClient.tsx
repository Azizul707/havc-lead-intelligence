/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useMemo } from 'react'
import { 
  ListFilter, 
  KanbanSquare, 
  Download, 
  Plus, 
  ChevronRight,
  Search,
  Calendar,
  Sparkles,
  Phone,
  ArrowRight,
  Clock3,
  MapPin
} from 'lucide-react'
import { updateLeadStatusDirectly } from '../dashboard/actions'

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
}

interface LeadsClientProps {
  initialLeads: Lead[]
}

export default function LeadsClient({ initialLeads }: LeadsClientProps) {
  // States
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads)
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pipeline dragging indicators
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null)

  const columns: { id: Lead['status']; name: string; color: string }[] = [
    { id: 'NEW', name: 'New Ingestion', color: 'bg-primary-custom/10 text-primary-custom border-primary-custom/25' },
    { id: 'CONTACTED', name: 'Contacted', color: 'bg-warning-custom/10 text-warning-custom border-warning-custom/25' },
    { id: 'SCHEDULED', name: 'Scheduled Visit', color: 'bg-info-custom/10 text-info-custom border-info-custom/25' },
    { id: 'COMPLETED', name: 'Job Completed', color: 'bg-success-custom/10 text-success-custom border-success-custom/25' },
    { id: 'LOST', name: 'Lost Deal', color: 'bg-text-secondary/10 text-text-secondary border-text-secondary/25' }
  ]

  // ১. গ্লোবাল সার্চ এবং ফিল্টারিং লজিক (সব ফিল্টার একসাথে কাজ করবে)
  const filteredLeads = useMemo(() => {
    return leadsList.filter(lead => {
      const matchesSearch = 
        lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.service_type.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter
      const matchesCity = cityFilter === 'all' || lead.city === cityFilter
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter

      return matchesSearch && matchesPriority && matchesCity && matchesStatus
    })
  }, [leadsList, searchTerm, priorityFilter, cityFilter, statusFilter])

  const uniqueCities = useMemo(() => {
    return Array.from(new Set(leadsList.map(l => l.city)))
  }, [leadsList])

  // ২. CSV এক্সপোর্ট লজিক (DATABASE.md স্পেক অনুযায়ী)
  const handleExportCSV = () => {
    const headers = ['Customer,Phone,Email,City,Service Type,Priority,Lead Score,Status,Created At\n']
    const rows = filteredLeads.map(l => 
      `"${l.customer_name}","${l.phone}","${l.email || ''}","${l.city}","${l.service_type}","${l.priority}",${l.lead_score},"${l.status}","${new Date(l.created_at).toLocaleDateString()}"`
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

  // ৩. Drag & Drop লজিক (Native HTML5 Drag Events)
  const handleDragStart = (e: React.DragEvent, leadId: string, currentStatus: string) => {
    e.dataTransfer.setData('leadId', leadId)
    e.dataTransfer.setData('previousStatus', currentStatus)
    e.dataTransfer.effectAllowed = 'move'
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

    // অপটিমিস্টিক ইন্টারফেস আপডেট (ইনস্ট্যান্ট প্রতিক্রিয়া পাওয়ার জন্য)
    const backupList = [...leadsList]
    const updatedLeads = leadsList.map(l => {
      if (l.id === leadId) {
        return { ...l, status: newStatus }
      }
      return l
    })
    setLeadsList(updatedLeads)

    // ব্যাকএন্ড আপডেট ও ইভেন্ট ক্রিয়েশন
    const res = await updateLeadStatusDirectly(leadId, newStatus, previousStatus)
    if (!res.success) {
      // ফেইল করলে স্টেট রিভার্ট করা হবে
      setLeadsList(backupList)
      alert(`Status update failed: ${res.error}`)
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

  return (
    <div className="space-y-8">
      
      {/* Title & View Switcher Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border-custom">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">CRM Leads Dispatch Console</h1>
          <p className="text-sm text-text-secondary mt-1">Manage pipeline routing and customer dispatch jobs.</p>
        </div>

        {/* View Switcher Tabs (Page 13 "Tabs" layout) */}
        <div className="flex items-center space-x-1.5 bg-surface border border-border-custom p-1 rounded-button shadow-sm self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-input text-sm font-semibold transition-colors cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-primary-custom/10 text-primary-custom' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ListFilter className="h-4 w-4" />
            <span>List View</span>
          </button>
          
          <button
            onClick={() => setViewMode('pipeline')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-input text-sm font-semibold transition-colors cursor-pointer ${
              viewMode === 'pipeline' 
                ? 'bg-primary-custom/10 text-primary-custom' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <KanbanSquare className="h-4 w-4" />
            <span>Pipeline Board</span>
          </button>
        </div>
      </div>

      {/* Table Filters (Only shown in List View) */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="lg:col-span-2 flex items-center space-x-2 bg-surface border border-border-custom rounded-input px-3 py-2 text-text-secondary focus-within:border-primary-custom">
            <Search className="h-4 w-4" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone or city..." 
              className="bg-transparent border-none outline-none text-sm w-full text-text-primary"
            />
          </div>

          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-border-custom rounded-input text-sm font-medium cursor-pointer"
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
            className="px-3 py-2 bg-surface border border-border-custom rounded-input text-sm font-medium cursor-pointer"
          >
            <option value="all">All Cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* CSV Export & Add Lead actions */}
          <div className="flex items-center gap-2 lg:justify-end">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-border-custom rounded-button bg-surface text-sm font-semibold text-text-primary hover:bg-background transition-colors w-full sm:w-auto cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. List View Section */}
      {viewMode === 'list' && (
        <div className="bg-surface rounded-card border border-border-custom shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {filteredLeads.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-custom bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Lead Score</th>
                    <th className="px-6 py-4">Urgency</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom text-sm">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-background/80 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-text-primary">{lead.customer_name}</td>
                      <td className="px-6 py-4 text-text-secondary">{lead.phone}</td>
                      <td className="px-6 py-4 text-text-secondary">{lead.city}</td>
                      <td className="px-6 py-4 text-text-secondary truncate max-w-32">{lead.service_type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{lead.lead_score}</td>
                      <td className="px-6 py-4 text-text-secondary capitalize">{lead.urgency.toLowerCase()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-custom/10 text-primary-custom">
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-text-secondary text-xs">
                        {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-text-secondary">
                <span className="text-base font-semibold">No Leads Found</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Drag & Drop Pipeline View Section (V3 CRM Board) */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 min-w-[1000px] md:min-w-0">
          {columns.map((column) => {
            const columnLeads = leadsList.filter(l => l.status === column.id)
            const isDraggedOver = draggedOverColumn === column.id

            return (
              <div 
                key={column.id} 
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragLeave={() => setDraggedOverColumn(null)}
                className={`flex flex-col bg-surface rounded-card border ${
                  isDraggedOver 
                    ? 'border-primary-custom bg-primary-custom/5 shadow-md' 
                    : 'border-border-custom'
                } p-4 min-h-[500px] transition-all`}
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

                {/* Column Body / Cards List */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[550px] pr-1">
                  {columnLeads.length > 0 ? (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id, column.id)}
                        className="bg-background border border-border-custom hover:border-primary-custom p-4 rounded-card shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-text-primary group-hover:text-primary-custom transition-colors truncate">
                            {lead.customer_name}
                          </span>
                          <span className="text-xs font-bold text-primary-custom bg-primary-custom/10 px-1.5 py-0.5 rounded-md shrink-0">
                            {lead.lead_score}
                          </span>
                        </div>

                        {/* Location / City info */}
                        <div className="flex items-center space-x-1 text-xs text-text-secondary mt-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{lead.city} ({lead.service_type})</span>
                        </div>

                        {/* Summary preview */}
                        <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">
                          {lead.issue_description}
                        </p>

                        {/* Badges footer */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-custom">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(lead.priority)}`}>
                            {lead.priority}
                          </span>
                          <span className="text-[10px] text-text-secondary font-medium">
                            {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-border-custom/40 rounded-card p-6 text-center text-text-secondary/60 text-xs font-semibold py-12">
                      Drop lead here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}