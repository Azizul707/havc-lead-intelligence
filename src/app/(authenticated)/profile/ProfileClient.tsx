'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, ProfileInput } from '../../../lib/schemas'
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Initialize React Hook Form with Zod validation resolver
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData.fullName,
      companyName: initialData.companyName,
      phone: initialData.phone,
      timezone: initialData.timezone,
      country: initialData.country,
    }
  })

  // Standardized schema submit handler
  const onSubmit = async (data: ProfileInput) => {
    setSuccessMsg(null)
    setErrorMsg(null)

    // Parse payload into native server action FormData
    const formData = new FormData()
    formData.append('fullName', data.fullName)
    formData.append('companyName', data.companyName)
    formData.append('phone', data.phone)
    formData.append('timezone', data.timezone)
    formData.append('country', data.country)

    try {
      const res = await updateProfile(formData)
      if (res.success) {
        setSuccessMsg(res.message || 'Your profile has been updated successfully.')
      } else {
        setErrorMsg(res.message || 'Failed to update profile.')
      }
    } catch {
      setErrorMsg('An unexpected error occurred.')
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

      <form onSubmit={handleSubmit(onSubmit)} className="bg-surface border border-border-custom rounded-card shadow-sm overflow-hidden divide-y divide-border-custom">
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Identity Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Full Name</label>
              <input 
                {...register('fullName')}
                type="text" 
                className={`w-full px-3 py-2.5 bg-background border rounded-input text-text-primary text-sm focus:border-primary-custom ${
                  errors.fullName ? 'border-danger-custom' : 'border-border-custom'
                }`}
              />
              {errors.fullName && (
                <p className="text-xs text-danger-custom mt-1 font-semibold">{errors.fullName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Company Name</label>
              <input 
                {...register('companyName')}
                type="text" 
                className={`w-full px-3 py-2.5 bg-background border rounded-input text-text-primary text-sm focus:border-primary-custom ${
                  errors.companyName ? 'border-danger-custom' : 'border-border-custom'
                }`}
              />
              {errors.companyName && (
                <p className="text-xs text-danger-custom mt-1 font-semibold">{errors.companyName.message}</p>
              )}
            </div>
          </div>

          {/* Contact Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Contact Phone</label>
              <input 
                {...register('phone')}
                type="text" 
                placeholder="+1 555-0199"
                className={`w-full px-3 py-2.5 bg-background border rounded-input text-text-primary text-sm focus:border-primary-custom ${
                  errors.phone ? 'border-danger-custom' : 'border-border-custom'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-danger-custom mt-1 font-semibold">{errors.phone.message}</p>
              )}
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
                {...register('timezone')}
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom cursor-pointer"
              >
                <option value="EST">Eastern Standard Time (EST)</option>
                <option value="CST">Central Standard Time (CST)</option>
                <option value="MST">Mountain Standard Time (MST)</option>
                <option value="PST">Pacific Standard Time (PST)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
              {errors.timezone && (
                <p className="text-xs text-danger-custom mt-1 font-semibold">{errors.timezone.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Country</label>
              <input 
                {...register('country')}
                type="text" 
                className={`w-full px-3 py-2.5 bg-background border rounded-input text-text-primary text-sm focus:border-primary-custom ${
                  errors.country ? 'border-danger-custom' : 'border-border-custom'
                }`}
              />
              {errors.country && (
                <p className="text-xs text-danger-custom mt-1 font-semibold">{errors.country.message}</p>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-background/50 flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-xs text-text-secondary font-medium">
            <ShieldCheck className="h-4 w-4 text-success-custom" />
            <span>Encrypted validation engine active</span>
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-button text-sm font-semibold text-white bg-primary-custom hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? (
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