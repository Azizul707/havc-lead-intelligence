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
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="pb-5 border-b border-border-custom">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Profile</h1>
        <p className="text-sm text-text-secondary/80 mt-0.5">Manage your administrative details and preferences.</p>
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

      <form onSubmit={handleSubmit(onSubmit)} className="bg-surface border border-border-custom rounded-card shadow-sm overflow-hidden divide-y divide-border-custom">
        <div className="p-6 space-y-5">

          {/* Identity Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-text-secondary/80 mb-1.5">Full Name</label>
              <input
                {...register('fullName')}
                type="text"
                className={`w-full px-3 py-2.5 bg-background border rounded-lg text-text-primary text-sm placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-primary-custom/15 focus:border-primary-custom/60 transition-all ${
                  errors.fullName ? 'border-danger-custom' : 'border-border-custom'
                }`}
              />
              {errors.fullName && <p className="text-xs text-danger-custom font-medium mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary/80 mb-1.5">Company Name</label>
              <input
                {...register('companyName')}
                type="text"
                className={`w-full px-3 py-2.5 bg-background border rounded-lg text-text-primary text-sm placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-primary-custom/15 focus:border-primary-custom/60 transition-all ${
                  errors.companyName ? 'border-danger-custom' : 'border-border-custom'
                }`}
              />
              {errors.companyName && <p className="text-xs text-danger-custom font-medium mt-1">{errors.companyName.message}</p>}
            </div>
          </div>

          {/* Contact Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-text-secondary/80 mb-1.5">Phone</label>
              <input
                {...register('phone')}
                type="text"
                placeholder="+1 555-0199"
                className={`w-full px-3 py-2.5 bg-background border rounded-lg text-text-primary text-sm placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-primary-custom/15 focus:border-primary-custom/60 transition-all ${
                  errors.phone ? 'border-danger-custom' : 'border-border-custom'
                }`}
              />
              {errors.phone && <p className="text-xs text-danger-custom font-medium mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary/80 mb-1.5">Email (Immutable)</label>
              <input
                type="email"
                value={initialData.email}
                disabled
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-lg text-text-muted text-sm cursor-not-allowed"
              />
            </div>
          </div>

          {/* Preference Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-text-secondary/80 mb-1.5">Timezone</label>
              <select
                {...register('timezone')}
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-lg text-text-primary text-sm outline-none focus:ring-2 focus:ring-primary-custom/15 focus:border-primary-custom/60 transition-all cursor-pointer"
              >
                <option value="EST">Eastern (EST)</option>
                <option value="CST">Central (CST)</option>
                <option value="MST">Mountain (MST)</option>
                <option value="PST">Pacific (PST)</option>
                <option value="UTC">UTC</option>
              </select>
              {errors.timezone && <p className="text-xs text-danger-custom font-medium mt-1">{errors.timezone.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary/80 mb-1.5">Country</label>
              <input
                {...register('country')}
                type="text"
                className={`w-full px-3 py-2.5 bg-background border rounded-lg text-text-primary text-sm placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-primary-custom/15 focus:border-primary-custom/60 transition-all ${
                  errors.country ? 'border-danger-custom' : 'border-border-custom'
                }`}
              />
              {errors.country && <p className="text-xs text-danger-custom font-medium mt-1">{errors.country.message}</p>}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-background/30 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary/70 font-medium">
            <ShieldCheck className="h-4 w-4 text-success-custom" />
            <span>Encrypted validation engine active</span>
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-custom hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <>
                <User className="h-4 w-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}