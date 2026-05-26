import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database, UserRole } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/auth/callback', '/auth/verify-email']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/api/public') || pathname.startsWith('/api/parse-cv') || pathname.startsWith('/auth/'))

  // If user is not logged in and trying to access protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, enforce role-based access
  if (user) {
    // Check if user is on login/register pages, redirect to appropriate dashboard
    if (pathname === '/login' || pathname === '/register') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: UserRole } | null }

      if (profile) {
        const url = request.nextUrl.clone()
        switch (profile.role) {
          case 'admin':
            url.pathname = '/admin/users'
            break
          case 'recruiter':
            url.pathname = '/recruiter/overview'
            break
          case 'job_seeker':
          default:
            url.pathname = '/seeker/overview'
            break
        }
        return NextResponse.redirect(url)
      }
    }

    // Role-based route protection
    if (pathname.startsWith('/seeker') || pathname.startsWith('/recruiter') || pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: UserRole } | null }

      if (profile) {
        const role = profile.role

        // Prevent seekers from accessing recruiter/admin routes
        if (pathname.startsWith('/recruiter') && role !== 'recruiter' && role !== 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/seeker/overview'
          return NextResponse.redirect(url)
        }

        // Prevent recruiters from accessing seeker/admin routes
        if (pathname.startsWith('/seeker') && role !== 'job_seeker' && role !== 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/recruiter/overview'
          return NextResponse.redirect(url)
        }

        // Admin-only routes
        if (pathname.startsWith('/admin') && role !== 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = role === 'recruiter' ? '/recruiter/overview' : '/seeker/overview'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}
