import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../../types/database.types' // রিলেটিভ পাথ দিয়ে পরিবর্তন করা হলো

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )