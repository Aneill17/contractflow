import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { setClientSessionCookie, ClientSession } from '@/lib/clientAuth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/client/login?error=missing_token', req.url))
  }

  const supabase = createServerClient()

  // Look up token
  const { data: magicToken, error } = await supabase
    .from('magic_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !magicToken) {
    return NextResponse.redirect(new URL('/client/login?error=invalid_token', req.url))
  }

  // Check not used
  if (magicToken.used) {
    return NextResponse.redirect(new URL('/client/login?error=token_used', req.url))
  }

  // Check not expired
  if (new Date(magicToken.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/client/login?error=token_expired', req.url))
  }

  // Mark token as used
  await supabase
    .from('magic_tokens')
    .update({ used: true })
    .eq('id', magicToken.id)

  // Look up client user
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('id, email, company_id, role, client_companies(name)')
    .eq('email', magicToken.email)
    .single()

  if (!clientUser) {
    return NextResponse.redirect(new URL('/client/login?error=user_not_found', req.url))
  }

  const companyName = (clientUser.client_companies as any)?.name || ''

  // Build session
  const session: ClientSession = {
    email: clientUser.email,
    company_id: clientUser.company_id,
    company_name: companyName,
    role: clientUser.role as 'admin' | 'member',
    iat: Date.now(),
  }

  // Set cookie and redirect to portal dashboard
  const APP_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://contractflow-omega.vercel.app'
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const response = NextResponse.redirect(new URL('/client/portal', req.url))
  response.headers.set('Set-Cookie', setClientSessionCookie(session))
  return response
}
