/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
import { updateProfile } from './actions'
import { User, ShieldCheck, Loader2 } from 'lucide-react'

interface ProfileData {
  fullName: string
  companyName: string
  phone: string
  timezone: string
  country: string
  email: string
}

export default function ProfileClient({ initialData }: { initialData: ProfileData }) {
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await updateProfile(formData)
      if (res.success) {
        setSuccessMsg('Your profile has been updated successfully.')
      } else {
        setErrorMsg(res.error || 'Failed to update profile.')
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
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Profile Configuration</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your administrative details and preferences.</p>
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
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Identity Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Full Name</label>
              <input 
                name="fullName"
                type="text" 
                defaultValue={initialData.fullName}
                required
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Company Name</label>
              <input 
                name="companyName"
                type="text" 
                defaultValue={initialData.companyName}
                required
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom"
              />
            </div>
          </div>

          {/* Contact Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Contact Phone</label>
              <input 
                name="phone"
                type="text" 
                defaultValue={initialData.phone}
                placeholder="+1 555-0199"
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Account Email (Immutable)</label>
              <input 
                type="email" 
                value={initialData.email}
                disabled
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-muted text-sm cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          {/* Preference Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Timezone</label>
              <select 
                name="timezone"
                defaultValue={initialData.timezone}
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom cursor-pointer"
              >
                <option value="EST">Eastern Standard Time (EST)</option>
                <option value="CST">Central Standard Time (CST)</option>
                <option value="MST">Mountain Standard Time (MST)</option>
                <option value="PST">Pacific Standard Time (PST)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Country</label>
              <input 
                name="country"
                type="text" 
                defaultValue={initialData.country}
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-background/50 flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-xs text-text-secondary font-medium">
            <ShieldCheck className="h-4 w-4 text-success-custom" />
            <span>Encrypted Supabase connection active</span>
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
                <User className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}