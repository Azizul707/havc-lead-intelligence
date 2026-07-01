/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '../../../lib/logger'
import { handleServerError, AppError, ServerResponse } from '../../../lib/errors'
import { appointmentSchema, noteSchema, reminderSchema, appointmentUpdateSchema, noteUpdateSchema } from '../../../lib/schemas'

/**
 * Non-blocking helper to insert a lead event. Logs and returns errors instead of throwing.
 */
async function insertLeadEvent({
  supabase,
  leadId,
  eventType,
  description,
  metadata = {},
  createdBy
}: {
  supabase: any
  leadId: string
  eventType: string
  description: string
  metadata?: Record<string, unknown>
  createdBy: string | null
}): Promise<Error | null> {
  try {
    const { error } = await (supabase.from('lead_events') as any).insert({
      lead_id: leadId,
      event_type: eventType,
      description,
      metadata,
      created_by: createdBy
    })
    return error || null
  } catch (err) {
    return err as Error
  }
}

/**
 * FEATURE V2: Quick Actions Trigger & Webhook Proxy Handler.
 * Executes specific operations on a lead, updates status, and dispatches webhook.
 */
export async function triggerLeadAction(
  leadId: string, 
  actionType: 'call' | 'email' | 'contact' | 'schedule' | 'complete'
): Promise<ServerResponse> {
  try {
    const supabase = await createClient()

    // 1. Session and auth verification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AppError('Unauthorized access. Please sign in again.', 'UNAUTHORIZED')
    }

    // 2. Fetch specific lead details safely
    const { data: lead, error: fetchError } = await (supabase.from('hvac_leads') as any)
      .select('*')
      .eq('id', leadId)
      .single()

    if (fetchError || !lead) {
      throw new AppError('Failed to retrieve active lead details from the database.', 'NOT_FOUND')
    }

    // 3. Map CRM action to status and activity event logging
    let newStatus: string = lead.status
    let eventType = 'STATUS_CHANGED'
    let description = ''
    let isFirstResponse = false

    switch (actionType) {
      case 'call':
        isFirstResponse = lead.status === 'NEW'
        eventType = isFirstResponse ? 'FIRST_RESPONSE' : 'STATUS_CHANGED'
        description = isFirstResponse
          ? `First response — called customer ${lead.customer_name}.`
          : `Called customer ${lead.customer_name} via dispatcher console.`
        break
      case 'email':
        isFirstResponse = lead.status === 'NEW'
        eventType = isFirstResponse ? 'FIRST_RESPONSE' : 'STATUS_CHANGED'
        description = isFirstResponse
          ? `First response — emailed lead details to ${lead.customer_name}.`
          : `Emailed lead details to ${lead.customer_name}.`
        break
      case 'contact':
        newStatus = 'CONTACTED'
        isFirstResponse = lead.status === 'NEW'
        eventType = isFirstResponse ? 'FIRST_RESPONSE' : 'STATUS_CHANGED'
        description = isFirstResponse
          ? `First response — lead marked as Contacted by system dispatcher.`
          : `Lead marked as Contacted by system dispatcher.`
        break
      case 'schedule':
        newStatus = 'SCHEDULED'
        eventType = 'APPOINTMENT_CREATED'
        description = `Technician appointment site visit scheduled.`
        break
      case 'complete':
        newStatus = 'COMPLETED'
        eventType = 'LEAD_COMPLETED'
        description = `HVAC job completed successfully by on-site technician.`
        break
    }

    // 4. Fetch the custom webhook URL if saved in tenant profile
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('n8n_webhook_url')
      .eq('id', user.id)
      .single()

    const n8nWebhookUrl = profile?.n8n_webhook_url || process.env.N8N_WEBHOOK_URL

    // 5. Trigger n8n webhook securely on the backend server side
    if (n8nWebhookUrl) {
      try {
        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionType,
            leadId: lead.id,
            customerName: lead.customer_name,
            phone: lead.phone,
            email: lead.email,
            city: lead.city,
            issue: lead.issue_description,
            previousStatus: lead.status,
            newStatus: newStatus,
            triggeredBy: user.id
          }),
        })

        if (!response.ok) {
          logger.warn(`n8n webhook responded with non-2xx status on action: ${actionType}`, { status: response.status })
        }
      } catch (webhookErr) {
        logger.error(`Failed to dispatch background webhook on action: ${actionType}`, webhookErr as Error)
      }
    }

    // 6. Sync status update inside Supabase
    const statusChanged = newStatus !== lead.status

    if (statusChanged) {
      const { error: updateError } = await (supabase.from('hvac_leads') as any)
        .update({ status: newStatus })
        .eq('id', leadId)

      if (updateError) {
        throw new AppError(`Failed to update lead status: ${updateError.message}`, 'DB_UPDATE_ERROR')
      }
    }

    // 7. Insert primary event tracking history audit record
    const primaryEventError = await insertLeadEvent({
      supabase,
      leadId,
      eventType,
      description,
      metadata: {
        action_type: actionType,
        webhook_dispatched: !!n8nWebhookUrl
      },
      createdBy: user.id
    })

    if (primaryEventError) {
      logger.error(`Database failed to log lead event for action: ${actionType}`, primaryEventError as any)
    }

    // 8. Insert STATUS_CHANGED event when status actually changed
    if (statusChanged) {
      const statusEventErr = await insertLeadEvent({
        supabase,
        leadId,
        eventType: 'STATUS_CHANGED',
        description: `Lead status changed from ${lead.status} to ${newStatus}.`,
        metadata: { from: lead.status, to: newStatus, action_type: actionType },
        createdBy: user.id
      })

      if (statusEventErr) {
        logger.error('Failed to log STATUS_CHANGED event', statusEventErr as any)
      }
    }

    // 9. If lead completed, complete any active appointments
    if (newStatus === 'COMPLETED' && statusChanged) {
      try {
        const { data: activeApps } = await (supabase.from('appointments') as any)
          .select('id')
          .eq('lead_id', leadId)
          .in('status', ['Scheduled', 'Confirmed'])

        if (activeApps && activeApps.length > 0) {
          const appIds = activeApps.map((a: any) => a.id)

          await (supabase.from('appointments') as any)
            .update({ status: 'Completed', updated_at: new Date().toISOString() })
            .in('id', appIds)

          for (const app of activeApps) {
            const appEventErr = await insertLeadEvent({
              supabase,
              leadId,
              eventType: 'APPOINTMENT_COMPLETED',
              description: `Appointment completed as part of lead completion.`,
              metadata: { appointment_id: app.id, completed_via: 'lead_completion' },
              createdBy: user.id
            })
            if (appEventErr) {
              logger.error('Failed to log APPOINTMENT_COMPLETED event', appEventErr as any)
            }
          }
        }
      } catch (appErr) {
        logger.error('Failed to complete appointments during lead completion', appErr as Error)
      }
    }

    logger.info(`Lead action successfully executed: ${actionType} on lead ${leadId}`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')

    return { 
      success: true, 
      message: `Action ${actionType.toUpperCase()} completed successfully.`, 
      data: { newStatus } 
    }
  } catch (err) {
    return handleServerError(err, `Failed to execute ${actionType} action on lead.`)
  }
}

/**
 * FEATURE V3: CRM board native HTML5 Drag and Drop direct status updates.
 */
export async function updateLeadStatusDirectly(
  leadId: string, 
  newStatus: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'LOST', 
  previousStatus: string
): Promise<ServerResponse> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AppError('Unauthorized access. Please login.', 'UNAUTHORIZED')
    }

    // Update status in hvac_leads
    const { error: updateError } = await (supabase.from('hvac_leads') as any)
      .update({ status: newStatus })
      .eq('id', leadId)

    if (updateError) {
      throw new AppError(`Failed to sync status: ${updateError.message}`, 'DB_UPDATE_ERROR')
    }

    // Log the STATUS_CHANGED audit event with from/to metadata
    const statusEventErr = await insertLeadEvent({
      supabase,
      leadId,
      eventType: 'STATUS_CHANGED',
      description: `Lead status changed from ${previousStatus} to ${newStatus} via pipeline board.`,
      metadata: { from: previousStatus, to: newStatus },
      createdBy: user.id
    })

    if (statusEventErr) {
      logger.error('Failed to log status change event', statusEventErr as any)
    }

    // Emit lifecycle event for terminal statuses
    if (newStatus === 'COMPLETED') {
      const completedEventErr = await insertLeadEvent({
        supabase,
        leadId,
        eventType: 'LEAD_COMPLETED',
        description: `Lead completed from pipeline board.`,
        metadata: { previous_status: previousStatus },
        createdBy: user.id
      })
      if (completedEventErr) {
        logger.error('Failed to log LEAD_COMPLETED event', completedEventErr as any)
      }
    } else if (newStatus === 'LOST') {
      const lostEventErr = await insertLeadEvent({
        supabase,
        leadId,
        eventType: 'LEAD_LOST',
        description: `Lead marked as lost from pipeline board.`,
        metadata: { previous_status: previousStatus },
        createdBy: user.id
      })
      if (lostEventErr) {
        logger.error('Failed to log LEAD_LOST event', lostEventErr as any)
      }
    }

    logger.info(`Lead status directly modified: ${leadId} from ${previousStatus} to ${newStatus}`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')
    
    return { success: true, message: `Status updated successfully to ${newStatus}.` }
  } catch (err) {
    return handleServerError(err, 'Failed to update lead pipeline status.')
  }
}

/**
 * FEATURE V2: CRM Bulk update operations.
 */
export async function bulkUpdateLeadStatus(
  leadIds: string[], 
  newStatus: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'LOST'
): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('Unauthorized.', 'UNAUTHORIZED')

    if (!leadIds || leadIds.length === 0) {
      throw new AppError('No items selected for bulk modification.', 'BAD_REQUEST')
    }

    const { error } = await (supabase.from('hvac_leads') as any)
      .update({ status: newStatus })
      .in('id', leadIds)

    if (error) throw new AppError(`Bulk status sync failed: ${error.message}`, 'DB_UPDATE_ERROR')

    // Batch log bulk action history
    const { error: bulkEventErr } = await (supabase.from('lead_events') as any).insert(
      leadIds.map(id => ({
        lead_id: id,
        event_type: 'STATUS_CHANGED',
        description: `Lead status updated to ${newStatus} via bulk operations toolbar.`,
        metadata: { bulk: true, to: newStatus },
        created_by: user.id
      }))
    )

    if (bulkEventErr) {
      logger.error('Failed to record bulk lead change history events', bulkEventErr as any)
    }

    // Emit lifecycle events for terminal statuses
    if (newStatus === 'COMPLETED' || newStatus === 'LOST') {
      const lifecycleType = newStatus === 'COMPLETED' ? 'LEAD_COMPLETED' : 'LEAD_LOST'
      const lifecycleDesc = newStatus === 'COMPLETED'
        ? 'Lead completed via bulk operations.'
        : 'Lead marked as lost via bulk operations.'

      const { error: lifecycleErr } = await (supabase.from('lead_events') as any).insert(
        leadIds.map(id => ({
          lead_id: id,
          event_type: lifecycleType,
          description: lifecycleDesc,
          metadata: { bulk: true },
          created_by: user.id
        }))
      )

      if (lifecycleErr) {
        logger.error(`Failed to record ${lifecycleType} bulk events`, lifecycleErr as any)
      }
    }

    logger.info(`Bulk status update succeeded for ${leadIds.length} leads to ${newStatus}`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')
    
    return { success: true, message: `Bulk status update succeeded for ${leadIds.length} leads.` }
  } catch (err) {
    return handleServerError(err, 'Bulk status modification failed.')
  }
}

export async function bulkDeleteLeads(leadIds: string[]): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('Unauthorized.', 'UNAUTHORIZED')

    if (!leadIds || leadIds.length === 0) {
      throw new AppError('No items selected for deletion.', 'BAD_REQUEST')
    }

    const { error } = await (supabase.from('hvac_leads') as any)
      .delete()
      .in('id', leadIds)

    if (error) throw new AppError(`Bulk delete operations failed: ${error.message}`, 'DB_DELETE_ERROR')

    logger.info(`Bulk deleted ${leadIds.length} leads successfully from secure console`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')
    
    return { success: true, message: `Successfully deleted ${leadIds.length} leads.` }
  } catch (err) {
    return handleServerError(err, 'Bulk delete operation was rejected.')
  }
}

// ==========================================
// SPRINT 03: NEW DISPATCHER OPERATIONS ACTIONS
// ==========================================

/**
 * FEATURE S3: Booking appointments for site visits.
 * Standardized with Zod Schema Validation & Input Sanitization (Feature 3, 9)
 */
export async function scheduleAppointment(
  leadId: string,
  date: string,
  time: string,
  type: string,
  notes: string
): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('Unauthorized session. Please login.', 'UNAUTHORIZED')

    // Server-Side Zod validation & Sanitization (Feature 4, 9)
    const parsed = appointmentSchema.safeParse({ date, time, type, notes })
    if (!parsed.success) {
      const issueMessage = parsed.error.issues[0]?.message ?? 'Invalid input'
      throw new AppError(`Input validation failed: ${issueMessage}`, 'VALIDATION_ERROR')
    }
    const validated = parsed.data

    // 1. Insert appointment record
    const { error: appError } = await (supabase.from('appointments') as any)
      .insert({
        lead_id: leadId,
        appointment_date: validated.date,
        appointment_time: validated.time,
        appointment_type: validated.type,
        status: 'Scheduled',
        notes: validated.notes || null
      })

    if (appError) throw new AppError(`Failed to insert appointment record: ${appError.message}`, 'DB_INSERT_ERROR')

    // 2. Set the lead status in main table to SCHEDULED
    const { error: leadError } = await (supabase.from('hvac_leads') as any)
      .update({ status: 'SCHEDULED' })
      .eq('id', leadId)

    if (leadError) throw new AppError(`Failed to update main lead status: ${leadError.message}`, 'DB_UPDATE_ERROR')

    // 3. Log the APPOINTMENT_CREATED event
    await (supabase.from('lead_events') as any).insert({
      lead_id: leadId,
      event_type: 'APPOINTMENT_CREATED',
      description: `Technician site visit booked for ${validated.date} at ${validated.time} (${validated.type}).`,
      metadata: { appointment_date: validated.date, appointment_time: validated.time, appointment_type: validated.type },
      created_by: user.id
    })

    logger.info(`Appointment visit scheduled for lead ${leadId} on ${validated.date}`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')
    
    return { success: true, message: 'Site visit appointment scheduled successfully.' }
  } catch (err) {
    return handleServerError(err, 'Appointment scheduling was aborted.')
  }
}

/**
 * FEATURE S3: Adding internal dispatcher note widgets.
 * Standardized with Zod Schema Validation & Input Sanitization (Feature 3, 9)
 */
export async function addLeadNote(leadId: string, noteText: string): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized.', error: { code: 'UNAUTHORIZED' } }
    }

    // Server-Side Zod validation
    const parsed = noteSchema.safeParse({ note: noteText })
    if (!parsed.success) {
      return {
        success: false,
        message: 'Note text cannot be empty or blank',
        error: { code: 'VALIDATION_ERROR' }
      }
    }

    const validatedNote = parsed.data.note

    const { error: noteError } = await (supabase.from('lead_notes') as any)
      .insert({
        lead_id: leadId,
        user_id: user.id,
        note: validatedNote
      })

    if (noteError) throw new AppError(`Note insertion rejected: ${noteError.message}`, 'DB_INSERT_ERROR')

    // Record timeline audit trail
    await (supabase.from('lead_events') as any).insert({
      lead_id: leadId,
      event_type: 'NOTE_ADDED',
      description: `Dispatcher logged an internal note: "${validatedNote.substring(0, 30)}${validatedNote.length > 30 ? '...' : ''}"`,
      created_by: user.id
    })

    logger.info(`Note added successfully to lead ${leadId} by dispatcher ${user.id}`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')
    
    return { success: true, message: 'Internal dispatcher note saved successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to save dispatcher note.')
  }
}

export async function deleteLeadNote(noteId: string, leadId: string): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('Unauthorized.', 'UNAUTHORIZED')

    // Delete note
    const { error } = await (supabase.from('lead_notes') as any)
      .delete()
      .eq('id', noteId)

    if (error) throw new AppError(`Failed to delete note record: ${error.message}`, 'DB_DELETE_ERROR')

    // Record timeline audit
    await (supabase.from('lead_events') as any).insert({
      lead_id: leadId,
      event_type: 'STATUS_CHANGED',
      description: `Internal dispatch note record was deleted from lead console.`,
      created_by: user.id
    })

    logger.info(`Note ${noteId} deleted successfully from lead ${leadId}`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')
    
    return { success: true, message: 'Note deleted.' }
  } catch (err) {
    return handleServerError(err, 'Dispatcher note deletion was aborted.')
  }
}

/**
 * FEATURE S3: Setting follow-up reminders.
 * Standardized with Zod Schema Validation & Input Sanitization (Feature 3, 9)
 */
export async function createReminder(
  leadId: string,
  date: string,
  time: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  message: string
): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('Unauthorized.', 'UNAUTHORIZED')

    // Server-Side Zod validation & Sanitization (Feature 4, 9)
    const parsed = reminderSchema.safeParse({ date, time, priority, message })
    if (!parsed.success) {
      const issueMessage = parsed.error.issues[0]?.message ?? 'Invalid input'
      throw new AppError(`Input validation failed: ${issueMessage}`, 'VALIDATION_ERROR')
    }
    const validated = parsed.data

    // Insert reminder record securely
    const { error: remError } = await (supabase.from('reminders') as any)
      .insert({
        lead_id: leadId,
        reminder_date: validated.date,
        reminder_time: validated.time,
        priority: validated.priority,
        message: validated.message,
        status: 'Pending'
      })

    if (remError) throw new AppError(`Failed to save reminder record: ${remError.message}`, 'DB_INSERT_ERROR')

    // Record timeline audit
    await (supabase.from('lead_events') as any).insert({
      lead_id: leadId,
      event_type: 'NOTE_ADDED',
      description: `Dispatcher set a follow-up reminder: "${validated.message}" scheduled for ${validated.date} at ${validated.time}.`,
      created_by: user.id
    })

    logger.info(`Follow-up reminder successfully registered for lead ${leadId} on ${validated.date}`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')
    
    return { success: true, message: 'Follow-up reminder registered successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to create follow-up reminder.')
  }
}

export async function completeReminder(reminderId: string, leadId: string): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('Unauthorized.', 'UNAUTHORIZED')

    // Mark reminder Completed
    const { error } = await (supabase.from('reminders') as any)
      .update({ status: 'Completed', updated_at: new Date().toISOString() })
      .eq('id', reminderId)

    if (error) throw new AppError(`Failed to complete reminder record: ${error.message}`, 'DB_UPDATE_ERROR')

    // Record timeline audit
    await (supabase.from('lead_events') as any).insert({
      lead_id: leadId,
      event_type: 'STATUS_CHANGED',
      description: `Follow-up reminder was marked completed.`,
      created_by: user.id
    })

    logger.info(`Reminder ${reminderId} completed successfully on lead ${leadId}`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')

    return { success: true, message: 'Reminder marked completed.' }
  } catch (err) {
    return handleServerError(err, 'Failed to update reminder status.')
  }
}

/**
 * FEATURE S3: Update an existing appointment (date, time, type, notes).
 */
export async function updateAppointment(
  appointmentId: string,
  date: string,
  time: string,
  type: string,
  notes: string
): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('Unauthorized session.', 'UNAUTHORIZED')

    const parsed = appointmentUpdateSchema.safeParse({ date, time, type, notes })
    if (!parsed.success) {
      const issueMessage = parsed.error.issues[0]?.message ?? 'Invalid input'
      throw new AppError(`Validation failed: ${issueMessage}`, 'VALIDATION_ERROR')
    }
    const validated = parsed.data

    const { error: updateErr } = await (supabase.from('appointments') as any)
      .update({
        appointment_date: validated.date,
        appointment_time: validated.time,
        appointment_type: validated.type,
        notes: validated.notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)

    if (updateErr) throw new AppError(`Failed to update appointment: ${updateErr.message}`, 'DB_UPDATE_ERROR')

    logger.info(`Appointment ${appointmentId} updated successfully`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')

    return { success: true, message: 'Appointment updated successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to update appointment.')
  }
}

/**
 * FEATURE S3: Edit an existing note content.
 */
export async function updateLeadNote(noteId: string, noteText: string): Promise<ServerResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized.', error: { code: 'UNAUTHORIZED' } }
    }

    const parsed = noteUpdateSchema.safeParse({ note: noteText })
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? 'Invalid note',
        error: { code: 'VALIDATION_ERROR' }
      }
    }

    const validatedNote = parsed.data.note

    const { error: noteError } = await (supabase.from('lead_notes') as any)
      .update({ note: validatedNote })
      .eq('id', noteId)

    if (noteError) throw new AppError(`Note update rejected: ${noteError.message}`, 'DB_UPDATE_ERROR')

    logger.info(`Note ${noteId} updated successfully`)

    revalidatePath('/dashboard')
    revalidatePath('/leads')
    revalidatePath('/crm')

    return { success: true, message: 'Note updated successfully.' }
  } catch (err) {
    return handleServerError(err, 'Failed to update note.')
  }
}