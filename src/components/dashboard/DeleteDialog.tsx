/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface DeleteDialogProps {
  visible: boolean
  count: number
  onCancel: () => void
  onConfirm: () => void
}

export const DeleteDialog = React.memo(function DeleteDialog({
  visible,
  count,
  onCancel,
  onConfirm,
}: DeleteDialogProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
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
          Are you sure you want to delete <strong className="text-text-primary">{count}</strong> selected leads?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border-custom hover:bg-background rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-danger-custom text-white hover:bg-danger-custom/90 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
})

DeleteDialog.displayName = 'DeleteDialog'
