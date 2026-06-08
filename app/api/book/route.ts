import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendBookingConfirmationEmail, sendBookingNotificationEmail } from '@/lib/emails'
import { sendSlackNotification } from '@/lib/slack'

// POST /api/book — public booking request form
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    name,
    company,
    email,
    phone,
    housing_need,
    preferred_location,
    num_people,
    preferred_call_time,
    how_heard,
    referral_code,
  } = body

  if (!name || !company || !email) {
    return NextResponse.json({ error: 'Name, company, and email are required' }, { status: 400 })
  }

  const supabase = createServerClient()

  // If referral code present, look it up and link
  let referralId: string | null = null
  if (referral_code?.trim()) {
    const { data: ref } = await supabase
      .from('referrals')
      .select('id, status')
      .eq('referral_code', referral_code.trim())
      .single()
    if (ref) referralId = ref.id
  }

  // Auto-create a prospect contact in CRM
  const { data: contact } = await supabase
    .from('contacts')
    .insert({
      name,
      company,
      email,
      phone: phone || null,
      source: referralId ? 'referral' : 'inbound_inquiry',
      status: 'prospect',
      notes: [
        housing_need && `Housing need: ${housing_need}`,
        preferred_location && `Location: ${preferred_location}`,
        num_people && `People: ${num_people}`,
        preferred_call_time && `Best call time: ${preferred_call_time}`,
        how_heard && `Source: ${how_heard}`,
        referral_code && `Referral code: ${referral_code}`,
      ].filter(Boolean).join('\n'),
    })
    .select('id')
    .single()

  // If referral code, update the referral's contact_id + mark contacted
  if (referralId && contact?.id) {
    await supabase
      .from('referrals')
      .update({
        contact_id: contact.id,
        status: 'contacted',
        contacted_at: new Date().toISOString(),
      })
      .eq('id', referralId)
  }

  // Log to audit_logs if it exists (best-effort)
  await supabase.from('audit_logs').insert({
    action: `Booking inquiry from ${name} at ${company}`,
    actor: name,
    metadata: { email, company, how_heard, referral_code },
  }).maybeSingle()

  // ── Send emails ──────────────────────────────────────────────
  const emailParams = { name, company, email, phone, housing_need, preferred_location, num_people: num_people || 1, preferred_call_time, how_heard, referral_code }

  const emailResults = await Promise.allSettled([
    sendBookingConfirmationEmail(emailParams),
    sendBookingNotificationEmail(emailParams),
  ])
  emailResults.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`[api/book] email ${i} failed:`, r.reason)
  })

  // ── Slack notification ───────────────────────────────────────
  await sendSlackNotification(
    `📞 New booking request from *${name}* at *${company}* — ${preferred_location || 'location TBD'} — ${num_people || '?'} people${referral_code ? ` — Referral: ${referral_code}` : ''}`
  )

  return NextResponse.json({ ok: true })
}
