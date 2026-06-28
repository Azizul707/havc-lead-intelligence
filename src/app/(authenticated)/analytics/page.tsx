/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
// অ্যানালিটিক্স ক্লায়েন্ট ইম্পোর্ট
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // hvac_leads থেকে চার্টস ও মেট্রিক্সের জন্য ডেটা নিয়ে আসা
  const { data: leads, error } = await (supabase.from('hvac_leads') as any)
    .select('*')
    .or(`owner_id.eq.${user.id},owner_id.is.null`)

  if (error) {
    console.error('Error fetching leads for analytics:', error)
  }

  // lead: any ব্যবহার করে implicit any এরর সমাধান করা হলো
  const safeLeads = (leads || []).map((lead: any) => ({
    ...lead,
    lead_score: Number(lead.lead_score || 0)
  }))

  return <AnalyticsClient leads={safeLeads as any} />
}