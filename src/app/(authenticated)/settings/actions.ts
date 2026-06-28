/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized.' }
  }

  const n8nWebhookUrl = formData.get('n8nWebhookUrl') as string
  const emergencyEmailDispatch = formData.get('emergencyEmailDispatch') === 'true'
  const autoAiIngestion = formData.get('autoAiIngestion') === 'true'

  // profiles টেবিলে ইউজারের সেটিংস আপডেট করা হচ্ছে
  const { error } = await (supabase.from('profiles') as any)
    .update({
      n8n_webhook_url: n8nWebhookUrl || null,
      emergency_email_dispatch: emergencyEmailDispatch,
      auto_ai_ingestion: autoAiIngestion,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: 'Failed to save settings: ' + error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}