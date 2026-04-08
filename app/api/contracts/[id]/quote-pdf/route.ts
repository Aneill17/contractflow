import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { Resend } from 'resend'
import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Elias Range Stays <contracts@team.eliasrangestays.ca>'
const AUSTIN = 'austin@eliasrangestays.ca'
const APP_URL = 'https://contractflow-omega.vercel.app'

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatCurrency(n: number) {
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildQuoteHTML(contract: any): string {
  const months = Math.max(1, Math.round(
    (new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime())
    / (1000 * 60 * 60 * 24 * 30)
  ))
  const baseTotal = contract.units * contract.price_per_unit * months
  const lineItems: any[] = contract.quote_line_items || []
  const lineItemsTotal = lineItems.reduce((s: number, li: any) => s + (li.amount || 0), 0)
  const deposit = contract.damage_deposit || 0
  const grandTotal = baseTotal + lineItemsTotal + deposit
  const quoteUrl = `${APP_URL}/client/${contract.client_token}/quote`

  const lineItemsHTML = lineItems.length > 0 ? lineItems.map((li: any) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #ece7df;color:#333;">${li.description}</td>
      <td style="padding:8px 0;border-bottom:1px solid #ece7df;text-align:right;color:#333;">${formatCurrency(li.amount)}</td>
    </tr>`).join('') : ''

  const inclusionsList = (contract.inclusions || '').split('\n').filter(Boolean)
    .map((i: string) => `<li style="margin-bottom:4px;">${i}</li>`).join('')
  const exclusionsList = (contract.exclusions || '').split('\n').filter(Boolean)
    .map((i: string) => `<li style="margin-bottom:4px;">${i}</li>`).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; }
  .page { max-width: 760px; margin: 0 auto; padding: 48px 40px; }
  .header { border-bottom: 3px solid #0B2540; padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-family: 'Segoe UI', sans-serif; }
  .brand-name { font-size: 20px; font-weight: 700; color: #0B2540; }
  .brand-tag { font-size: 11px; color: #00BFA6; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 3px; }
  .ref-block { text-align: right; }
  .ref-label { font-family: monospace; font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.1em; }
  .ref-num { font-family: monospace; font-size: 18px; color: #C9A84C; font-weight: 600; }
  .ref-date { font-family: monospace; font-size: 11px; color: #999; margin-top: 4px; }
  h1 { font-size: 30px; font-weight: 400; color: #0B2540; margin-bottom: 6px; }
  .subtitle { font-size: 13px; color: #777; font-style: italic; margin-bottom: 32px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .party { background: #f9f7f4; border-radius: 8px; padding: 18px 20px; }
  .party-label { font-family: monospace; font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px; }
  .party-name { font-size: 15px; font-weight: 600; color: #0B2540; margin-bottom: 4px; }
  .party-detail { font-size: 13px; color: #555; line-height: 1.6; }
  .section { margin-bottom: 28px; }
  .section-title { font-family: monospace; font-size: 10px; color: #0B2540; text-transform: uppercase; letter-spacing: 0.14em; border-bottom: 1px solid #e0dbd4; padding-bottom: 8px; margin-bottom: 14px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .summary-table td { padding: 9px 0; border-bottom: 1px solid #ece7df; }
  .summary-table td:last-child { text-align: right; }
  .summary-table .label { color: #999; font-family: monospace; font-size: 11px; }
  .summary-table .val { color: #333; }
  .total-row td { font-size: 16px; font-weight: 600; color: #C9A84C; padding-top: 14px; border-bottom: none; }
  .incl-list { font-size: 13px; color: #555; line-height: 1.8; padding-left: 18px; }
  .notes-box { background: #f9f7f4; border-radius: 8px; padding: 16px 18px; font-size: 13px; color: #555; line-height: 1.7; font-style: italic; }
  .cta-block { background: #0B2540; border-radius: 10px; padding: 28px 32px; text-align: center; margin-top: 36px; }
  .cta-title { font-size: 17px; font-weight: 400; color: white; margin-bottom: 8px; }
  .cta-sub { font-size: 13px; color: rgba(255,255,255,0.55); margin-bottom: 20px; }
  .cta-url { display: inline-block; background: #00BFA6; color: #0B2540; font-family: monospace; font-size: 13px; font-weight: 600; padding: 12px 28px; border-radius: 6px; text-decoration: none; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ece7df; display: flex; justify-content: space-between; font-family: monospace; font-size: 11px; color: #bbb; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-name">Elias Range Stays</div>
      <div class="brand-tag">Healthy Living · Stronger Communities</div>
    </div>
    <div class="ref-block">
      <div class="ref-label">Quote Reference</div>
      <div class="ref-num">${contract.reference}</div>
      <div class="ref-date">Prepared: ${formatDate(new Date().toISOString().split('T')[0])}</div>
    </div>
  </div>

  <h1>Workforce Housing Quote</h1>
  <p class="subtitle">Prepared for ${contract.client_name} — valid for 30 days from date of issue.</p>

  <!-- Parties -->
  <div class="parties">
    <div class="party">
      <div class="party-label">Provider</div>
      <div class="party-name">Elias Range Stays</div>
      <div class="party-detail">103-1504 Scott Crescent<br>Squamish, BC V8B 1G7<br>austin@eliasrangestays.ca<br>(250) 719-8085</div>
    </div>
    <div class="party">
      <div class="party-label">Client</div>
      <div class="party-name">${contract.client_name}</div>
      <div class="party-detail">${contract.contact_name}<br>${contract.contact_email}${contract.contact_phone ? '<br>' + contract.contact_phone : ''}</div>
    </div>
  </div>

  <!-- Summary -->
  <div class="section">
    <div class="section-title">Quote Summary</div>
    <table class="summary-table">
      <tr><td class="label">Location</td><td class="val">${contract.location}</td></tr>
      <tr><td class="label">Number of Units</td><td class="val">${contract.units} unit${contract.units !== 1 ? 's' : ''}</td></tr>
      ${contract.num_staff ? `<tr><td class="label">Number of Staff</td><td class="val">${contract.num_staff}</td></tr>` : ''}
      <tr><td class="label">Move-in Date</td><td class="val">${formatDate(contract.start_date)}</td></tr>
      <tr><td class="label">Move-out Date</td><td class="val">${formatDate(contract.end_date)}</td></tr>
      <tr><td class="label">Term</td><td class="val">${months} month${months !== 1 ? 's' : ''}</td></tr>
      <tr><td class="label">Payment Schedule</td><td class="val">${contract.payment_schedule || 'Monthly'}</td></tr>
      ${contract.payment_method ? `<tr><td class="label">Payment Method</td><td class="val">${contract.payment_method}</td></tr>` : ''}
    </table>
  </div>

  <!-- Pricing -->
  <div class="section">
    <div class="section-title">Pricing Breakdown</div>
    <table class="summary-table">
      <tr>
        <td class="label">Base Rate</td>
        <td class="val">${formatCurrency(contract.price_per_unit)} / unit / month</td>
      </tr>
      <tr>
        <td class="label">Base Total (${contract.units} units × ${months} months)</td>
        <td class="val">${formatCurrency(baseTotal)}</td>
      </tr>
      ${lineItemsHTML}
      ${deposit > 0 ? `<tr><td class="label">Damage Deposit (refundable)</td><td class="val">${formatCurrency(deposit)}</td></tr>` : ''}
      <tr class="total-row">
        <td>Total Amount</td>
        <td>${formatCurrency(grandTotal)}</td>
      </tr>
    </table>
  </div>

  <!-- Inclusions / Exclusions -->
  <div class="two-col">
    ${inclusionsList ? `<div class="section">
      <div class="section-title">What's Included</div>
      <ul class="incl-list">${inclusionsList}</ul>
    </div>` : ''}
    ${exclusionsList ? `<div class="section">
      <div class="section-title">Not Included</div>
      <ul class="incl-list">${exclusionsList}</ul>
    </div>` : ''}
  </div>

  <!-- Request Details -->
  <div class="section">
    <div class="section-title">Original Request Details</div>
    <table class="summary-table">
      ${contract.num_staff ? `<tr><td class="label">Number of Staff</td><td class="val">${contract.num_staff}</td></tr>` : ''}
      ${contract.work_site_address ? `<tr><td class="label">Work Site Address</td><td class="val">${contract.work_site_address}</td></tr>` : ''}
      ${contract.current_housing_rate ? `<tr><td class="label">Current Housing Rate</td><td class="val">${formatCurrency(contract.current_housing_rate)} / night</td></tr>` : ''}
      ${contract.current_housing_location ? `<tr><td class="label">Current Housing Provider</td><td class="val">${contract.current_housing_location}</td></tr>` : ''}
      ${(contract.current_housing_rate && contract.units && months) ? `<tr><td class="label">Current Monthly Cost (est.)</td><td class="val">${formatCurrency(contract.current_housing_rate * 30 * contract.units)}</td></tr>` : ''}
      ${(contract.current_housing_rate && contract.units && months) ? `<tr><td class="label" style="color:#007A3D;">Estimated Savings with ERS</td><td class="val" style="color:#007A3D;font-weight:600;">${formatCurrency((contract.current_housing_rate * 30 * contract.units * months) - (contract.price_per_unit * contract.units * months))} over ${months} month${months !== 1 ? 's' : ''}</td></tr>` : ''}
    </table>
  </div>

  ${contract.notes ? `<div class="section">
    <div class="section-title">Client Notes</div>
    <div class="notes-box">${contract.notes}</div>
  </div>` : ''}

  ${contract.quote_notes ? `<div class="section">
    <div class="section-title">ERS Notes</div>
    <div class="notes-box">${contract.quote_notes}</div>
  </div>` : ''}

  <!-- CTA -->
  <div class="cta-block">
    <div class="cta-title">Ready to approve this quote?</div>
    <div class="cta-sub">Review the full interactive quote and approve it online — no printing required.</div>
    <a class="cta-url" href="${quoteUrl}">View & Approve Quote Online →</a>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Elias Range Stays · eliasrangestays.ca</span>
    <span>${contract.reference} · ${formatDate(new Date().toISOString().split('T')[0])}</span>
  </div>

</div>
</body>
</html>`
}

// GET — generate and return a real PDF
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const html = buildQuoteHTML(contract)

  const executablePath = await chromium.executablePath(
    'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
  )

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: true,
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdf = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  })

  await browser.close()

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Quote-${contract.reference}.pdf"`,
    }
  })
}

// POST — send the quote as email with PDF-ready HTML attachment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await req.json().catch(() => ({}))
  const sendToClient = body.send_to_client !== false // default true

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const html = buildQuoteHTML(contract)
  const quoteUrl = `https://contractflow-omega.vercel.app/client/${contract.client_token}/quote`

  const months = Math.max(1, Math.round(
    (new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime())
    / (1000 * 60 * 60 * 24 * 30)
  ))
  const baseTotal = contract.units * contract.price_per_unit * months
  const lineItems: any[] = contract.quote_line_items || []
  const lineItemsTotal = lineItems.reduce((s: number, li: any) => s + (li.amount || 0), 0)
  const deposit = contract.damage_deposit || 0
  const grandTotal = baseTotal + lineItemsTotal + deposit

  const recipients = sendToClient
    ? [contract.contact_email]
    : []
  recipients.push(AUSTIN) // always CC Austin

  try {
    await resend.emails.send({
      from: FROM,
      to: recipients,
      subject: `Your Housing Quote — ${contract.reference} · ${contract.client_name}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
          <div style="border-bottom:2px solid #C9A84C;padding-bottom:16px;margin-bottom:28px;">
            <h1 style="font-size:24px;font-weight:400;margin:0;">Workforce Housing Quote</h1>
            <p style="font-family:monospace;font-size:12px;color:#C9A84C;margin:6px 0 0;">${contract.reference}</p>
          </div>
          <p style="font-size:15px;">Hello ${contract.contact_name.split(' ')[0]},</p>
          <p style="font-size:14px;color:#555;line-height:1.8;">Please find your housing quote attached. You can also view and approve it directly online using the link below.</p>
          <div style="background:#f9f7f4;border-radius:8px;padding:20px;margin:24px 0;">
            <table style="width:100%;font-size:13px;border-collapse:collapse;">
              <tr><td style="color:#999;font-family:monospace;font-size:11px;padding:6px 0;">Location</td><td style="text-align:right;">${contract.location}</td></tr>
              <tr><td style="color:#999;font-family:monospace;font-size:11px;padding:6px 0;">Units</td><td style="text-align:right;">${contract.units}</td></tr>
              <tr><td style="color:#999;font-family:monospace;font-size:11px;padding:6px 0;">Term</td><td style="text-align:right;">${months} month${months !== 1 ? 's' : ''}</td></tr>
              <tr style="border-top:1px solid #C9A84C22;"><td style="color:#C9A84C;padding-top:10px;font-size:15px;">Total</td><td style="text-align:right;font-size:20px;color:#C9A84C;font-weight:600;padding-top:10px;">$${grandTotal.toLocaleString()}</td></tr>
            </table>
          </div>
          <div style="text-align:center;margin:28px 0;">
            <a href="${quoteUrl}" style="background:#0B2540;color:white;padding:13px 30px;border-radius:7px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">View & Approve Quote →</a>
          </div>
          <p style="font-size:12px;color:#aaa;text-align:center;margin-top:24px;">Questions? Reply to this email or call (250) 719-8085.</p>
        </div>
      `,
      attachments: [
        {
          filename: `Quote-${contract.reference}.html`,
          content: Buffer.from(html).toString('base64'),
          content_type: 'text/html',
        }
      ],
    })

    // Audit log
    await supabase.from('audit_logs').insert({
      contract_id: contract.id,
      actor: 'Team',
      action: sendToClient
        ? `Quote PDF sent to ${contract.contact_email} and Austin`
        : `Quote PDF sent to Austin only`,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Quote PDF email failed:', e)
    return NextResponse.json({ error: 'Failed to send quote email.' }, { status: 500 })
  }
}
