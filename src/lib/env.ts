import { z } from 'zod'

// ১. ক্লায়েন্ট-সাইড এবং সার্ভার-সাইড উভয়ের জন্য প্রয়োজনীয় পাবলিক ভ্যারিয়েবল স্কিমা
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required and must be a valid key'),
})

// ২. শুধুমাত্র সার্ভার-সাইড সিক্রেট কি-সমূহের জন্য সেফ স্কিমা (Feature 6)
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, 'SUPABASE_SERVICE_ROLE_KEY is required on server side'),
  N8N_WEBHOOK_URL: z.string().url('N8N_WEBHOOK_URL must be a valid URL endpoint').optional(),
  OPENROUTER_API_KEY: z.string().min(5, 'OPENROUTER_API_KEY is required for AI processing').optional(),
})

// ৩. পাবলিক ভ্যারিয়েবল পার্স এবং ভ্যালিডেশন করা
const clientParsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

if (!clientParsed.success) {
  console.error('❌ Invalid Client Environment Variables:', clientParsed.error.flatten().fieldErrors)
  throw new Error('Missing or invalid client-side environment variables. Check .env.local file.')
}

const isServer = typeof window === 'undefined'

// ৪. সার্ভার সাইডে থাকলে সিক্রেট কি-সমূহ ভ্যালিডেট করা (কোনো type-reassignment বা any ছাড়া)
if (isServer) {
  const serverParsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  })

  if (!serverParsed.success) {
    console.error('❌ Invalid Server Environment Secrets:', serverParsed.error.flatten().fieldErrors)
    throw new Error('Missing or invalid server-side environment secrets. Please check production env config.')
  }
}

// ৫. সম্পূর্ণ টাইপ-সেফ ও এনি-ফ্রি (No any) এনভায়রনমেন্ট অবজেক্ট এক্সপোর্ট
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: clientParsed.data.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: clientParsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY || '' : '',
  N8N_WEBHOOK_URL: isServer ? process.env.N8N_WEBHOOK_URL || '' : '',
  OPENROUTER_API_KEY: isServer ? process.env.OPENROUTER_API_KEY || '' : '',
} as const