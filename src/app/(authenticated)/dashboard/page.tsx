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

  // ৩. ড্যাশবোর্ডের "Recent Activity" উইজেটের জন্য সর্বশেষ ১০টি লিড ইভেন্ট ফেচ করা
  const { data: recentEvents } = await (supabase.from('lead_events') as any)
    .select('*, hvac_leads(customer_name)')
    .order('created_at', { ascending: false })
    .limit(10)

  // ৪. টাইপ কম্প্যাটিবিলিটি প্রিপারেশন
  const safeLeads = (leads || []).map((lead: any) => ({
    ...lead,
    lead_score: Number(lead.lead_score || 0)
  }))

  return (
    <DashboardClient 
      initialLeads={safeLeads as any} 
      initialEvents={(recentEvents || []) as any} 
    />
  )
}