// ── Client Portal Auth Helpers ────────────────────────────────
// Uses HMAC-SHA256 signed tokens stored in httpOnly cookies.
// No jose/jwt library needed — uses Node built-in crypto.

import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET = process.env.CLIENT_SESSION_SECRET || 'client-portal-fallback-secret-change-me'
const COOKIE_NAME = 'client_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface ClientSession {
  email: string
  company_id: string
  company_name: string
  role: 'admin' | 'member'
  iat: number
}

// ── Sign / Verify ─────────────────────────────────────────────

function sign(payload: ClientSession): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verify(token: string): ClientSession | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const data = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = createHmac('sha256', SECRET).update(data).digest('base64url')
    // Constant-time comparison
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as ClientSession
    return payload
  } catch {
    return null
  }
}

// ── Cookie helpers (Server Components / Route Handlers) ───────

export function setClientSessionCookie(session: ClientSession): string {
  const token = sign(session)
  const cookieParts = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${COOKIE_MAX_AGE}`,
  ]
  if (process.env.NODE_ENV === 'production') cookieParts.push('Secure')
  return cookieParts.join('; ')
}

export function clearClientSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

// ── Extract from NextRequest (middleware / route handlers) ────

export function getClientSessionFromRequest(req: NextRequest): ClientSession | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verify(token)
}

// ── Extract inside Server Components / Route Handlers ─────────
// Call this inside async server context only (not middleware)

export async function getClientSession(): Promise<ClientSession | null> {
  try {
    const cookieStore = cookies()
    const token = (cookieStore as any).get?.(COOKIE_NAME)?.value
    if (!token) return null
    return verify(token)
  } catch {
    return null
  }
}

// ── Generate a magic link token ───────────────────────────────

export function generateMagicToken(): string {
  return randomBytes(32).toString('hex')
}
