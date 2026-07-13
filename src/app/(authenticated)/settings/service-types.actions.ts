'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '../../../lib/logger'
import { handleServerError, AppError, ServerResponse } from '../../../lib/errors'

export interface ServiceType {
  id: string
  user_id: string
  name: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Get all service types for the current user
export async function getServiceTypes(): Promise<ServerResponse<ServiceType[]>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AppError('Unauthorized access. Please login.', 'UNAUTHORIZED')
    }

    const { data: types, error } = await supabase.from('service_types')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true })

    if (error) throw new AppError(`Failed to fetch service types: ${error.message}`, 'DB_FETCH_ERROR')

    return { success: true, message: 'Service types loaded.', data: (types || []) as ServiceType[] }
  } catch (err) {
    return handleServerError(err, 'Failed to load service types.') as ServerResponse<ServiceType[]>
  }
}

// Create a new service type
export async function createServiceType(name: string): Promise<ServerResponse<ServiceType>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AppError('Unauthorized access. Please login.', 'UNAUTHORIZED')
    }

    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 50) {
      throw new AppError('Service type name must be 1-50 characters.', 'VALIDATION_ERROR')
    }

    // Get current max display_order
    const { data: existing } = await supabase.from('service_types')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = existing ? existing.display_order + 1 : 0

    const { data: newType, error } = await supabase.from('service_types')
      .insert({
        user_id: user.id,
        name: trimmedName,
        display_order: nextOrder,
        is_active: true,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new AppError('A service type with this name already exists.', 'DUPLICATE_ERROR')
      }
      throw new AppError(`Failed to create service type: ${error.message}`, 'DB_INSERT_ERROR')
    }

    revalidatePath('/settings')
    logger.info(`Service type created: ${trimmedName} for user ${user.id}`)
    return { success: true, data: newType as ServiceType, message: 'Service type created successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to create service type.') as ServerResponse<ServiceType>
  }
}

// Update (rename or toggle active) a service type
export async function updateServiceType(id: string, updates: { name?: string; is_active?: boolean; display_order?: number }): Promise<ServerResponse<ServiceType>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AppError('Unauthorized access. Please login.', 'UNAUTHORIZED')
    }

    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim()
      if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 50) {
        throw new AppError('Service type name must be 1-50 characters.', 'VALIDATION_ERROR')
      }

      // Check for duplicate name among other types
      const { data: existing } = await supabase.from('service_types')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', trimmedName)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        throw new AppError('A service type with this name already exists.', 'DUPLICATE_ERROR')
      }
    }

    const { data: updated, error } = await supabase.from('service_types')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) throw new AppError(`Failed to update service type: ${error.message}`, 'DB_UPDATE_ERROR')
    if (!updated) throw new AppError('Service type not found.', 'NOT_FOUND')

    revalidatePath('/settings')
    logger.info(`Service type ${id} updated for user ${user.id}`)
    return { success: true, data: updated as ServiceType, message: 'Service type updated successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to update service type.') as ServerResponse<ServiceType>
  }
}

// Delete a service type
export async function deleteServiceType(id: string): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AppError('Unauthorized access. Please login.', 'UNAUTHORIZED')
    }

    const { error } = await supabase.from('service_types')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw new AppError(`Failed to delete service type: ${error.message}`, 'DB_DELETE_ERROR')

    revalidatePath('/settings')
    logger.info(`Service type ${id} deleted by user ${user.id}`)
    return { success: true, message: 'Service type deleted successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to delete service type.')
  }
}

// Batch reorder service types
export async function reorderServiceTypes(orderedIds: string[]): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AppError('Unauthorized access. Please login.', 'UNAUTHORIZED')
    }

    // Update display_order for each item
    const updatePromises = orderedIds.map((id, index) =>
      supabase.from('service_types')
        .update({ display_order: index })
        .eq('id', id)
        .eq('user_id', user.id)
    )

    const results = await Promise.all(updatePromises)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      throw new AppError(`Failed to reorder some service types.`, 'DB_UPDATE_ERROR')
    }

    revalidatePath('/settings')
    logger.info(`Service types reordered for user ${user.id}`)
    return { success: true, message: 'Service types reordered successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to reorder service types.')
  }
}
