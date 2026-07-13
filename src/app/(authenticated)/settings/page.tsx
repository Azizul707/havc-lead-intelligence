/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'
import { getServiceTypes } from './service-types.actions'
import type { ServiceType } from './service-types.actions'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch complete profile configuration including notification toggles
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('id', user.id)
    .single()

  const initialSettings = {
    fullName: profile?.full_name || '',
    companyName: profile?.company_name || '',
    phone: profile?.phone || '',
    timezone: profile?.timezone || 'UTC',
    country: profile?.country || 'United States',
    email: user.email || '',
    emergencyEmail: profile?.emergency_email_dispatch !== false, // default true
    autoAiIngestion: profile?.auto_ai_ingestion !== false, // default true
    n8nWebhookUrl: profile?.n8n_webhook_url || '',
    role: profile?.role || 'DISPATCHER'
  }

  // Fetch service types for this user
  const serviceTypesResult = await getServiceTypes()
  const serviceTypes: ServiceType[] = serviceTypesResult.success && serviceTypesResult.data
    ? serviceTypesResult.data
    : []

  return <SettingsClient initialSettings={initialSettings} serviceTypes={serviceTypes} />
}
