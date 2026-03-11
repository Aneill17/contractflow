import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendExecutedEmail } from '@/lib/emails'

// DocuSeal calls this URL when signatures are completed
// Set this in your DocuSeal dashboard → Settings → Webhooks
// Webhook URL: https://YOUR-VERCEL-URL.vercel.app/api/docuseal/webhook

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()

  const { event_type, data } = body

  // Find contract by DocuSeal submission ID
  const submissionId = data?.submission?.id
  if (!submissionId) return NextResponse.json({ ok: true })

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('docuseal_submission_id', submissionId)
    .single()

  if (!contract) return NextResponse.json({ ok: true })

  // ── Submitter completed (one party signed) ────────────────────
  if (event_type === 'submission.submitter_completed') {
    const role = data?.submitter?.role
    const name = data?.submitter?.name || role

    if (role === 'Client') {
      await supabase.from('contracts').update({
        client_sig: name,
      }).eq('id', contract.id)

      await supabase.from('audit_logs').insert({
        contract_id: contract.id,
        actor: contract.contact_name,
        action: 'Contract signed by client via DocuSeal',
      })
    }

    if (role === 'Provider') {
      await supabase.from('contracts').update({
        provider_sig: name,
      }).eq('id', contract.id)

      await supabase.from('audit_logs').insert({
        contract_id: contract.id,
        actor: 'Provider',
        action: 'Contract signed by provider via DocuSeal',
      })
    }
  }

  // ── Submission fully completed (all parties signed) ──────────
  if (event_type === 'submission.completed') {
    const documentUrl = data?.submission?.documents?.[0]?.url

    await supabase.from('contracts').update({
      stage: Math.max(contract.stage, 5), // Advance to Operations
      contract_file_url: documentUrl || contract.contract_file_url,
    }).eq('id', contract.id)

    await supabase.from('audit_logs').insert({
      contract_id: contract.id,
      actor: 'System',
      action: 'Contract fully executed via DocuSeal — advanced to Operations',
    })

    // Send fully executed email to client
    try {
      const { data: updated } = await supabase.from('contracts').select('*').eq('id', contract.id).single()
      if (updated) await sendExecutedEmail(updated)
    } catch (e) {
      console.error('Executed email failed:', e)
    }
  }

  return NextResponse.json({ ok: true })
}
