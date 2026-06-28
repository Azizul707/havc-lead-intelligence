/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

// Define supported system roles as per authorization design
export type UserRole = 'ADMIN' | 'DISPATCHER' | 'CSR' | 'TECHNICIAN'

export interface UserSessionProfile {
  id: string
  email: string
  fullName: string | null
  companyName: string | null
  role: UserRole
}

/**
 * Asserts that a valid authenticated session exists on the server side.
 * Redirects to the login route if the session is missing or invalid.
 */
export async function requireAuth(): Promise<UserSessionProfile> {
  const supabase = await createClient()

  // Verify authenticated session from supabase cookies
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch linked profile metadata including the authorization role
  const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
    .select('full_name, company_name, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  return {
    id: user.id,
    email: user.email || '',
    fullName: profile.full_name,
    companyName: profile.company_name,
    role: profile.role as UserRole,
  }
}

/**
 * Asserts that the authenticated user possesses the correct authorization role.
 * Redirects to the default dashboard if authorization privileges are insufficient.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<UserSessionProfile> {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.role)) {
    // Redirect unprivileged users safely away
    redirect('/dashboard')
  }

  return session
}