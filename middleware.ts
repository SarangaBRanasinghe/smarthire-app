import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getAdminSessionFromRequest } from '@/lib/admin/session'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return await handleAdminAccess(request)
  }

  return await updateSession(request)
}

async function handleAdminAccess(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isLoginRoute = pathname === '/admin/login' || pathname === '/api/admin/login'
  const isLogoutRoute = pathname === '/api/admin/logout'

  if (isLoginRoute) {
    return NextResponse.next()
  }

  const session = await getAdminSessionFromRequest(request)

  if (session) {
    if (pathname === '/admin/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/companies'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/admin')) {
    if (isLogoutRoute) {
      return NextResponse.next()
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.searchParams.set('next', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
