'use client'

import React from 'react'
import { ShieldAlert, Loader2, Trash2 } from 'lucide-react'

interface BulkToolbarProps {
  selectedCount: number
  bulkLoading: boolean
  onMarkContacted: () => void
  onMarkComplete: () => void
  onMarkLost: () => void
  onDelete: () => void
}

export const BulkToolbar = React.memo(function BulkToolbar({
  selectedCount,
  bulkLoading,
  onMarkContacted,
  onMarkComplete,
  onMarkLost,
  onDelete,
}: BulkToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border-custom shadow-xl rounded-xl p-3 z-40 flex items-center gap-4 animate-fade-in text-sm font-semibold max-w-lg w-full justify-between">
      <div className="flex items-center gap-2 px-1">
        <ShieldAlert className="h-4 w-4 text-primary-custom" />
        <span className="text-xs font-medium text-text-secondary">{selectedCount} selected</span>
      </div>

      <div className="flex items-center gap-1.5">
        {bulkLoading ? (
          <Loader2 className="animate-spin h-4 w-4 text-primary-custom" />
        ) : (
          <>
            <button
              onClick={onMarkContacted}
              className="px-2.5 py-1.5 bg-warning-custom/8 text-warning-custom rounded-lg text-[11px] font-semibold hover:bg-warning-custom/15 transition-colors cursor-pointer"
            >
              Contacted
            </button>
            <button
              onClick={onMarkComplete}
              className="px-2.5 py-1.5 bg-success-custom/8 text-success-custom rounded-lg text-[11px] font-semibold hover:bg-success-custom/15 transition-colors cursor-pointer"
            >
              Complete
            </button>
            <button
              onClick={onMarkLost}
              className="px-2.5 py-1.5 bg-text-secondary/8 text-text-secondary rounded-lg text-[11px] font-semibold hover:bg-text-secondary/15 transition-colors cursor-pointer"
            >
              Lost
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 bg-danger-custom/8 text-danger-custom rounded-lg hover:bg-danger-custom/15 transition-colors cursor-pointer"
              aria-label="Delete selected"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
})

BulkToolbar.displayName = 'BulkToolbar'
