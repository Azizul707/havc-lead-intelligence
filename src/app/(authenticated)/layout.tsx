/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import DashboardShell from '../../components/dashboard/DashboardShell'

// Cache user profile data to reduce Supabase calls
interface UserProfileCache {
  [userId: string]: {
    fullName: string;
    companyName: string;
    email: string;
    timestamp: number;
  };
}

const userProfileCache: UserProfileCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // ১. সেশন এবং কারেন্ট ইউজার চেক করা
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Check cache first
  const cacheKey = user.id;
  const cachedProfile = userProfileCache[cacheKey];
  
  let userProfile;
  
  if (cachedProfile && (Date.now() - cachedProfile.timestamp) < CACHE_TTL) {
    // Use cached profile
    userProfile = cachedProfile;
  } else {
    // ২. profiles টেবিল থেকে কোম্পানির প্রোফাইল ডেটা রিড করা (as any ব্যবহার করে never টাইপ এরর দূর করা হলো)
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('full_name, company_name')
      .eq('id', user.id)
      .single()

    userProfile = {
      fullName: (profile as any)?.full_name || 'Dispatch Executive',
      companyName: (profile as any)?.company_name || 'HVAC Services',
      email: user.email || '',
      timestamp: Date.now(),
    };

    // Update cache
    userProfileCache[cacheKey] = userProfile;
  }

  return (
    <DashboardShell userProfile={userProfile}>
      {children}
    </DashboardShell>
  )
}