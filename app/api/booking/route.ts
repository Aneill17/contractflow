import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL || 'your@email.com'
const FROM = 'ContractFlow <onboarding@resend.dev>'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { occupants, ...contractData } = body

  // Generate reference number
  const { count } = await supabase.from('contracts').select('*', { count: 'exact', head: true })
  const year = new Date().getFullYear()
  const ref = `QT-${year}-${String((count || 0) + 1).padStart(4, '0')}`

  // Create contract at stage 0 (request received)
  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      ...contractData,
      reference: ref,
      stage: 0,
      price_per_unit: 0, // TBD — will be set when quote is generated
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert occupants
  if (occupants?.length) {
    await supabase.from('occupants').insert(
      occupants.map((name: string) => ({ contract_id: contract.id, name }))
    )
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    contract_id: contract.id,
    actor: contractData.contact_name,
    action: 'Housing request submitted via booking form',
  })

  // ── Email to internal team ──────────────────────────────────
  try {
    await resend.emails.send({
      from: FROM,
      to: TEAM_EMAIL,
      subject: `New Housing Request — ${ref}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
          <div style="background:#fff8e8;border:2px solid #C9A84C;border-radius:10px;padding:20px;margin-bottom:28px;">
            <h1 style="font-size:20px;font-weight:400;margin:0 0 4px;color:#1a1a1a;">🏠 New Housing Request</h1>
            <p style="font-family:monospace;font-size:12px;color:#C9A84C;margin:0;">${ref}</p>
          </div>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="color:#999;padding:8px 0;font-family:monospace;font-size:11px;text-transform:uppercase;">Company</td><td style="text-align:right;font-weight:500;">${contractData.client_name}</td></tr>
            <tr><td style="color:#999;padding:8px 0;font-family:monospace;font-size:11px;text-transform:uppercase;">Contact</td><td style="text-align:right;">${contractData.contact_name}</td></tr>
            <tr><td style="color:#999;padding:8px 0;font-family:monospace;font-size:11px;text-transform:uppercase;">Email</td><td style="text-align:right;">${contractData.contact_email}</td></tr>
            <tr><td style="color:#999;padding:8px 0;font-family:monospace;font-size:11px;text-transform:uppercase;">Location</td><td style="text-align:right;">${contractData.location}</td></tr>
            <tr><td style="color:#999;padding:8px 0;font-family:monospace;font-size:11px;text-transform:uppercase;">Units</td><td style="text-align:right;">${contractData.units}</td></tr>
            <tr><td style="color:#999;padding:8px 0;font-family:monospace;font-size:11px;text-transform:uppercase;">Check-in</td><td style="text-align:right;">${contractData.start_date}</td></tr>
            <tr><td style="color:#999;padding:8px 0;font-family:monospace;font-size:11px;text-transform:uppercase;">Check-out</td><td style="text-align:right;">${contractData.end_date}</td></tr>
            <tr><td style="color:#999;padding:8px 0;font-family:monospace;font-size:11px;text-transform:uppercase;">Occupants</td><td style="text-align:right;">${occupants?.join(', ') || 'None listed'}</td></tr>
            ${contractData.notes ? `<tr><td style="color:#999;padding:8px 0;font-family:monospace;font-size:11px;text-transform:uppercase;">Notes</td><td style="text-align:right;">${contractData.notes}</td></tr>` : ''}
          </table>
          <div style="text-align:center;margin:32px 0;">
            <a href="${APP_URL}" style="background:#C9A84C;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">Open in ContractFlow →</a>
          </div>
          <p style="font-size:12px;color:#aaa;text-align:center;font-family:monospace;">Log in to generate and send a quote to this client.</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Team notification email failed:', e)
  }

  // ── Confirmation email to client ────────────────────────────
  try {
    await resend.emails.send({
      from: FROM,
      to: contractData.contact_email,
      subject: `We've received your housing request — ${ref}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
          <h1 style="font-size:26px;font-weight:400;border-bottom:2px solid #C9A84C;padding-bottom:12px;">Request Received</h1>
          <p style="font-size:15px;line-height:1.7;">Hello ${contractData.contact_name.split(' ')[0]},</p>
          <p style="font-size:14px;color:#555;line-height:1.8;">Thank you for submitting your workforce housing request. Our team will review your requirements and have a formal quote back to you within <strong>24 hours</strong>.</p>
          <p style="font-size:14px;color:#555;">Your reference number is <strong style="color:#C9A84C;">${ref}</strong> — keep this handy for any follow-up.</p>
          <div style="background:#f9f7f4;border-radius:10px;padding:24px;margin:24px 0;">
            <p style="font-family:monospace;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 12px;">Your Request Summary</p>
            <table style="width:100%;font-size:13px;border-collapse:collapse;">
              <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Location</td><td style="text-align:right;">${contractData.location}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Units</td><td style="text-align:right;">${contractData.units}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Move-in</td><td style="text-align:right;">${contractData.start_date}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Move-out</td><td style="text-align:right;">${contractData.end_date}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Occupants</td><td style="text-align:right;">${occupants?.length || 0} listed</td></tr>
            </table>
          </div>
          <p style="font-size:13px;color:#777;line-height:1.7;">Once our team prepares your quote, you'll receive an email with a link to review, approve, and sign your agreement — all in one place. No back and forth required.</p>
          <p style="font-size:13px;color:#777;">Questions in the meantime? Reply to this email and we'll get back to you.</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Client confirmation email failed:', e)
  }

  return NextResponse.json({ reference: ref, id: contract.id }, { status: 201 })
}
