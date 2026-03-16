import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'
import { Resend } from 'resend'

const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY!
const APP_URL = process.env.NODE_ENV === 'production'
  ? 'https://contractflow-omega.vercel.app'
  : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
const FROM = 'Elias Range Stays <contracts@team.eliasrangestays.ca>'
const PROVIDER_EMAIL =
  process.env.PROVIDER_EMAIL ||
  process.env.TEAM_NOTIFICATION_EMAIL ||
  'austin@eliasrangestays.ca'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { contract_id } = await req.json()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*, occupants(*)')
    .eq('id', contract_id)
    .single()

  if (error || !contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  // Build HTML — use AI-generated contract if available, else fallback
  const contractHtml = contract.generated_contract
    ? wrapForDocuSeal(contract)
    : buildFallbackHtml(contract)

  // ── Step 1: Create a one-use template from HTML ──────────────
  const templateResponse = await fetch('https://api.docuseal.com/templates/html', {
    method: 'POST',
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${contract.reference} — Lease Agreement`,
      html: contractHtml,
    }),
  })

  const template = await templateResponse.json()

  if (!templateResponse.ok) {
    console.error('DocuSeal template creation error:', template)
    return NextResponse.json(
      { error: 'DocuSeal template creation failed', details: template },
      { status: 500 }
    )
  }

  const templateId = template.id

  // ── Step 2: Create submission from the template ───────────────
  const submissionResponse = await fetch('https://api.docuseal.com/submissions', {
    method: 'POST',
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: templateId,
      send_email: true,
      submitters_order: 'preserved',
      submitters: [
        // Landlord signs first, Tenant second (sequential)
        {
          role: 'Landlord',
          name: 'Austin Neill',
          email: PROVIDER_EMAIL,
          completed_redirect_url: APP_URL,
        },
        {
          role: 'Tenant',
          name: contract.contact_name,
          email: contract.contact_email,
          completed_redirect_url: `${APP_URL}/client/${contract.client_token}`,
        },
      ],
    }),
  })

  const submission = await submissionResponse.json()

  if (!submissionResponse.ok) {
    console.error('DocuSeal submission error:', submission)
    // Clean up the template on failure
    fetch(`https://api.docuseal.com/templates/${templateId}`, {
      method: 'DELETE',
      headers: { 'X-Auth-Token': DOCUSEAL_API_KEY },
    }).catch(() => {})
    return NextResponse.json(
      { error: 'DocuSeal submission failed', details: submission },
      { status: 500 }
    )
  }

  // Note: do NOT delete the template — DocuSeal needs it to render the signing page.
  // Templates are referenced by active submissions until all parties have signed.
  // Cleanup can be done manually in the DocuSeal dashboard or via webhook after completion.

  // submission is an array of submitter objects
  const submitters: any[] = Array.isArray(submission) ? submission : []
  const clientSubmitter = submitters.find((s: any) => s.role === 'Tenant')
  const providerSubmitter = submitters.find((s: any) => s.role === 'Landlord')
  const submissionId = clientSubmitter?.submission_id || submitters[0]?.submission_id || null

  // Save to DB and advance to stage 3 (Contract Sent)
  await supabase.from('contracts').update({
    docuseal_submission_id: submissionId,
    docuseal_client_slug: clientSubmitter?.slug || null,
    docuseal_provider_slug: providerSubmitter?.slug || null,
    stage: 3,
  }).eq('id', contract_id)

  await supabase.from('audit_logs').insert({
    contract_id,
    actor: 'System',
    action: `Contract sent for signing via DocuSeal to ${contract.contact_email}`,
  })

  // Notify Austin (provider) with his signing link
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const providerSignUrl = providerSubmitter?.slug
      ? `https://docuseal.com/s/${providerSubmitter.slug}`
      : `https://docuseal.com`
    await resend.emails.send({
      from: FROM,
      to: PROVIDER_EMAIL,
      subject: `Contract Sent for Signing — ${contract.reference}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
          <div style="border-bottom:2px solid #C9A84C;padding-bottom:16px;margin-bottom:24px;">
            <h1 style="font-size:22px;font-weight:400;margin:0;">Contract Sent for Signing</h1>
            <p style="font-family:monospace;font-size:11px;color:#C9A84C;margin:6px 0 0;">${contract.reference}</p>
          </div>
          <p style="font-size:14px;color:#555;line-height:1.8;">
            The lease agreement for <strong>${contract.client_name}</strong> has been sent to 
            <strong>${contract.contact_email}</strong> for signature.
          </p>
          <div style="background:#f9f7f4;border-radius:8px;padding:16px 20px;margin:20px 0;font-size:13px;">
            <div style="color:#999;font-family:monospace;font-size:10px;margin-bottom:4px;">CLIENT</div>
            <div style="margin-bottom:12px;">${contract.contact_name} · ${contract.contact_email}</div>
            <div style="color:#999;font-family:monospace;font-size:10px;margin-bottom:4px;">LOCATION</div>
            <div style="margin-bottom:12px;">${contract.location}</div>
            <div style="color:#999;font-family:monospace;font-size:10px;margin-bottom:4px;">DATES</div>
            <div>${contract.start_date} → ${contract.end_date}</div>
          </div>
          <p style="font-size:14px;color:#555;line-height:1.8;">
            Once the client signs, DocuSeal will send you a separate email to countersign. 
            Your signing link is below (active after client signs):
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${providerSignUrl}" style="background:#C9A84C;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;">
              Sign as Provider (Austin Neill) →
            </a>
          </div>
          <p style="font-size:11px;color:#bbb;text-align:center;font-family:monospace;">${contract.reference}</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Provider notification email failed:', e)
  }

  return NextResponse.json({
    success: true,
    client_slug: clientSubmitter?.slug,
    provider_slug: providerSubmitter?.slug,
  })
}

// Strip signature blocks already present in the generated contract text
// so we don't get duplicate signature fields in DocuSeal
function stripSignatureSection(text: string): string {
  const lines = text.split('\n')
  // Find where the signature section starts — look for lines with underscores,
  // or headings like "SIGNATURES", "EXECUTION", "IN WITNESS WHEREOF"
  const sigPatterns = [
    /^_{3,}/,
    /SIGNATURE/i,
    /IN WITNESS WHEREOF/i,
    /EXECUTION/i,
    /SIGNED BY/i,
    /^Landlord[:\s]*$/i,
    /^Tenant[:\s]*$/i,
  ]
  let cutAt = lines.length
  for (let i = lines.length - 1; i >= Math.floor(lines.length * 0.6); i--) {
    const t = lines[i].trim()
    if (sigPatterns.some(p => p.test(t))) {
      cutAt = i
    }
  }
  return lines.slice(0, cutAt).join('\n').trim()
}

// Wrap generated contract text into DocuSeal-compatible HTML with signature fields
function wrapForDocuSeal(contract: any) {
  const cleanText = stripSignatureSection(contract.generated_contract as string)

  const lines = cleanText.split('\n').map((line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return '<br/>'
    if (trimmed.startsWith('## ')) return `<h2>${trimmed.replace(/^##\s*/, '')}</h2>`
    if (trimmed.startsWith('# ')) return `<h1>${trimmed.replace(/^#\s*/, '')}</h1>`
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) return `<strong>${trimmed.slice(2, -2)}</strong><br/>`
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !/^\$/.test(trimmed) && !/^\d/.test(trimmed)) {
      return `<h2>${trimmed}</h2>`
    }
    return `<p>${trimmed}</p>`
  }).join('\n')

  return `<!DOCTYPE html><html><head><style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 40px; color: #1a1a1a; line-height: 1.7; font-size: 13px; }
    h1 { font-size: 24px; font-weight: 400; border-bottom: 2px solid #1B4353; padding-bottom: 12px; margin-bottom: 24px; color: #1B4353; }
    h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #1B4353; margin-top: 28px; margin-bottom: 6px; font-weight: 600; }
    p { margin: 3px 0; }
    .parties { display: flex; gap: 40px; background: #f9f7f4; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; font-size: 12px; }
    .party { flex: 1; }
    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #999; font-family: monospace; margin-bottom: 4px; }
    .party-name { font-weight: 600; color: #1a1a1a; }
    .party-sub { color: #666; font-size: 11px; }
    .sig-block { display: flex; gap: 60px; margin-top: 48px; padding-top: 24px; border-top: 2px solid #1B4353; }
    .sig { flex: 1; }
    .sig-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #1B4353; font-family: monospace; margin-bottom: 8px; font-weight: 600; }
    .sig-name { font-size: 12px; color: #666; margin-bottom: 14px; }
  </style></head><body>
  <h1>Lease Agreement — ${contract.reference}</h1>
  <div class="parties">
    <div class="party">
      <div class="party-label">Landlord</div>
      <div class="party-name">Austin Neill</div>
      <div class="party-sub">Elias Range Stays</div>
    </div>
    <div class="party">
      <div class="party-label">Tenant</div>
      <div class="party-name">${contract.contact_name}</div>
      <div class="party-sub">${contract.client_name}</div>
    </div>
  </div>
  ${lines}
  <div class="sig-block">
    <div class="sig">
      <div class="sig-label">Landlord</div>
      <div class="sig-name">Austin Neill · Elias Range Stays</div>
      <signature-field name="Landlord Signature" role="Landlord" required="true" style="width:220px;height:60px;display:block;"></signature-field>
      <date-field name="Landlord Date" role="Landlord" required="true" style="width:140px;height:28px;display:inline-block;margin-top:10px;"></date-field>
    </div>
    <div class="sig">
      <div class="sig-label">Tenant</div>
      <div class="sig-name">${contract.contact_name} · ${contract.client_name}</div>
      <signature-field name="Tenant Signature" role="Tenant" required="true" style="width:220px;height:60px;display:block;"></signature-field>
      <date-field name="Tenant Date" role="Tenant" required="true" style="width:140px;height:28px;display:inline-block;margin-top:10px;"></date-field>
    </div>
  </div>
  </body></html>`
}

// Fallback HTML if no generated contract
function buildFallbackHtml(contract: any) {
  const months = Math.max(1, Math.round(
    (new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
  ))
  const total = contract.units * contract.price_per_unit * months

  return `<!DOCTYPE html><html><head><style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 40px; color: #1a1a1a; }
    h1 { font-size: 24px; font-weight: 400; border-bottom: 2px solid #C9A84C; padding-bottom: 12px; }
    h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #666; margin-top: 28px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { padding: 8px 0; border-bottom: 1px solid #f0ebe4; }
    td:first-child { color: #999; font-size: 11px; font-family: monospace; width: 160px; }
    .sig-block { display: flex; gap: 60px; margin-top: 48px; padding-top: 24px; border-top: 2px solid #e0d9d0; }
    .sig { flex: 1; }
  </style></head><body>
  <h1>Lease Agreement</h1>
  <p style="font-family:monospace;font-size:11px;color:#C9A84C;">${contract.reference}</p>
  <h2>Parties</h2>
  <table>
    <tr><td>Landlord</td><td>Elias Range Stays · Austin Neill</td></tr>
    <tr><td>Tenant</td><td>${contract.client_name} · ${contract.contact_name}</td></tr>
    <tr><td>Location</td><td>${contract.location}</td></tr>
    <tr><td>Units</td><td>${contract.units}</td></tr>
    <tr><td>Check-in</td><td>${contract.start_date}</td></tr>
    <tr><td>Check-out</td><td>${contract.end_date}</td></tr>
    <tr><td>Monthly Rent</td><td>$${(contract.units * contract.price_per_unit).toLocaleString()}</td></tr>
    <tr><td>Total Value</td><td>$${total.toLocaleString()}</td></tr>
  </table>
  <div class="sig-block">
    <div class="sig">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#999;font-family:monospace;">Tenant</p>
      <p style="font-size:12px;color:#666;">${contract.contact_name} · ${contract.client_name}</p>
      <signature-field name="Tenant Signature" role="Tenant" required="true" style="width:220px;height:60px;display:block;"></signature-field>
      <date-field name="Tenant Date" role="Tenant" required="true" style="width:140px;height:28px;display:inline-block;margin-top:10px;"></date-field>
    </div>
    <div class="sig">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#999;font-family:monospace;">Landlord</p>
      <p style="font-size:12px;color:#666;">Austin Neill · Elias Range Stays</p>
      <signature-field name="Landlord Signature" role="Landlord" required="true" style="width:220px;height:60px;display:block;"></signature-field>
      <date-field name="Landlord Date" role="Landlord" required="true" style="width:140px;height:28px;display:inline-block;margin-top:10px;"></date-field>
    </div>
  </div>
  </body></html>`
}
