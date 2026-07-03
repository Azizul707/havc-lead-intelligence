import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge proxy routing: session refresh, route protection, and secure redirection.
 * Creates a per-request Supabase client to avoid cross-user cookie contamination.
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

  // Initialize Supabase client per-request (not module-cached)
  // to avoid sharing stale cookies between different users
  const supabase = createServerClient(
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
    // Fetch active user session via getUser() to prevent token spoofing
    const { data: { user } } = await supabase.auth.getUser()

    // Block unauthenticated requests attempting to access protected pages
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
