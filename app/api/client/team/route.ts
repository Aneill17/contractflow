import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireClientSession } from '@/lib/clientApiAuth'
import { generateMagicToken } from '@/lib/clientAuth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Elias Range Stays <contracts@team.eliasrangestays.ca>'
const APP_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://contractflow-omega.vercel.app'
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// GET /api/client/team — list team members for this company
export async function GET(req: NextRequest) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('client_users')
    .select('id, email, role, invited_by, created_at')
    .eq('company_id', session.company_id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST /api/client/team — invite a new member (admin only)
export async function POST(req: NextRequest) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth

  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const normalizedEmail = email.toLowerCase().trim()
  const supabase = createServerClient()

  // Check if already a member
  const { data: existing } = await supabase
    .from('client_users')
    .select('id')
    .eq('email', normalizedEmail)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 })
  }

  // Create the client user
  const { data: newUser, error } = await supabase
    .from('client_users')
    .insert({
      company_id: session.company_id,
      email: normalizedEmail,
      role: 'member',
      invited_by: session.email,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Generate magic token and send invite email
  const token = generateMagicToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days for invite

  await supabase.from('magic_tokens').insert({
    token,
    email: normalizedEmail,
    expires_at: expiresAt.toISOString(),
    used: false,
  })

  const loginUrl = `${APP_URL}/client/auth/verify?token=${token}`

  try {
    await resend.emails.send({
      from: FROM,
      to: normalizedEmail,
      subject: `You're invited to the ${session.company_name} Client Portal — Elias Range Stays`,
      html: `
        <div style="font-family:'Segoe UI',system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#1a1a1a;">
          <div style="background:#0B2540;border-radius:12px;padding:28px 24px;margin-bottom:28px;text-align:center;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#00BFA6;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:6px;">Elias Range Stays</div>
            <div style="color:#fff;font-weight:700;font-size:20px;">Client Portal Invite</div>
          </div>
          <p style="font-size:15px;line-height:1.7;color:#334155;">
            <strong>${session.email}</strong> has invited you to access the <strong>${session.company_name}</strong> client portal on Elias Range Stays.
          </p>
          <p style="font-size:14px;color:#64748b;line-height:1.7;">From the portal, you can view contracts, manage staff assignments, and request cleaning services.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${loginUrl}" style="background:#00BFA6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;letter-spacing:0.04em;">Accept Invite & Sign In →</a>
          </div>
          <p style="font-size:12px;color:#94a3b8;line-height:1.7;">This invite link expires in 7 days. If you didn't expect this invite, you can safely ignore it.</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('[team invite email]', e)
    // Don't fail the request if email fails — user is already created
  }

  return NextResponse.json(newUser, { status: 201 })
}

// DELETE /api/client/team?email=... — remove a member (admin only, can't remove self)
export async function DELETE(req: NextRequest) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth

  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  if (email.toLowerCase() === session.email.toLowerCase()) {
    return NextResponse.json({ error: "Can't remove yourself" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from('client_users')
    .delete()
    .eq('email', email.toLowerCase())
    .eq('company_id', session.company_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
