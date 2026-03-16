import { NextRequest, NextResponse } from 'next/server'

// Public routes — no auth required
const PUBLIC_PATHS = [
  '/login',
  '/request',         // public client intake form
  '/client/',         // client portal (token-gated at the page level)
  '/api/client/',     // client token API
  '/api/booking',     // public booking submission
  '/_next',
  '/favicon',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check for Supabase session cookie
  const hasSession =
    req.cookies.has('sb-dfcsqpgltjlbzdwxughu-auth-token') ||
    req.cookies.has(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)

  if (!hasSession) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
