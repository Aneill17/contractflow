import { Resend } from 'resend'
import { Contract, calcTotal, formatDate } from './types'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'ContractFlow <contracts@yourdomain.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ── Quote Sent ────────────────────────────────────────────────────────────────
export async function sendQuoteEmail(contract: Contract, occupants: { name: string }[]) {
  const total = calcTotal(contract)
  const portalUrl = `${APP_URL}/client/${contract.client_token}`

  await resend.emails.send({
    from: FROM,
    to: contract.contact_email,
    subject: `Your Housing Quote — ${contract.reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="border-bottom:2px solid #C9A84C;padding-bottom:16px;margin-bottom:28px;">
          <h1 style="font-size:24px;font-weight:400;margin:0;">Corporate Housing Quote</h1>
          <p style="font-family:monospace;font-size:12px;color:#999;margin:4px 0 0;">${contract.reference}</p>
        </div>
        <p style="font-size:15px;">Hello ${contract.contact_name.split(' ')[0]},</p>
        <p style="font-size:14px;color:#555;line-height:1.7;">Please find your housing quote below. Review the details and click the button to approve or request changes.</p>
        <div style="background:#f9f7f4;border-radius:10px;padding:24px;margin:24px 0;">
          <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Location</td><td style="text-align:right;">${contract.location}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Units</td><td style="text-align:right;">${contract.units} units</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Occupants</td><td style="text-align:right;">${occupants.map(o => o.name).join(', ')}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Check-in</td><td style="text-align:right;">${formatDate(contract.start_date)}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Check-out</td><td style="text-align:right;">${formatDate(contract.end_date)}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Rate / Unit</td><td style="text-align:right;">$${contract.price_per_unit.toLocaleString()} / mo</td></tr>
            <tr style="border-top:2px solid #C9A84C44;"><td style="padding:12px 0 6px;font-size:15px;color:#C9A84C;">Total</td><td style="text-align:right;font-size:22px;color:#C9A84C;font-weight:600;padding:12px 0 6px;">$${total.toLocaleString()}</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin:32px 0;">
          <a href="${portalUrl}" style="background:#C9A84C;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;letter-spacing:0.06em;">Review & Approve Quote →</a>
        </div>
        <p style="font-size:12px;color:#aaa;text-align:center;font-family:monospace;">This link is unique to your account. Do not share it.</p>
      </div>
    `,
  })
}

// ── Confirmation Package ──────────────────────────────────────────────────────
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
        <p style="font-size:14px;color:#555;line-height:1.7;">Your housing has been confirmed. Please review your payment details below and proceed to sign the contract.</p>
        <div style="background:#f9f7f4;border-radius:10px;padding:24px;margin:24px 0;">
          <h3 style="font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#999;margin:0 0 16px;">Payment Details</h3>
          <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Amount Due</td><td style="text-align:right;font-size:20px;color:#C9A84C;font-weight:600;">$${total.toLocaleString()}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Due Date</td><td style="text-align:right;">${formatDate(contract.payment_due)}</td></tr>
            <tr><td style="color:#999;padding:6px 0;font-family:monospace;font-size:11px;">Method</td><td style="text-align:right;">${contract.payment_method}</td></tr>
          </table>
          <div style="border-top:1px solid #e0d9d0;margin-top:16px;padding-top:16px;">
            <p style="font-family:monospace;font-size:11px;color:#999;margin:0 0 8px;">EFT / Wire Transfer Details</p>
            <p style="font-family:monospace;font-size:11px;line-height:1.9;color:#555;margin:0;">
              Company: Your Company Name Inc.<br/>
              Bank: RBC Royal Bank<br/>
              Transit: 00123 · Account: 1234567-890<br/>
              Reference: ${contract.reference}
            </p>
          </div>
        </div>
        <div style="text-align:center;margin:32px 0;">
          <a href="${portalUrl}" style="background:#C9A84C;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">Review & Sign Contract →</a>
        </div>
      </div>
    `,
  })
}

// ── Contract Ready to Sign ────────────────────────────────────────────────────
export async function sendSigningEmail(contract: Contract) {
  const portalUrl = `${APP_URL}/client/${contract.client_token}`

  await resend.emails.send({
    from: FROM,
    to: contract.contact_email,
    subject: `Action Required: Sign Your Contract — ${contract.reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <h1 style="font-size:24px;font-weight:400;border-bottom:2px solid #4C7BC9;padding-bottom:12px;">Contract Ready to Sign</h1>
        <p style="font-size:14px;color:#555;line-height:1.7;">Hello ${contract.contact_name.split(' ')[0]}, your housing agreement for <strong>${contract.reference}</strong> is ready for your signature. Please review the terms and sign at your earliest convenience.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${portalUrl}" style="background:#4C7BC9;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">Review & Sign →</a>
        </div>
        <p style="font-size:12px;color:#aaa;text-align:center;font-family:monospace;">Reference: ${contract.reference} · ${contract.location}</p>
      </div>
    `,
  })
}

// ── Fully Executed ────────────────────────────────────────────────────────────
export async function sendExecutedEmail(contract: Contract) {
  const portalUrl = `${APP_URL}/client/${contract.client_token}`

  await resend.emails.send({
    from: FROM,
    to: contract.contact_email,
    subject: `Agreement Executed — ${contract.reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
        <div style="background:#f0faf5;border:1px solid #4CAF9333;border-radius:10px;padding:20px;margin-bottom:28px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">🏠</div>
          <h1 style="font-size:22px;font-weight:400;color:#2d8a60;margin:0;">Agreement Fully Executed</h1>
        </div>
        <p style="font-size:14px;color:#555;line-height:1.7;">Both parties have signed the agreement for <strong>${contract.reference}</strong>. Your guest services team will be in touch with check-in details and a welcome package ahead of your arrival on <strong>${formatDate(contract.start_date)}</strong>.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${portalUrl}" style="background:#C9A84C;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">View Your Agreement →</a>
        </div>
      </div>
    `,
  })
}
