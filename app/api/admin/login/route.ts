import { NextResponse } from 'next/server'
import {
  createAdminSessionToken,
  getAdminCookieName,
  getAdminSessionCookieOptions,
  verifyAdminCredentials,
} from '@/lib/admin/session'

export async function POST(request: Request) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const isValid = await verifyAdminCredentials(String(username), String(password))
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  try {
    const token = await createAdminSessionToken(String(username))
    const response = NextResponse.json({ ok: true })
    response.cookies.set(getAdminCookieName(), token, getAdminSessionCookieOptions())
    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}
