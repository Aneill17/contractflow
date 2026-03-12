import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY!
const DOCUSEAL_API_URL = 'https://api.docuseal.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ── Create a DocuSeal submission for a contract ───────────────
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { contract_id } = await req.json()

  // Fetch contract
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*, occupants(*)')
    .eq('id', contract_id)
    .single()

  if (error || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  // Build the contract HTML — use AI-generated contract if available, else fallback
  const contractHtml = contract.generated_contract
    ? buildContractHtmlFromText(contract)
    : buildContractHtml(contract)

  // Create submission from HTML — no template needed, generates on the fly
  const response = await fetch(`${DOCUSEAL_API_URL}/submissions/html`, {
    method: 'POST',
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${contract.reference} — Corporate Housing Agreement`,
      html: contractHtml,
      send_email: true,
      submitters_order: 'preserved', // Client signs first, then provider
      submitters: [
        {
          role: 'Client',
          name: contract.contact_name,
          email: contract.contact_email,
          completed_redirect_url: `${APP_URL}/client/${contract.client_token}`,
        },
        {
          role: 'Provider',
          name: 'Authorized Representative',
          email: process.env.PROVIDER_EMAIL || process.env.TEAM_NOTIFICATION_EMAIL,
          completed_redirect_url: `${APP_URL}`,
        },
      ],
    }),
  })

  const submission = await response.json()

  if (!response.ok) {
    console.error('DocuSeal error:', submission)
    return NextResponse.json({ error: 'DocuSeal submission failed', details: submission }, { status: 500 })
  }

  // Find client and provider slugs from response
  const clientSubmitter = submission.find((s: any) => s.role === 'Client')
  const providerSubmitter = submission.find((s: any) => s.role === 'Provider')

  // Save DocuSeal submission data to contract
  await supabase.from('contracts').update({
    docuseal_submission_id: submission[0]?.submission_id || null,
    docuseal_client_slug: clientSubmitter?.slug || null,
    docuseal_provider_slug: providerSubmitter?.slug || null,
    stage: Math.max(contract.stage, 3), // Move to Confirmed stage
  }).eq('id', contract_id)

  // Audit log
  await supabase.from('audit_logs').insert({
    contract_id,
    actor: 'System',
    action: `DocuSeal signing request sent to ${contract.contact_email}`,
  })

  // Notify internal team that contract has been sent and provider countersign will be needed
  const providerSignUrl = `https://docuseal.com/s/${providerSubmitter?.slug}`
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Elias Range Stays <onboarding@resend.dev>',
      to: process.env.TEAM_NOTIFICATION_EMAIL!,
      subject: `Contract Sent for Signing — ${contract.reference}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
          <div style="border-bottom:2px solid #C9A84C;padding-bottom:16px;margin-bottom:24px;">
            <h1 style="font-size:22px;font-weight:400;margin:0;">Contract Sent for Signing</h1>
            <p style="font-family:monospace;font-size:11px;color:#C9A84C;margin:6px 0 0;">${contract.reference}</p>
          </div>
          <p style="font-size:14px;color:#555;line-height:1.8;">The contract for <strong>${contract.client_name}</strong> has been sent to <strong>${contract.contact_email}</strong> for their signature via DocuSeal.</p>
          <div style="background:#f9f7f4;border-radius:8px;padding:18px 22px;margin:20px 0;font-family:monospace;font-size:12px;">
            <div style="color:#999;margin-bottom:4px;">Client</div>
            <div style="margin-bottom:12px;">${contract.contact_name} · ${contract.contact_email}</div>
            <div style="color:#999;margin-bottom:4px;">Location</div>
            <div style="margin-bottom:12px;">${contract.location}</div>
            <div style="color:#999;margin-bottom:4px;">Dates</div>
            <div>${contract.start_date} → ${contract.end_date}</div>
          </div>
          <p style="font-size:14px;color:#555;line-height:1.8;">Once the client signs, you will receive an email from DocuSeal with your countersignature link. You can also sign directly below:</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${providerSignUrl}" style="background:#C9A84C;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">Sign as Provider →</a>
          </div>
          <p style="font-size:11px;color:#bbb;text-align:center;font-family:monospace;">This link becomes active after the client signs · ${contract.reference}</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Provider notification email failed:', e)
  }

  return NextResponse.json({
    success: true,
    client_embed: clientSubmitter?.embed_src,
    provider_embed: providerSubmitter?.embed_src,
    client_slug: clientSubmitter?.slug,
  })
}

// ── Wrap AI-generated contract text with DocuSeal signature fields ──
function buildContractHtmlFromText(contract: any) {
  const body = contract.generated_contract
    .split('\n')
    .map((line: string) => {
      const trimmed = line.trim()
      if (!trimmed) return '<br/>'
      // Section headers (all caps lines)
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && !trimmed.startsWith('$')) {
        return `<h2>${trimmed}</h2>`
      }
      return `<p>${trimmed}</p>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 40px; color: #1a1a1a; line-height: 1.7; font-size: 13px; }
  h1 { font-size: 24px; font-weight: 400; border-bottom: 2px solid #C9A84C; padding-bottom: 12px; margin-bottom: 24px; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #666; margin-top: 28px; margin-bottom: 8px; }
  p { margin: 4px 0; }
  .sig-block { display: flex; gap: 60px; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e0d9d0; page-break-inside: avoid; }
  .sig { flex: 1; }
  .sig-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #999; font-family: monospace; margin-bottom: 10px; }
  .sig-name { font-size: 12px; color: #666; margin-bottom: 12px; }
</style>
</head>
<body>
<h1>Lease Agreement</h1>
<p style="font-family:monospace;font-size:11px;color:#C9A84C;margin-bottom:24px;">${contract.reference}</p>
${body}
<div class="sig-block">
  <div class="sig">
    <div class="sig-label">Tenant Signature</div>
    <div class="sig-name">${contract.contact_name} · ${contract.client_name}</div>
    <signature-field name="Client Signature" role="Client" required="true" style="width:220px;height:56px;display:block;"></signature-field>
    <date-field name="Client Date" role="Client" required="true" style="width:140px;height:28px;display:inline-block;margin-top:10px;"></date-field>
  </div>
  <div class="sig">
    <div class="sig-label">Landlord Signature</div>
    <div class="sig-name">Austin Neill · Elias Range Stays</div>
    <signature-field name="Provider Signature" role="Provider" required="true" style="width:220px;height:56px;display:block;"></signature-field>
    <date-field name="Provider Date" role="Provider" required="true" style="width:140px;height:28px;display:inline-block;margin-top:10px;"></date-field>
  </div>
</div>
</body>
</html>`
}

// ── Build contract HTML with DocuSeal field tags ──────────────
function buildContractHtml(contract: any) {
  const occupants = contract.occupants?.map((o: any) => o.name).join(', ') || 'N/A'
  const total = contract.units * contract.price_per_unit * 3

  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 40px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 26px; font-weight: 400; border-bottom: 2px solid #C9A84C; padding-bottom: 12px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #666; margin-top: 28px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { padding: 8px 0; border-bottom: 1px solid #f0ebe4; }
  td:first-child { color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-family: monospace; width: 160px; }
  .total { font-size: 20px; color: #C9A84C; font-weight: 600; }
  .terms { font-size: 12px; color: #555; line-height: 1.9; margin-top: 20px; }
  .sig-block { display: flex; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
  .sig { flex: 1; }
  .sig-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; font-family: monospace; margin-bottom: 8px; }
</style>
</head>
<body>

<h1>Corporate Housing Agreement</h1>
<p style="font-family:monospace;font-size:12px;color:#C9A84C;">${contract.reference}</p>

<h2>Booking Summary</h2>
<table>
  <tr><td>Client</td><td><strong>${contract.client_name}</strong></td></tr>
  <tr><td>Contact</td><td>${contract.contact_name}</td></tr>
  <tr><td>Email</td><td>${contract.contact_email}</td></tr>
  <tr><td>Location</td><td>${contract.location}</td></tr>
  <tr><td>Units</td><td>${contract.units} units</td></tr>
  <tr><td>Occupants</td><td>${occupants}</td></tr>
  <tr><td>Check-in</td><td>${contract.start_date}</td></tr>
  <tr><td>Check-out</td><td>${contract.end_date}</td></tr>
  <tr><td>Rate / Unit</td><td>$${contract.price_per_unit.toLocaleString()} / month</td></tr>
  <tr><td>Payment Due</td><td>${contract.payment_due}</td></tr>
  <tr><td>Payment Method</td><td>${contract.payment_method}</td></tr>
  <tr><td>Total Value</td><td class="total">$${total.toLocaleString()}</td></tr>
  ${contract.notes ? `<tr><td>Notes</td><td>${contract.notes}</td></tr>` : ''}
</table>

<h2>Terms &amp; Conditions</h2>
<div class="terms">
<p><strong>1. TERM OF OCCUPANCY</strong><br/>
The Provider agrees to make available the specified units for the duration stated. Units are to be vacated by 11:00 AM on the end date. Early termination requires 30 days written notice.</p>

<p><strong>2. PAYMENT TERMS</strong><br/>
Full payment is due by the Payment Due Date. A 15% late fee applies after 7 days. Accepted: EFT, Wire Transfer, certified cheque.</p>

<p><strong>3. OCCUPANCY RULES</strong><br/>
Units are assigned to named occupants only. Subletting is strictly prohibited. Maximum occupancy per unit is enforced per local fire code.</p>

<p><strong>4. CONDITION &amp; MAINTENANCE</strong><br/>
Occupants accept units in clean, move-in condition. Damages beyond normal wear and tear will be charged to the corporate account. Maintenance requests addressed within 48 hours.</p>

<p><strong>5. UTILITIES &amp; AMENITIES</strong><br/>
All utilities (heat, water, electricity, internet) are included. Parking included as specified. Laundry available on-site.</p>

<p><strong>6. LIABILITY</strong><br/>
Provider is not responsible for personal belongings. Occupants are advised to maintain personal renter's insurance.</p>

<p><strong>7. GOVERNING LAW</strong><br/>
This Agreement is governed by the laws of British Columbia, Canada. Disputes resolved through arbitration in Vancouver, BC.</p>
</div>

<div class="sig-block">
  <div class="sig">
    <div class="sig-label">Client Signature</div>
    <p style="font-size:12px;color:#999;">${contract.contact_name} · ${contract.client_name}</p>
    <signature-field name="Client Signature" role="Client" required="true" style="width:200px;height:50px;display:block;"></signature-field>
    <date-field name="Client Date" role="Client" required="true" style="width:120px;height:24px;display:inline-block;margin-top:8px;"></date-field>
  </div>
  <div class="sig">
    <div class="sig-label">Provider Signature</div>
    <p style="font-size:12px;color:#999;">Authorized Representative</p>
    <signature-field name="Provider Signature" role="Provider" required="true" style="width:200px;height:50px;display:block;"></signature-field>
    <date-field name="Provider Date" role="Provider" required="true" style="width:120px;height:24px;display:inline-block;margin-top:8px;"></date-field>
  </div>
</div>

</body>
</html>
  `
}
