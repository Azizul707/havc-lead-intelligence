import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cache for Supabase client to avoid recreating it for every request
let cachedSupabaseClient: ReturnType<typeof createServerClient> | null = null

/**
 * Edge proxy routing helper to handle session refresh, route protection,
 * and secure redirection based on Supabase Authentication.
 * Optimized for performance with caching and reduced operations.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip proxy for static assets and API routes to reduce overhead
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Initialize Supabase client with caching
  if (!cachedSupabaseClient) {
    cachedSupabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
  }

  const supabase = cachedSupabaseClient

  // Define secure authorization boundaries
  const isAuthPage = pathname === '/login'
  const isProtectedPage = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/crm') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/profile')

  // Only check authentication for protected pages or auth pages
  if (isProtectedPage || isAuthPage) {
    // Fetch active user session securely via getUser() to prevent token spoofing
    const { data: { user } } = await supabase.auth.getUser()

    // Block unauthenticated requests attempting to access dispatcher console pages
    if (isProtectedPage && !user) {
      const url = new URL('/login', request.url)
      return NextResponse.redirect(url)
    }

    // Prevent authenticated users from accessing the login page redundantly
    if (isAuthPage && user) {
      const url = new URL('/dashboard', request.url)
      return NextResponse.redirect(url)
    }
  }

  return response
}

// Match all routing paths except Next.js bundle static resources and media files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
}