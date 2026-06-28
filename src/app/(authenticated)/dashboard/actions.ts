/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ১. V2 Quick Actions Trigger & Webhook Proxy Handler (ডাইনামিক সেটিংস ম্যাপ সহ)
export async function triggerLeadAction(
  leadId: string, 
  actionType: 'call' | 'email' | 'contact' | 'schedule' | 'complete'
) {
  const supabase = await createClient()

  // সেশন ভ্যালিডেশন
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized. Please sign in again.' }
  }

  // কারেন্ট লিড ডেটা রিড করা
  const { data: lead, error: fetchError } = await (supabase.from('hvac_leads') as any)
    .select('*')
    .eq('id', leadId)
    .single()

  if (fetchError || !lead) {
    return { success: false, error: 'Failed to retrieve lead details.' }
  }

  // অ্যাকশন অনুযায়ী স্ট্যাটাস ও ইভেন্ট টাইপ ম্যাপিং (DATABASE.md অনুযায়ী)
  let newStatus: string = lead.status
  let eventType = 'CUSTOMER_CONTACTED'
  let description = ''

  switch (actionType) {
    case 'call':
      eventType = 'CUSTOMER_CONTACTED'
      description = `Called customer ${lead.customer_name} via dispatch console.`
      break
    case 'email':
      eventType = 'EMAIL_SENT'
      description = `Emailed lead details to ${lead.customer_name}.`
      break
    case 'contact':
      newStatus = 'CONTACTED'
      eventType = 'CUSTOMER_CONTACTED'
      description = `Lead marked as Contacted by dispatch.`
      break
    case 'schedule':
      newStatus = 'SCHEDULED'
      eventType = 'JOB_SCHEDULED'
      description = `Technician appointment scheduled for customer.`
      break
    case 'complete':
      newStatus = 'COMPLETED'
      eventType = 'JOB_COMPLETED'
      description = `Job marked as completed successfully by technician.`
      break
  }

  // ইউজারের নিজস্ব প্রোফাইল সেটিংস থেকে ডাইনামিক Webhook URL রিড করা
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('n8n_webhook_url')
    .eq('id', user.id)
    .single()

  // সেটিংস পেজে সেভ করা কাস্টম URL ব্যবহার হবে, না থাকলে .env.local ফেইলব্যাক থাকবে
  const n8nWebhookUrl = profile?.n8n_webhook_url || process.env.N8N_WEBHOOK_URL

  // n8n Webhook সিকিউর কল (সার্ভার সাইড থেকে প্রক্সি)
  if (n8nWebhookUrl) {
    try {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
            },
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
        } catch (webhookErr) {
          console.error('Failed to dispatch webhook to n8n:', webhookErr)
        }
      }

  // স্ট্যাটাস পরিবর্তন হলে Supabase-এ আপডেট করা
  if (newStatus !== lead.status) {
    const { error: updateError } = await (supabase.from('hvac_leads') as any)
      .update({ status: newStatus })
      .eq('id', leadId)

    if (updateError) {
      return { success: false, error: 'Failed to update status: ' + updateError.message }
    }
  }

  // lead_events টেবিলে ইভেন্ট রেকর্ড যুক্ত করা
  const { error: eventError } = await (supabase.from('lead_events') as any)
    .insert({
      lead_id: leadId,
      event_type: eventType,
      description: description,
      metadata: {
        action_type: actionType,
        webhook_dispatched: !!n8nWebhookUrl
      },
      created_by: user.id
    })

  if (eventError) {
    console.error('Event logging error:', eventError)
  }

  revalidatePath('/dashboard')
  revalidatePath('/leads')

  return { success: true, newStatus }
}

// ২. V3 Drag & Drop Board সরাসরি স্ট্যাটাস আপডেট করার অ্যাকশন
export async function updateLeadStatusDirectly(
  leadId: string, 
  newStatus: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'LOST', 
  previousStatus: string
) {
  const supabase = await createClient()

  // সেশন চেক
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized.' }
  }

  // Supabase-এ স্ট্যাটাস আপডেট
  const { error: updateError } = await (supabase.from('hvac_leads') as any)
    .update({ status: newStatus })
    .eq('id', leadId)

  if (updateError) {
    return { success: false, error: 'Failed to update lead status: ' + updateError.message }
  }

  // lead_events টেবিলে STATUS_CHANGED ইভেন্ট রেকর্ড যুক্ত করা
  await (supabase.from('lead_events') as any).insert({
    lead_id: leadId,
    event_type: 'STATUS_CHANGED',
    description: `Lead status updated from ${previousStatus} to ${newStatus} via CRM board.`,
    metadata: {
      previous_status: previousStatus,
      new_status: newStatus
    },
    created_by: user.id
  })

  revalidatePath('/dashboard')
  revalidatePath('/leads')
  
  return { success: true }
}