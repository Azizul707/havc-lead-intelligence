/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // profiles টেবিল থেকে সেভ করা সেটিংস লোড করা
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('n8n_webhook_url, emergency_email_dispatch, auto_ai_ingestion')
    .eq('id', user.id)
    .single()

  const initialSettings = {
    n8nWebhookUrl: profile?.n8n_webhook_url || '',
    emergencyEmailDispatch: profile?.emergency_email_dispatch !== false, // default true
    autoAiIngestion: profile?.auto_ai_ingestion !== false // default true
  }

  return <SettingsClient initialSettings={initialSettings} />
}