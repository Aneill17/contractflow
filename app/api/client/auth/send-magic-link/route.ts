import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateMagicToken } from '@/lib/clientAuth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Elias Range Stays <contracts@team.eliasrangestays.ca>'
const APP_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://contractflow-omega.vercel.app'
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const supabase = createServerClient()

    // Check if this email is a registered client user
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('id, email, company_id')
      .eq('email', normalizedEmail)
      .single()

    // Always show "check your email" — don't leak whether email is registered
    if (clientUser) {
      // Generate token
      const token = generateMagicToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store token
      await supabase.from('magic_tokens').insert({
        token,
        email: normalizedEmail,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

      // Send email
      const loginUrl = `${APP_URL}/client/auth/verify?token=${token}`
      await resend.emails.send({
        from: FROM,
        to: normalizedEmail,
        subject: 'Your Client Portal Login Link — Elias Range Stays',
        html: `
          <div style="font-family:'Segoe UI',system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#1a1a1a;">
            <div style="background:#0B2540;border-radius:12px;padding:28px 24px;margin-bottom:28px;text-align:center;">
              <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#00BFA6;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:6px;">Elias Range Stays</div>
              <div style="color:#fff;font-weight:700;font-size:20px;">Client Portal</div>
            </div>
            <p style="font-size:15px;line-height:1.7;color:#334155;">You requested a login link for the ERS Client Portal. Click the button below to sign in — this link expires in <strong>1 hour</strong>.</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${loginUrl}" style="background:#00BFA6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;letter-spacing:0.04em;">Sign In to Portal →</a>
            </div>
            <p style="font-size:12px;color:#94a3b8;line-height:1.7;">If you didn't request this, you can safely ignore this email. This link can only be used once.</p>
            <p style="font-size:11px;color:#cbd5e1;font-family:'IBM Plex Mono',monospace;margin-top:24px;">Elias Range Stays · eliasrangestays.ca</p>
          </div>
        `,
      })
    }

    // Always return success (don't leak email validity)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-magic-link]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
