/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
import { updateSettings } from './actions'
import { ShieldCheck, Radio, BellRing, Settings, Loader2, Save } from 'lucide-react'

interface SettingsData {
  n8nWebhookUrl: string
  emergencyEmailDispatch: boolean
  autoAiIngestion: boolean
}

export default function SettingsClient({ initialSettings }: { initialSettings: SettingsData }) {
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // স্লাইডিং সুইচের জন্য রিয়্যাক্ট স্টেট
  const [emergencyEmail, setEmergencyEmail] = useState(initialSettings.emergencyEmailDispatch)
  const [autoAi, setAutoAi] = useState(initialSettings.autoAiIngestion)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const formData = new FormData()
    const webhookVal = (e.currentTarget.elements.namedItem('n8nWebhookUrl') as HTMLInputElement).value
    formData.append('n8nWebhookUrl', webhookVal)
    formData.append('emergencyEmailDispatch', String(emergencyEmail))
    formData.append('autoAiIngestion', String(autoAi))

    try {
      const res = await updateSettings(formData)
      if (res.success) {
        setSuccessMsg('System configurations and webhook endpoint saved successfully.')
      } else {
        setErrorMsg(res.error || 'Failed to save system settings.')
      }
    } catch {
      setErrorMsg('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">System Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure global webhook channels and automation configurations.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-input bg-success-custom/10 text-success-custom text-sm font-semibold border border-success-custom/20">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-input bg-danger-custom/10 text-danger-custom text-sm font-semibold border border-danger-custom/20">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border-custom rounded-card shadow-sm overflow-hidden divide-y divide-border-custom">
        
        {/* n8n Webhook input */}
        <div className="p-6 md:p-8 space-y-4">
          <div className="flex items-center space-x-2.5">
            <Radio className="h-5 w-5 text-primary-custom" />
            <h3 className="text-base font-bold text-text-primary">Automation Webhook (n8n)</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed max-w-lg">
            Input your n8n Production Webhook URL. This endpoint securely receives JSON payloads when dispatch quick actions are executed [PRD.md].
          </p>
          
          <div>
            <input 
              id="n8nWebhookUrl"
              name="n8nWebhookUrl"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/hvac-leads"
              defaultValue={initialSettings.n8nWebhookUrl}
              className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm font-mono focus:border-primary-custom"
            />
          </div>
        </div>

        {/* Operational Preferences (Toggles) */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center space-x-2.5">
            <BellRing className="h-5 w-5 text-primary-custom" />
            <h3 className="text-base font-bold text-text-primary">Operational Preferences</h3>
          </div>
          
          <div className="space-y-4">
            
            {/* Toggle 1: Emergency Email */}
            <div 
              onClick={() => setEmergencyEmail(!emergencyEmail)}
              className="flex items-center justify-between p-3.5 bg-background border border-border-custom rounded-input cursor-pointer hover:border-primary-custom/30 transition-colors"
            >
              <div className="space-y-0.5 select-none">
                <div className="text-sm font-semibold text-text-primary">Emergency Lead Email Dispatch</div>
                <p className="text-[11px] text-text-secondary">Receive immediate notification to owner on high priority leads [PRD.md].</p>
              </div>
              <div className={`h-6 w-11 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${emergencyEmail ? 'bg-primary-custom' : 'bg-border-custom'}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${emergencyEmail ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Toggle 2: AI Ingestion */}
            <div 
              onClick={() => setAutoAi(!autoAi)}
              className="flex items-center justify-between p-3.5 bg-background border border-border-custom rounded-input cursor-pointer hover:border-primary-custom/30 transition-colors"
            >
              <div className="space-y-0.5 select-none">
                <div className="text-sm font-semibold text-text-primary">Automatic AI Ingestion</div>
                <p className="text-[11px] text-text-secondary">Route new leads immediately to OpenRouter LLM model [PRD.md].</p>
              </div>
              <div className={`h-6 w-11 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${autoAi ? 'bg-primary-custom' : 'bg-border-custom'}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${autoAi ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-background/50 flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-xs text-text-secondary font-medium">
            <ShieldCheck className="h-4 w-4 text-success-custom" />
            <span>Secure settings sync active</span>
          </span>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-button text-sm font-semibold text-white bg-primary-custom hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4 text-white" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save System Configurations</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}