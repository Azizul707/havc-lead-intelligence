/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '../../../lib/logger'
import { handleServerError, AppError, ServerResponse } from '../../../lib/errors'
import { profileSchema } from '../../../lib/schemas'

/**
 * FEATURE S2: Save custom profile details with Server-Side Zod validation & Sanitization.
 */
export async function updateProfileSettings(formData: FormData): Promise<ServerResponse> {
  try {
    const supabase = await createClient()

    // 1. Session verification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AppError('Unauthorized access. Please login.', 'UNAUTHORIZED')
    }

    const fullName = formData.get('fullName') as string
    const companyName = formData.get('companyName') as string
    const phone = formData.get('phone') as string
    const timezone = formData.get('timezone') as string
    const country = formData.get('country') as string

    // 2. Schema validation
    const parsed = profileSchema.safeParse({ fullName, companyName, phone, timezone, country })
    if (!parsed.success) {
      throw new AppError(`Validation failed: ${parsed.error.issues[0]?.message || 'Invalid input'}`, 'VALIDATION_ERROR')
    }
    const validated = parsed.data

    // 3. Update in Supabase
    const { error } = await (supabase.from('profiles') as any)
      .update({
        full_name: validated.fullName,
        company_name: validated.companyName,
        phone: validated.phone,
        timezone: validated.timezone,
        country: validated.country,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw new AppError(`Failed to save profile: ${error.message}`, 'DB_UPDATE_ERROR')

    logger.info(`Profile changed successfully for id ${user.id}`)
    revalidatePath('/settings')
    
    return { success: true, message: 'Profile details saved successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to update profile settings.')
  }
}
export async function updateSettings(formData: FormData): Promise<ServerResponse> {
  return updateNotificationPreferences(formData)
}
/**
 * FEATURE S4: Change Password securely using Supabase Auth Client.
 */
export async function updatePassword(password: string): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('Unauthorized.', 'UNAUTHORIZED')

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long.', 'VALIDATION_ERROR')
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new AppError(`Failed to update password: ${error.message}`, 'AUTH_ERROR')

    logger.info(`User changed password successfully for id ${user.id}`)
    return { success: true, message: 'Password updated successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to update password.')
  }
}

/**
 * FEATURE S4: Update Notification Preferences and Toggles.
 */
export async function updateNotificationPreferences(formData: FormData): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('Unauthorized.', 'UNAUTHORIZED')

    const emergencyEmail = formData.get('emergencyEmail') === 'true' || formData.get('emergencyEmailDispatch') === 'true'
    const autoAiIngestion = formData.get('autoAiIngestion') === 'true' || formData.get('autoAi') === 'true'

    const { error } = await (supabase.from('profiles') as any)
      .update({
        emergency_email_dispatch: emergencyEmail,
        auto_ai_ingestion: autoAiIngestion,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw new AppError(`Failed to save settings: ${error.message}`, 'DB_UPDATE_ERROR')

    logger.info(`Operational preferences updated for user ${user.id}`)

    revalidatePath('/settings')
    return { success: true, message: 'Operational preferences saved successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to save notifications.')
  }
}