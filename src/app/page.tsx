import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'

export default async function IndexPage() {
  const supabase = await createClient()
  
  // সেশন ও কারেন্ট ইউজার চেক করা
  const { data: { user } } = await supabase.auth.getUser()

  // লগইন করা থাকলে ড্যাশবোর্ডে এবং না থাকলে লগইন পেজে অটো-রিডাইরেক্ট
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}