import { NextRequest, NextResponse } from 'next/server'

// Public routes — no auth required
const PUBLIC_PATHS = [
  '/login',
  '/request',
  '/client/',
  '/api/client/',
  '/api/booking',
  '/api/auth/',
  '/_next',
  '/favicon',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check for any Supabase auth cookie — fast, no network call
  // API routes do full JWT validation; this just gates the UI
  const cookies = req.cookies.getAll()
  const hasSession = cookies.some(
    c => c.name.includes('auth-token') && c.value.length > 10
  )

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
