/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '../../../lib/logger'
import { handleServerError, AppError, ServerResponse } from '../../../lib/errors'
import { profileSchema } from '../../../lib/schemas'

/**
 * FEATURE S2: Profile configuration updates.
 * Hardened with Server-Side Zod Schema Validation & Input Sanitization (Feature 4, 9)
 */
export async function updateProfile(formData: FormData): Promise<ServerResponse> {
  try {
    const supabase = await createClient()

    // 1. Session and auth verification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AppError('Unauthorized access. Please login.', 'UNAUTHORIZED')
    }

    // Extract raw form parameters
    const fullName = formData.get('fullName') as string
    const companyName = formData.get('companyName') as string
    const phone = formData.get('phone') as string
    const timezone = formData.get('timezone') as string
    const country = formData.get('country') as string

    // 2. Server-side Zod validation & input sanitization (Feature 4, 9)
    const parsed = profileSchema.safeParse({
      fullName,
      companyName,
      phone,
      timezone,
      country,
    })

    if (!parsed.success) {
      const issueMessage = parsed.error.issues[0]?.message ?? 'Invalid input'
      throw new AppError(`Profile validation failed: ${issueMessage}`, 'VALIDATION_ERROR')
    }

    const validated = parsed.data

    // 3. Update profiles table safely inside Supabase
    const { error: profileError } = await (supabase.from('profiles') as any)
      .update({
        full_name: validated.fullName,
        company_name: validated.companyName,
        phone: validated.phone,
        timezone: validated.timezone,
        country: validated.country,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      throw new AppError(`Failed to save profile changes: ${profileError.message}`, 'DB_UPDATE_ERROR')
    }

    logger.info(`Profile metadata successfully updated for user ${user.id}`)

    revalidatePath('/dashboard')
    revalidatePath('/profile')
    
    return { success: true, message: 'Profile configuration successfully saved.' }
  } catch (err) {
    return handleServerError(err, 'Failed to update profile configurations.')
  }
}