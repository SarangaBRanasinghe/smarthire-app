import { NextResponse } from 'next/server'
import { getAdminCookieName, getAdminLogoutCookieOptions } from '@/lib/admin/session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(getAdminCookieName(), '', getAdminLogoutCookieOptions())
  return response
}
