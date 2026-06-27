/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import DashboardClient from '../../../components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // ১. ইউজার অথেনটিকেশন চেক
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // ২. hvac_leads টেবিল থেকে এই ইউজারের সব লিড নিয়ে আসা
  const { data: leads, error } = await (supabase.from('hvac_leads') as any)
    .select('*')
    .or(`owner_id.eq.${user.id},owner_id.is.null`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
  }

  // ৩. Typescript ও ESLint এরর এড়াতে নিরাপদ রূপান্তর
  const safeLeads = (leads || []).map((lead: any) => ({
    ...lead,
    lead_score: Number(lead.lead_score || 0)
  }))

  return <DashboardClient initialLeads={safeLeads as any} />
}