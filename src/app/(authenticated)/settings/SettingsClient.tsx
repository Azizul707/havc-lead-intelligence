'use client'

import React, { useState } from 'react'
import { updateSettings } from './actions'
import { ShieldCheck, Radio, BellRing, Loader2, Save } from 'lucide-react'
import {
  getServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from './service-types.actions'
import { Wrench, Plus, Trash2, Edit3, X, Check } from 'lucide-react'

interface SettingsData {
  n8nWebhookUrl: string
  emergencyEmail: boolean
  autoAiIngestion: boolean
}

interface ServiceTypeItem {
  id: string
  user_id: string
  name: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SettingsClientProps {
  initialSettings: SettingsData
  serviceTypes: ServiceTypeItem[]
}

export default function SettingsClient({ initialSettings, serviceTypes: initialServiceTypes }: SettingsClientProps) {
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [emergencyEmail, setEmergencyEmail] = useState(initialSettings.emergencyEmail)
  const [autoAi, setAutoAi] = useState(initialSettings.autoAiIngestion)

  // Service Types state
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>(initialServiceTypes)
  const [newServiceTypeName, setNewServiceTypeName] = useState('')
  const [newServiceTypeLoading, setNewServiceTypeLoading] = useState(false)
  const [editingServiceTypeId, setEditingServiceTypeId] = useState<string | null>(null)
  const [editingServiceTypeName, setEditingServiceTypeName] = useState('')
  const [editingServiceTypeLoading, setEditingServiceTypeLoading] = useState(false)
  const [deletingServiceTypeId, setDeletingServiceTypeId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const formData = new FormData()
    const webhookVal = (e.currentTarget.elements.namedItem('n8nWebhookUrl') as HTMLInputElement).value
    formData.append('n8nWebhookUrl', webhookVal)
    formData.append('emergencyEmail', String(emergencyEmail))
    formData.append('autoAiIngestion', String(autoAi))

    try {
      const res = await updateSettings(formData)
      if (res.success) {
        setSuccessMsg('System configurations saved successfully.')
      } else {
        setErrorMsg(res.message || 'Failed to save system settings.')
      }
    } catch {
      setErrorMsg('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddServiceType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServiceTypeName.trim()) return

    setNewServiceTypeLoading(true)
    const result = await createServiceType(newServiceTypeName)
    if (result.success && result.data) {
      setServiceTypes([...serviceTypes, result.data].sort((a, b) => a.display_order - b.display_order))
      setNewServiceTypeName('')
    } else {
      setErrorMsg(result.message || 'Failed to add service type.')
      setTimeout(() => setErrorMsg(null), 4000)
    }
    setNewServiceTypeLoading(false)
  }

  const handleStartEdit = (typeItem: ServiceTypeItem) => {
    setEditingServiceTypeId(typeItem.id)
    setEditingServiceTypeName(typeItem.name)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editingServiceTypeName.trim()) return
    setEditingServiceTypeLoading(true)

    const result = await updateServiceType(id, { name: editingServiceTypeName.trim() })
    if (result.success && result.data) {
      setServiceTypes(serviceTypes.map(st => st.id === id ? result.data! : st))
      setEditingServiceTypeId(null)
      setEditingServiceTypeName('')
    } else {
      setErrorMsg(result.message || 'Failed to update service type.')
      setTimeout(() => setErrorMsg(null), 4000)
    }
    setEditingServiceTypeLoading(false)
  }

  const handleDeleteServiceType = async (id: string) => {
    setDeletingServiceTypeId(id)
    const result = await deleteServiceType(id)
    if (result.success) {
      setServiceTypes(serviceTypes.filter(st => st.id !== id))
    } else {
      setErrorMsg(result.message || 'Failed to delete service type.')
      setTimeout(() => setErrorMsg(null), 4000)
    }
    setDeletingServiceTypeId(null)
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const result = await updateServiceType(id, { is_active: !currentActive })
    if (result.success && result.data) {
      setServiceTypes(serviceTypes.map(st => st.id === id ? result.data! : st))
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="pb-5 border-b border-border-custom">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary/80 mt-0.5">Configure webhook channels, automation preferences, and service types.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-lg bg-success-custom/10 text-success-custom text-xs font-medium border border-success-custom/20">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-danger-custom/10 text-danger-custom text-xs font-medium border border-danger-custom/20">
          {errorMsg}
        </div>
      )}

      {/* Service Types Management Card */}
      <div className="bg-surface border border-border-custom rounded-card shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Wrench className="h-5 w-5 text-primary-custom" />
            <h3 className="text-sm font-semibold text-text-primary">Service Types</h3>
          </div>
          <p className="text-xs text-text-secondary/80 leading-relaxed max-w-lg">
            Manage the service types available when scheduling appointments. Different HVAC companies offer different services. Add, edit, or remove types as needed.
          </p>

          {/* Service Type List */}
          <div className="space-y-2">
            {serviceTypes.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-xs">
                No service types configured. Add your first service type below.
              </div>
            ) : (
              <div className="space-y-1.5">
                {[...serviceTypes].sort((a, b) => a.display_order - b.display_order).map((typeItem) => (
                  <div
                    key={typeItem.id}
                    className={`flex items-center gap-2 p-3 bg-background border border-border-custom rounded-lg group ${
                      !typeItem.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    {editingServiceTypeId === typeItem.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          value={editingServiceTypeName}
                          onChange={(e) => setEditingServiceTypeName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(typeItem.id) }
                            if (e.key === 'Escape') { setEditingServiceTypeId(null); setEditingServiceTypeName('') }
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-surface border border-primary-custom/40 rounded-md text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-custom/20"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(typeItem.id)}
                          disabled={editingServiceTypeLoading || !editingServiceTypeName.trim()}
                          className="p-1.5 rounded-md hover:bg-success-custom/10 text-success-custom disabled:opacity-30 cursor-pointer transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingServiceTypeId(null); setEditingServiceTypeName('') }}
                          disabled={editingServiceTypeLoading}
                          className="p-1.5 rounded-md hover:bg-background text-text-muted cursor-pointer transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-text-primary truncate">{typeItem.name}</span>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(typeItem.id, typeItem.is_active)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                            typeItem.is_active
                              ? 'bg-success-custom/10 text-success-custom hover:bg-success-custom/20'
                              : 'bg-background border border-border-custom text-text-muted hover:text-text-primary'
                          }`}
                        >
                          {typeItem.is_active ? 'Active' : 'Inactive'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(typeItem)}
                          className="p-1.5 rounded-md hover:bg-primary-custom/10 text-primary-custom opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteServiceType(typeItem.id)}
                          disabled={deletingServiceTypeId === typeItem.id}
                          className="p-1.5 rounded-md hover:bg-danger-custom/10 text-danger-custom opacity-0 group-hover:opacity-100 disabled:opacity-30 cursor-pointer transition-all"
                        >
                          {deletingServiceTypeId === typeItem.id ? (
                            <Trash2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new service type form */}
          <form onSubmit={handleAddServiceType} className="flex gap-2 pt-2">
            <input
              type="text"
              value={newServiceTypeName}
              onChange={(e) => setNewServiceTypeName(e.target.value)}
              placeholder="Add a new service type..."
              maxLength={50}
              className="flex-1 px-3 py-2 bg-background border border-border-custom rounded-lg text-xs text-text-primary placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-primary-custom/15 focus:border-primary-custom/60 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddServiceType(e as any)
                }
              }}
            />
            <button
              type="submit"
              disabled={newServiceTypeLoading || !newServiceTypeName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-custom text-white rounded-lg text-xs font-medium hover:bg-primary-hover disabled:opacity-50 cursor-pointer transition-colors"
            >
              {newServiceTypeLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Settings Form Card */}
      <form onSubmit={handleSubmit} className="bg-surface border border-border-custom rounded-card shadow-sm overflow-hidden divide-y divide-border-custom">

        {/* n8n Webhook input */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Radio className="h-5 w-5 text-primary-custom" />
            <h3 className="text-sm font-semibold text-text-primary">Automation Webhook (n8n)</h3>
          </div>
          <p className="text-xs text-text-secondary/80 leading-relaxed max-w-lg">
            Input your n8n Production Webhook URL. This endpoint receives JSON payloads when dispatch quick actions are executed.
          </p>

          <div>
            <input
              id="n8nWebhookUrl"
              name="n8nWebhookUrl"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/hvac-leads"
              defaultValue={initialSettings.n8nWebhookUrl}
              className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-lg text-text-primary text-sm font-mono placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-primary-custom/15 focus:border-primary-custom/60 transition-all"
            />
          </div>
        </div>

        {/* Operational Preferences (Toggles) */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <BellRing className="h-5 w-5 text-primary-custom" />
            <h3 className="text-sm font-semibold text-text-primary">Operational Preferences</h3>
          </div>

          <div className="space-y-3">

            {/* Toggle 1: Emergency Email */}
            <div
              onClick={() => setEmergencyEmail(!emergencyEmail)}
              className="flex items-center justify-between p-3.5 bg-background border border-border-custom rounded-lg cursor-pointer hover:border-primary-custom/30 transition-colors"
            >
              <div className="space-y-0.5 select-none">
                <div className="text-sm font-medium text-text-primary">Emergency Lead Email Dispatch</div>
                <p className="text-xs text-text-secondary/70">Receive immediate notification on high priority leads.</p>
              </div>
              <div className={`h-6 w-11 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${emergencyEmail ? 'bg-primary-custom' : 'bg-border-custom'}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${emergencyEmail ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Toggle 2: AI Ingestion */}
            <div
              onClick={() => setAutoAi(!autoAi)}
              className="flex items-center justify-between p-3.5 bg-background border border-border-custom rounded-lg cursor-pointer hover:border-primary-custom/30 transition-colors"
            >
              <div className="space-y-0.5 select-none">
                <div className="text-sm font-medium text-text-primary">Automatic AI Ingestion</div>
                <p className="text-xs text-text-secondary/70">Route new leads to OpenRouter LLM model automatically.</p>
              </div>
              <div className={`h-6 w-11 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${autoAi ? 'bg-primary-custom' : 'bg-border-custom'}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${autoAi ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-background/30 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary/70 font-medium">
            <ShieldCheck className="h-4 w-4 text-success-custom" />
            <span>Secure settings sync active</span>
          </span>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-custom hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
