import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_COOKIE_NAME = 'admin_session'
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000

type AdminSessionPayload = {
  sub: 'admin'
  username: string
  iat: number
  exp: number
}

const encoder = new TextEncoder()

function getAdminEnv() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SESSION_SECRET

  return { username, password, secret }
}

function safeEqual(a: string, b: string) {
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)

  if (aBytes.length !== bBytes.length) return false

  let diff = 0
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i]
  }

  return diff === 0
}

function base64UrlEncode(bytes: Uint8Array) {
  let base64 = ''

  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64')
  } else {
    let binary = ''
    bytes.forEach((b) => {
      binary += String.fromCharCode(b)
    })
    base64 = btoa(binary)
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'))
  }

  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

async function getHmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function signPayload(payload: string, secret: string) {
  const key = await getHmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return base64UrlEncode(new Uint8Array(signature))
}

async function verifySignature(payload: string, signature: string, secret: string) {
  const key = await getHmacKey(secret)
  const signatureBytes = base64UrlDecode(signature)
  return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(payload))
}

export async function verifyAdminCredentials(username: string, password: string) {
  const { username: expectedUsername, password: expectedPassword } = getAdminEnv()

  if (!expectedUsername || !expectedPassword) {
    return false
  }

  return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword)
}

export async function createAdminSessionToken(username: string) {
  const { secret } = getAdminEnv()
  if (!secret) {
    throw new Error('Missing ADMIN_SESSION_SECRET')
  }

  const now = Date.now()
  const payload: AdminSessionPayload = {
    sub: 'admin',
    username,
    iat: now,
    exp: now + ADMIN_SESSION_TTL_MS,
  }

  const payloadPart = base64UrlEncode(encoder.encode(JSON.stringify(payload)))
  const signature = await signPayload(payloadPart, secret)

  return `${payloadPart}.${signature}`
}

export async function getAdminSessionFromToken(token: string) {
  const { secret } = getAdminEnv()
  if (!secret) {
    return null
  }

  const [payloadPart, signature] = token.split('.')
  if (!payloadPart || !signature) {
    return null
  }

  const isValid = await verifySignature(payloadPart, signature, secret)
  if (!isValid) {
    return null
  }

  const payloadBytes = base64UrlDecode(payloadPart)
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as AdminSessionPayload

  if (!payload || payload.sub !== 'admin') {
    return null
  }

  if (Date.now() > payload.exp) {
    return null
  }

  return payload
}

export async function getAdminSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return null
  return getAdminSessionFromToken(token)
}

export async function getAdminSessionFromCookies() {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value
  if (!token) return null
  return getAdminSessionFromToken(token)
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  }
}

export function getAdminLogoutCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}

export function getAdminCookieName() {
  return ADMIN_COOKIE_NAME
}
