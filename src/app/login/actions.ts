'use server'

import { createClient } from '../../lib/supabase/server' // রিলেটিভ পাথ

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const companyName = formData.get('companyName') as string
  const supabase = await createClient()

  // ১. Auth ইউজার তৈরি করা
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    return { success: false, error: signUpError.message }
  }

  const user = data.user
  if (user) {
    // ২. Profiles টেবিলে বিজনেস ডেটা সেভ করা 
    // ESLint warning বাইপাস করার জন্য কমেন্ট যুক্ত করা হলো
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase.from('profiles') as any)
      .insert({
        id: user.id,
        full_name: fullName,
        company_name: companyName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      return { success: false, error: 'User created but profile setup failed: ' + profileError.message }
    }
  }

  return { success: true, message: 'Check your email for confirmation link if email confirmation is active.' }
}