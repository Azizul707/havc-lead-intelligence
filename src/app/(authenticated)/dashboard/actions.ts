/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function triggerLeadAction(
  leadId: string, 
  actionType: 'call' | 'email' | 'contact' | 'schedule' | 'complete'
) {
  const supabase = await createClient()

  // ১. সেশন ভ্যালিডেশন
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized. Please sign in again.' }
  }

  // ২. কারেন্ট লিড ডেটা রিড করা
  const { data: lead, error: fetchError } = await (supabase.from('hvac_leads') as any)
    .select('*')
    .eq('id', leadId)
    .single()

  if (fetchError || !lead) {
    return { success: false, error: 'Failed to retrieve lead details.' }
  }

  // ৩. অ্যাকশন অনুযায়ী স্ট্যাটাস ও ইভেন্ট টাইপ ম্যাপিং (DATABASE.md অনুযায়ী)
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

  // ৪. n8n Webhook সিকিউর কল (সার্ভার সাইড থেকে প্রক্সি)
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
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
      // Webhook ফেইল করলেও ডাটাবেস যাতে আপডেট হয়, সে ব্যবস্থা রাখা হলো
    }
  }

  // ৫. স্ট্যাটাস পরিবর্তন হলে Supabase-এ আপডেট করা
  if (newStatus !== lead.status) {
    const { error: updateError } = await (supabase.from('hvac_leads') as any)
      .update({ status: newStatus })
      .eq('id', leadId)

    if (updateError) {
      return { success: false, error: 'Failed to update status: ' + updateError.message }
    }
  }

  // ৬. lead_events টেবিলে ইভেন্ট রেকর্ড যুক্ত করা
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

  // ৭. ড্যাশবোর্ডের ডেটা রিফ্রেশ করা
  revalidatePath('/dashboard')

  return { success: true, newStatus }
}