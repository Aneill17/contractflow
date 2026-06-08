import { NextRequest, NextResponse } from 'next/server'
import { clearClientSessionCookie } from '@/lib/clientAuth'

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', clearClientSessionCookie())
  return response
}
