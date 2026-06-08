// ── Client Portal API Auth Helper ────────────────────────────
// Call this in API routes that are only for client portal users.

import { NextRequest, NextResponse } from 'next/server'
import { getClientSessionFromRequest, ClientSession } from '@/lib/clientAuth'

export type { ClientSession }

export function requireClientSession(
  req: NextRequest
): { session: ClientSession; error?: undefined } | { session?: undefined; error: NextResponse } {
  const session = getClientSessionFromRequest(req)
  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized — client session required' }, { status: 401 }),
    }
  }
  return { session }
}
