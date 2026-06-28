/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import CRMClient from './CRMClient'

export default async function CRMPage() {
  const supabase = await createClient()

  // ১. ইউজার সেশন চেক
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // ২. Supabase থেকে রিয়েল-টাইম সব লিড নিয়ে আসা
  const { data: leads, error } = await (supabase.from('hvac_leads') as any)
    .select('*')
    .or(`owner_id.eq.${user.id},owner_id.is.null`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching CRM leads:', error)
  }

  // ৩. ডেটা সেফ কাস্টিং করে ক্লায়েন্ট বোর্ডে পাঠানো
  const safeLeads = (leads || []).map((lead: any) => ({
    ...lead,
    lead_score: Number(lead.lead_score || 0)
  }))

  return <CRMClient initialLeads={safeLeads as any} />
}