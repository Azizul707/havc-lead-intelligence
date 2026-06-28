import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge proxy routing helper to handle session refresh, route protection,
 * and secure redirection based on Supabase Authentication.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Initialize Supabase client securely with cookies matching Next.js 16 requirements
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

  // Fetch active user session securely via getUser() to prevent token spoofing
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Define secure authorization boundaries
  const isAuthPage = pathname.startsWith('/login')
  const isProtectedPage = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/crm') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/profile')

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

  return response
}

// Match all routing paths except Next.js bundle static resources and media files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}