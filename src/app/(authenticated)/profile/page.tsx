/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('id', user.id)
    .single()

  const initialData = {
    fullName: profile?.full_name || '',
    companyName: profile?.company_name || '',
    phone: profile?.phone || '',
    timezone: profile?.timezone || 'UTC',
    country: profile?.country || 'United States',
    email: user.email || ''
  }

  return <ProfileClient initialData={initialData} />
}