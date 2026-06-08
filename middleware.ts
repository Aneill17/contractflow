import { NextRequest, NextResponse } from 'next/server'
import { getClientSessionFromRequest } from '@/lib/clientAuth'

// Client portal protected routes
const CLIENT_PORTAL_PREFIX = '/client/portal'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect /client/portal/* routes — check client_session cookie
  // Login page is always public
  if (
    pathname.startsWith(CLIENT_PORTAL_PREFIX) &&
    !pathname.startsWith('/client/portal/login')
  ) {
    const session = getClientSessionFromRequest(req)
    if (!session) {
      const loginUrl = new URL('/client/portal/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Everything else — internal dashboard uses Supabase auth client-side
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.html$|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)'],
}
