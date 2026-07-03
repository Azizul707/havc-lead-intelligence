'use client'

import React from 'react'
import { CheckSquare, Square, Inbox, Globe } from 'lucide-react'
import type { Lead } from './types'

interface LeadRowProps {
  leads: Lead[]
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onRowClick: (lead: Lead) => void
}

const PRIORITY_CLASSES: Record<string, string> = {
  CRITICAL: 'bg-danger-custom/10 text-danger-custom border-danger-custom/20',
  HIGH:     'bg-warning-custom/10 text-warning-custom border-warning-custom/20',
  MEDIUM:   'bg-primary-custom/10 text-primary-custom border-primary-custom/20',
  LOW:      'bg-text-secondary/10 text-text-secondary border-text-secondary/20',
}

const STATUS_CLASSES: Record<string, string> = {
  NEW:       'bg-primary-custom/10 text-primary-custom',
  CONTACTED: 'bg-warning-custom/10 text-warning-custom',
  SCHEDULED: 'bg-info-custom/10 text-info-custom',
  COMPLETED: 'bg-success-custom/10 text-success-custom',
  LOST:      'bg-text-secondary/10 text-text-secondary',
}

export const LeadTable = React.memo(function LeadTable({
  leads,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
}: LeadRowProps) {
  const allSelected = leads.length > 0 && selectedIds.length === leads.length
  const displayLeads = leads.slice(0, 10)

  return (
    <div className="lg:col-span-8 bg-surface rounded-card border border-border-custom shadow-sm card-hover overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-border-custom flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-text-primary">Recent Leads</h2>
          <p className="text-xs text-text-secondary/70 mt-0.5">Click any row to open the intelligence drawer.</p>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        {displayLeads.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-custom bg-background/40">
                <th className="px-5 py-3 w-10 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelectAll() }}
                    className="p-1 rounded hover:bg-background text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                    aria-label={allSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allSelected ? (
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
              {displayLeads.map((lead) => {
                const isSelected = selectedIds.includes(lead.id)
                return (
                  <tr
                    key={lead.id}
                    onClick={() => onRowClick(lead)}
                    className={`hover:bg-background/40 transition-colors cursor-pointer group ${isSelected ? 'bg-primary-custom/[0.02]' : ''}`}
                  >
                    <td className="px-5 py-3.5 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleSelect(lead.id)}
                        className="p-1 rounded hover:bg-background text-text-muted hover:text-primary-custom transition-colors cursor-pointer"
                        aria-label={isSelected ? `Deselect ${lead.customer_name}` : `Select ${lead.customer_name}`}
                      >
                        {isSelected ? (
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border leading-none ${PRIORITY_CLASSES[lead.priority] || ''}`}>{lead.priority}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-text-primary">{lead.lead_score}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none ${STATUS_CLASSES[lead.status] || ''}`}>{lead.status}</span>
                    </td>
                  </tr>
                )
              })}
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
  )
})

LeadTable.displayName = 'LeadTable'
