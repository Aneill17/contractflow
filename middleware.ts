import { NextRequest, NextResponse } from 'next/server'

// Public routes — no auth required
const PUBLIC_PATHS = [
  '/login',
  '/request',
  '/client/',
  '/api/client/',
  '/api/booking',
  '/api/auth/',
  '/api/client-portal/',
  '/_next',
  '/favicon',
  '/v2-plan.html',
]

export function middleware(req: NextRequest) {
  // Auth temporarily disabled — allow all routes
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.html$|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)'],
}
