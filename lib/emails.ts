import { Resend } from 'resend'
import { Contract, calcTotal, formatDate } from './types'

const APP_BASE = process.env.NODE_ENV === 'production'
  ? 'https://contractflow-omega.vercel.app'
  : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL || 'Elias Range Stays <contracts@team.eliasrangestays.ca>'
const AUSTIN = 'austin@eliasrangestays.ca'
// Hardcoded production URL — avoids all Vercel env var / build-time substitution issues
const APP_URL = APP_BASE

// ── Quote Sent ────────────────────────────────────────────────
export async function sendQuoteEmail(contract: Contract, occupants: { name: string }[]) {
  const months = Math.max(1, Math.round(
    (new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime())
    / (1000 * 60 * 60 * 24 * 30)
  ))
  const baseTotal = contract.units * contract.price_per_unit * months
  const lineItems: any[] = (contract as any).quote_line_items || []
  const lineItemsTotal = lineItems.reduce((s: number, li: any) => s + (li.amount || 0), 0)
  const deposit = (contract as any).damage_deposit || 0
  const grandTotal = baseTotal + lineItemsTotal + deposit
  const quoteUrl = `${APP_URL}/client/${contract.client_token}/quote`

  await resend.emails.send({
    from: FROM,
    to: contract.contact_email,
    cc: [AUSTIN],
    subject: `Your Housing Quote is Ready — ${contract.reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="border-bottom:2px solid #C9A84C;padding-bottom:16px;margin-bottom:28px;">
          <h1 style="font-size:26px;font-weight:400;margin:0;">Your Housing Quote</h1>
          <p style="font-family:monospace;font-size:12px;color:#C9A84C;margin:6px 0 0;letter-spacing:0.1em;">${contract.reference}</p>
        </div>
        <p style="font-size:15px;line-height:1.7;">Hello ${contract.contact_name.split(' ')[0]},</p>
        <p style="font-size:14px;color:#555;line-height:1.8;">We've prepared your workforce housing quote based on your request. Please review the details below and click the button to view your full quote — you'll be able to approve it directly from there.</p>
        <div style="background:#f9f7f4;border-radius:10px;padding:24px;margin:24px 0;">
          <p style="font-family:monospace;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 16px;">Quote Summary</p>
          <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="color:#999;padding:7px 0;font-family:monospace;font-size:11px;border-bottom:1px solid #ece7df;">Location</td><td style="text-align:right;border-bottom:1px solid #ece7df;">${contract.location}</td></tr>
            <tr><td style="color:#999;padding:7px 0;font-family:monospace;font-size:11px;border-bottom:1px solid #ece7df;">Units</td><td style="text-align:right;border-bottom:1px solid #ece7df;">${contract.units} unit${contract.units > 1 ? 's' : ''}</td></tr>
            <tr><td style="color:#999;padding:7px 0;font-family:monospace;font-size:11px;border-bottom:1px solid #ece7df;">Occupants</td><td style="text-align:right;border-bottom:1px solid #ece7df;">${occupants.map(o => o.name).join(', ') || 'To be confirmed'}</td></tr>
            <tr><td style="color:#999;padding:7px 0;font-family:monospace;font-size:11px;border-bottom:1px solid #ece7df;">Check-in</td><td style="text-align:right;border-bottom:1px solid #ece7df;">${formatDate(contract.start_date)}</td></tr>
            <tr><td style="color:#999;padding:7px 0;font-family:monospace;font-size:11px;border-bottom:1px solid #ece7df;">Check-out</td><td style="text-align:right;border-bottom:1px solid #ece7df;">${formatDate(contract.end_date)}</td></tr>
            <tr><td style="color:#999;padding:7px 0;font-family:monospace;font-size:11px;border-bottom:1px solid #ece7df;">Rate / Unit / Month</td><td style="text-align:right;border-bottom:1px solid #ece7df;">$${contract.price_per_unit.toLocaleString()}</td></tr>
            ${deposit > 0 ? `<tr><td style="color:#999;padding:7px 0;font-family:monospace;font-size:11px;border-bottom:1px solid #ece7df;">Damage Deposit</td><td style="text-align:right;border-bottom:1px solid #ece7df;">$${deposit.toLocaleString()}</td></tr>` : ''}
            <tr><td style="padding:14px 0 6px;font-size:16px;color:#C9A84C;">Total Quote Value</td><td style="text-align:right;font-size:24px;color:#C9A84C;font-weight:600;padding:14px 0 6px;">$${grandTotal.toLocaleString()}</td></tr>
          </table>
        </div>
        <p style="font-size:13px;color:#777;line-height:1.8;">Your full quote — including what's included, payment schedule, and all terms — is available to view and approve at the link below. Approving your quote is the next step to securing your housing.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${quoteUrl}" style="background:#C9A84C;color:white;padding:16px 36px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;letter-spacing:0.06em;">View & Approve Your Quote →</a>
        </div>
        <p style="font-size:11px;color:#bbb;text-align:center;font-family:monospace;">This quote is valid for 30 days · ${contract.reference}</p>
      </div>
    `,
  })
}

// ── Quote Reminder ────────────────────────────────────────────
export async function sendQuoteReminderEmail(contract: Contract) {
  const months = Math.max(1, Math.round(
    (new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime())
    / (1000 * 60 * 60 * 24 * 30)
  ))
  const baseTotal = contract.units * contract.price_per_unit * months
  const lineItems: any[] = (contract as any).quote_line_items || []
  const lineItemsTotal = lineItems.reduce((s: number, li: any) => s + (li.amount || 0), 0)
  const deposit = (contract as any).damage_deposit || 0
  const grandTotal = baseTotal + lineItemsTotal + deposit
  const quoteUrl = `${APP_URL}/client/${contract.client_token}/quote`

  await resend.emails.send({
    from: FROM,
    to: contract.contact_email,
    cc: [AUSTIN],
    subject: `Reminder: Your Housing Quote Awaits Approval — ${contract.reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="background:#fff8e8;border:2px solid #C9A84C;border-radius:12px;padding:24px;margin-bottom:28px;">
          <h1 style="font-size:22px;font-weight:400;margin:0 0 6px;">Friendly Reminder</h1>
          <p style="font-family:monospace;font-size:11px;color:#C9A84C;margin:0;letter-spacing:0.1em;">${contract.reference}</p>
        </div>
        <p style="font-size:15px;line-height:1.7;">Hello ${contract.contact_name.split(' ')[0]},</p>
        <p style="font-size:14px;color:#555;line-height:1.8;">We wanted to follow up on the housing quote we sent for <strong>${contract.client_name}</strong>. Your quote is ready and awaiting your approval — approving it secures your team's housing and moves you to the contract stage.</p>
        <div style="background:#f9f7f4;border-radius:10px;padding:20px 24px;margin:24px 0;">
          <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Location</td><td style="text-align:right;">${contract.location}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Units</td><td style="text-align:right;">${contract.units} unit${contract.units > 1 ? 's' : ''}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Check-in</td><td style="text-align:right;">${formatDate(contract.start_date)}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Check-out</td><td style="text-align:right;">${formatDate(contract.end_date)}</td></tr>
            <tr style="border-top:1px solid #C9A84C22;"><td style="padding-top:12px;color:#C9A84C;font-size:15px;">Total</td><td style="text-align:right;font-size:22px;color:#C9A84C;font-weight:600;padding-top:12px;">$${grandTotal.toLocaleString()}</td></tr>
          </table>
        </div>
        <p style="font-size:14px;color:#555;line-height:1.8;"><strong>Next step:</strong> Click the button below to review your full quote — including all inclusions, terms, and payment details — and approve it to move forward. Once approved, we'll prepare your formal lease agreement for signing.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${quoteUrl}" style="background:#C9A84C;color:white;padding:16px 36px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;letter-spacing:0.06em;">Approve Your Quote & Secure Housing →</a>
        </div>
        <p style="font-size:12px;color:#aaa;line-height:1.7;text-align:center;">Questions? Reply to this email and we'll get back to you promptly.<br/>
        <span style="font-family:monospace;font-size:10px;">${contract.reference}</span></p>
      </div>
    `,
  })
}

// ── Contract Ready to Sign ────────────────────────────────────
export async function sendSigningEmail(contract: Contract) {
  const portalUrl = `${APP_URL}/client/${contract.client_token}`
  await resend.emails.send({
    from: FROM,
    to: contract.contact_email,
    subject: `Action Required: Sign Your Agreement — ${contract.reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="background:#f0f4ff;border:1px solid #4C7BC933;border-radius:10px;padding:20px;margin-bottom:28px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">📝</div>
          <h1 style="font-size:22px;font-weight:400;color:#1a1a1a;margin:0;">Your Agreement is Ready</h1>
          <p style="font-family:monospace;font-size:11px;color:#4C7BC9;margin:4px 0 0;">${contract.reference}</p>
        </div>
        <p style="font-size:14px;color:#555;line-height:1.8;">Hello ${contract.contact_name.split(' ')[0]}, your quote has been approved and your formal lease agreement is now ready for your signature. Please review and sign at your earliest convenience to secure your housing.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${portalUrl}" style="background:#4C7BC9;color:white;padding:16px 36px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">Review & Sign Agreement →</a>
        </div>
        <p style="font-size:12px;color:#aaa;text-align:center;font-family:monospace;">${contract.reference} · ${contract.location}</p>
      </div>
    `,
  })
}

// ── Fully Executed ────────────────────────────────────────────
// ── Quote Approved — notify Austin ───────────────────────────
export async function sendQuoteApprovedEmail(contract: Contract) {
  const dashboardUrl = APP_URL
  await resend.emails.send({
    from: FROM,
    to: 'austin@eliasrangestays.ca',
    subject: `✓ Quote Approved — ${contract.reference} — ${contract.client_name}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="background:#f0faf5;border:1px solid #4CAF9333;border-radius:10px;padding:24px;margin-bottom:28px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">✅</div>
          <h1 style="font-size:22px;font-weight:400;color:#2d8a60;margin:0;">Quote Approved</h1>
          <p style="font-family:monospace;font-size:11px;color:#4CAF93;margin:6px 0 0;">${contract.reference}</p>
        </div>
        <p style="font-size:15px;color:#333;line-height:1.8;">
          <strong>${contract.contact_name}</strong> at <strong>${contract.client_name}</strong> has approved their quote.
        </p>
        <div style="background:#f9f7f4;border-radius:10px;padding:20px 24px;margin:20px 0;font-size:13px;line-height:2;">
          <div><span style="color:#999;font-family:monospace;font-size:10px;text-transform:uppercase;">Location</span><br>${contract.location}</div>
          <div style="margin-top:12px;"><span style="color:#999;font-family:monospace;font-size:10px;text-transform:uppercase;">Dates</span><br>${formatDate(contract.start_date)} → ${formatDate(contract.end_date)}</div>
          <div style="margin-top:12px;"><span style="color:#999;font-family:monospace;font-size:10px;text-transform:uppercase;">Units / Value</span><br>${contract.units} unit${contract.units > 1 ? 's' : ''} · $${(contract.price_per_unit * contract.units).toLocaleString()}/mo</div>
        </div>
        <p style="font-size:14px;color:#555;line-height:1.8;">
          Log in to generate their contract with AI, review it, then send for signing.
        </p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${dashboardUrl}" style="background:#1B4353;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;letter-spacing:0.04em;">Open ContractFlow →</a>
        </div>
        <p style="font-family:monospace;font-size:10px;color:#bbb;text-align:center;margin-top:24px;">${contract.reference} · Elias Range Stays</p>
      </div>
    `,
  })
}

export async function sendExecutedEmail(contract: Contract) {
  const portalUrl = `${APP_URL}/client/${contract.client_token}`
  await resend.emails.send({
    from: FROM,
    to: contract.contact_email,
    subject: `Agreement Fully Executed — ${contract.reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="background:#f0faf5;border:1px solid #4CAF9333;border-radius:10px;padding:20px;margin-bottom:28px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">🏠</div>
          <h1 style="font-size:22px;font-weight:400;color:#2d8a60;margin:0;">Agreement Fully Executed</h1>
          <p style="font-family:monospace;font-size:11px;color:#4CAF93;margin:4px 0 0;">${contract.reference}</p>
        </div>
        <p style="font-size:14px;color:#555;line-height:1.8;">Both parties have signed. Your housing is confirmed for <strong>${formatDate(contract.start_date)}</strong>. Our guest services team will be in touch with your welcome package and check-in details ahead of your arrival.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${portalUrl}" style="background:#C9A84C;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">View Your Agreement →</a>
        </div>
      </div>
    `,
  })
}

// ── Confirmation Package ──────────────────────────────────────
export async function sendConfirmationEmail(contract: Contract) {
  const total = calcTotal(contract)
  const portalUrl = `${APP_URL}/client/${contract.client_token}`
  await resend.emails.send({
    from: FROM,
    to: contract.contact_email,
    subject: `Booking Confirmed — ${contract.reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="background:#f0faf5;border:1px solid #4CAF9333;border-radius:10px;padding:20px;margin-bottom:28px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">✓</div>
          <h1 style="font-size:22px;font-weight:400;color:#2d8a60;margin:0;">Booking Confirmed</h1>
          <p style="font-family:monospace;font-size:11px;color:#4CAF93;margin:4px 0 0;">${contract.reference}</p>
        </div>
        <p style="font-size:14px;color:#555;line-height:1.7;">Your housing has been confirmed. Please review your payment details below.</p>
        <div style="background:#f9f7f4;border-radius:10px;padding:24px;margin:24px 0;">
          <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Amount Due</td><td style="text-align:right;font-size:20px;color:#C9A84C;font-weight:600;">$${total.toLocaleString()}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Due Date</td><td style="text-align:right;">${formatDate(contract.payment_due)}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Method</td><td style="text-align:right;">${contract.payment_method}</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin:32px 0;">
          <a href="${portalUrl}" style="background:#C9A84C;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">View Portal →</a>
        </div>
      </div>
    `,
  })
}

// ── Booking Request — Confirmation to Booker ─────────────────
export async function sendBookingConfirmationEmail(params: {
  name: string
  company: string
  email: string
  phone?: string
  housing_need: string
  preferred_location: string
  num_people: number
  preferred_call_time: string
  how_heard: string
  referral_code?: string
}) {
  await resend.emails.send({
    from: FROM,
    to: params.email,
    subject: 'We received your inquiry — Elias Range Stays',
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="background:#0B2540;border-radius:14px;padding:28px 32px;margin-bottom:32px;text-align:center;">
          <div style="font-family:Arial Black,sans-serif;font-weight:900;font-size:22px;color:#ffffff;letter-spacing:0.08em;margin-bottom:6px;">ELIAS RANGE STAYS</div>
          <div style="font-size:11px;color:#00BFA6;letter-spacing:0.18em;font-weight:600;">Healthy Living · Stronger Communities</div>
        </div>
        <p style="font-size:16px;color:#1a1a1a;line-height:1.7;">Hi ${params.name.split(' ')[0]},</p>
        <p style="font-size:14px;color:#555;line-height:1.8;">Thanks for reaching out — we received your inquiry and will be in touch within <strong>24 hours</strong>.</p>
        <div style="background:#f0faf8;border:1px solid rgba(0,191,166,0.2);border-radius:12px;padding:24px;margin:24px 0;font-size:32px;text-align:center;">
          ✅
          <div style="font-size:16px;font-weight:700;color:#0B2540;margin-top:8px;">Request received!</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">We'll be in touch within 24 hours. Check your email for confirmation.</div>
        </div>
        <div style="background:#f9f7f4;border-radius:10px;padding:20px 24px;margin:20px 0;">
          <div style="font-family:monospace;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:14px;">Your Inquiry Summary</div>
          ${[
            ['Company', params.company],
            ['Location', params.preferred_location],
            ['People', String(params.num_people)],
            ['Housing Need', params.housing_need],
            ['Best Time to Call', params.preferred_call_time],
            params.referral_code ? ['Referral Code', params.referral_code] : null,
          ].filter((item): item is [string, string] => Array.isArray(item)).map(([l, v]) => `
            <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #ece7df;font-size:13px;">
              <span style="font-family:monospace;font-size:10px;color:#999;text-transform:uppercase;">${l}</span>
              <span style="color:#1a1a1a;text-align:right;max-width:60%;">${v}</span>
            </div>
          `).join('')}
        </div>
        <p style="font-size:13px;color:#777;line-height:1.8;">Questions in the meantime? Call Austin directly: <strong>(250) 719-8085</strong> or email <a href="mailto:austin@eliasrangestays.ca" style="color:#00BFA6;">austin@eliasrangestays.ca</a></p>
        <div style="border-top:1px solid #ece7df;margin-top:32px;padding-top:20px;text-align:center;">
          <div style="font-family:monospace;font-size:10px;color:#bbb;letter-spacing:0.1em;">ELIAS RANGE STAYS · Healthy Living · Stronger Communities</div>
          <div style="font-family:monospace;font-size:10px;color:#ccc;margin-top:4px;"><a href="${APP_URL}" style="color:#ccc;">eliasrangestays.ca</a></div>
        </div>
      </div>
    `,
  })
}

// ── Booking Request — Notification to Austin ─────────────────
export async function sendBookingNotificationEmail(params: {
  name: string
  company: string
  email: string
  phone?: string
  housing_need: string
  preferred_location: string
  num_people: number
  preferred_call_time: string
  how_heard: string
  referral_code?: string
}) {
  const source = params.referral_code ? `Referral (${params.referral_code})` : params.how_heard
  await resend.emails.send({
    from: FROM,
    to: AUSTIN,
    subject: `📞 New Booking Inquiry — ${params.name} at ${params.company}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="background:#f0faf8;border:1px solid rgba(0,191,166,0.25);border-radius:12px;padding:20px 24px;margin-bottom:28px;">
          <div style="font-size:28px;margin-bottom:8px;">📞</div>
          <div style="font-size:20px;font-weight:700;color:#0B2540;">New Booking Inquiry</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">${new Date().toLocaleString('en-CA', { dateStyle: 'full', timeStyle: 'short' })}</div>
        </div>
        <div style="background:#f9f7f4;border-radius:10px;padding:20px 24px;margin:20px 0;">
          ${[
            ['Name', params.name],
            ['Company', params.company],
            ['Email', params.email],
            ['Phone', params.phone || 'Not provided'],
            ['Location', params.preferred_location],
            ['People', String(params.num_people)],
            ['Best Time to Call', params.preferred_call_time],
            ['Source', source],
            ['Housing Need', params.housing_need],
          ].map(([l, v]) => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #ece7df;font-size:13px;">
              <span style="font-family:monospace;font-size:10px;color:#999;text-transform:uppercase;">${l}</span>
              <span style="color:#1a1a1a;text-align:right;max-width:65%;">${v}</span>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${APP_URL}" style="background:#0B2540;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">Open ContractFlow →</a>
        </div>
      </div>
    `,
  })
}

// ── Referral Email — to the Referee ──────────────────────────
export async function sendReferralEmail(params: {
  referee_name: string
  referee_email: string
  referee_company: string
  referring_name: string
  referring_company: string
  referring_company_since?: string   // e.g. "6 months"
  personal_note?: string
  referral_code: string
}) {
  const bookUrl = `${APP_URL}/book?ref=${params.referral_code}`
  const quoteUrl = `${APP_URL}/book?ref=${params.referral_code}&type=quote`
  const firstName = params.referee_name.split(' ')[0]

  await resend.emails.send({
    from: FROM,
    to: params.referee_email,
    subject: `${params.referring_name} thinks you could use Elias Range Stays`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">

        <!-- Header -->
        <div style="background:#0B2540;border-radius:14px 14px 0 0;padding:32px;text-align:center;margin-bottom:0;">
          <div style="font-family:Arial Black,sans-serif;font-weight:900;font-size:24px;color:#ffffff;letter-spacing:0.08em;margin-bottom:8px;">ELIAS RANGE STAYS</div>
          <div style="font-size:12px;color:#00BFA6;letter-spacing:0.18em;font-weight:600;">Healthy Living · Stronger Communities</div>
        </div>

        <!-- Body -->
        <div style="background:#ffffff;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 14px 14px;padding:36px 32px;">

          <p style="font-size:16px;color:#1a1a1a;line-height:1.7;margin-top:0;">Hi ${firstName},</p>

          <p style="font-size:14px;color:#555;line-height:1.8;">
            <strong>${params.referring_name}</strong> at <strong>${params.referring_company}</strong> thought you'd benefit from working with Elias Range Stays — and wanted to make a personal introduction.
          </p>

          <!-- Social Proof Block -->
          <div style="background:#f0faf8;border-left:4px solid #00BFA6;border-radius:0 10px 10px 0;padding:18px 22px;margin:24px 0;font-style:italic;font-size:14px;color:#334155;line-height:1.7;">
            "${params.referring_company} has been working with Elias Range Stays${params.referring_company_since ? ` for ${params.referring_company_since}` : ''} — housing their workforce with a single, fully-managed solution."
          </div>

          <hr style="border:none;border-top:1px solid #e8e8e8;margin:28px 0;" />

          <!-- What We Do -->
          <div style="margin:24px 0;">
            <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;margin-bottom:14px;">What We Do</div>
            ${[
              ['🏠', 'Workforce & Staff Housing', 'Away-from-home projects, any length'],
              ['✓', 'Fully Managed', 'Furniture, utilities, 24/7 support'],
              ['📄', 'Single Invoice', 'No landlord headaches'],
              ['🏥', 'Healthcare & Construction Specialists', 'BC & Canada-wide'],
            ].map(([icon, title, sub]) => `
              <div style="display:flex;gap:14px;margin-bottom:12px;align-items:flex-start;">
                <div style="font-size:18px;min-width:26px;line-height:1.4;">${icon}</div>
                <div>
                  <div style="font-size:14px;font-weight:700;color:#1a1a1a;">${title}</div>
                  <div style="font-size:12px;color:#64748b;">${sub}</div>
                </div>
              </div>
            `).join('')}
            <div style="background:#f9f7f4;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:12px;color:#64748b;font-style:italic;">
              Currently housing 34+ units across 6+ hospital regions.
            </div>
          </div>

          ${params.personal_note ? `
          <!-- Personal Note -->
          <div style="background:#fffbf0;border:1px solid rgba(245,158,11,0.25);border-radius:10px;padding:18px 20px;margin:24px 0;">
            <div style="font-family:monospace;font-size:10px;color:#F59E0B;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:8px;">A note from ${params.referring_name}</div>
            <p style="font-size:13px;color:#555;line-height:1.8;margin:0;font-style:italic;">"${params.personal_note}"</p>
          </div>
          ` : ''}

          <hr style="border:none;border-top:1px solid #e8e8e8;margin:28px 0;" />

          <!-- CTAs -->
          <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;margin-bottom:16px;text-align:center;">Two Ways to Get Started</div>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;">
            <a href="${bookUrl}" style="background:#0B2540;color:white;padding:14px 24px;border-radius:9px;text-decoration:none;font-family:monospace;font-size:12px;font-weight:600;display:inline-block;text-align:center;">📞 Book a Call</a>
            <a href="${quoteUrl}" style="background:#00BFA6;color:white;padding:14px 24px;border-radius:9px;text-decoration:none;font-family:monospace;font-size:12px;font-weight:600;display:inline-block;text-align:center;">🏠 Request a Housing Quote</a>
          </div>

          <div style="text-align:center;font-size:13px;color:#777;line-height:1.8;margin-bottom:8px;">
            Questions? Call Austin directly: <strong>(250) 719-8085</strong><br/>
            Or email: <a href="mailto:austin@eliasrangestays.ca" style="color:#00BFA6;">austin@eliasrangestays.ca</a>
          </div>
          <div style="text-align:center;font-size:12px;margin-bottom:20px;">
            <a href="https://eliasrangestays.ca" style="color:#00BFA6;text-decoration:none;">eliasrangestays.ca</a>
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid #e8e8e8;padding-top:18px;margin-top:8px;text-align:center;">
            <div style="font-family:monospace;font-size:10px;color:#bbb;letter-spacing:0.1em;">ELIAS RANGE STAYS · Healthy Living · Stronger Communities</div>
            <div style="font-size:11px;color:#ccc;margin-top:8px;">
              <a href="${APP_URL}/unsubscribe" style="color:#ccc;">Unsubscribe</a>
            </div>
          </div>

        </div>
      </div>
    `,
  })
}
