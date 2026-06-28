/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import LeadsClient from './LeadsClient'

export default async function LeadsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: leads, error } = await (supabase.from('hvac_leads') as any)
    .select('*')
    .or(`owner_id.eq.${user.id},owner_id.is.null`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
  }

  return <LeadsClient initialLeads={(leads || []) as any} />
}