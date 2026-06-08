import { NextRequest, NextResponse } from 'next/server'
import { requireClientSession } from '@/lib/clientApiAuth'

// GET /api/client/me — return the current client session info
export async function GET(req: NextRequest) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth
  return NextResponse.json({
    email: session.email,
    company_id: session.company_id,
    company_name: session.company_name,
    role: session.role,
  })
}
