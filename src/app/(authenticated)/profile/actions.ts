/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized.' }
  }

  const fullName = formData.get('fullName') as string
  const companyName = formData.get('companyName') as string
  const phone = formData.get('phone') as string
  const timezone = formData.get('timezone') as string
  const country = formData.get('country') as string

  // Profiles টেবিল আপডেট
  const { error } = await (supabase.from('profiles') as any)
    .update({
      full_name: fullName,
      company_name: companyName,
      phone: phone,
      timezone: timezone,
      country: country,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: 'Failed to update profile: ' + error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  return { success: true }
}