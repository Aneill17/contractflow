import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()

  const eventType = body.event_type
  const submission = body.data

  if (!submission) return NextResponse.json({ ok: true })

  // Find contract by docuseal_submission_id
  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('docuseal_submission_id', submission.submission_id)
    .single()

  if (!contract) return NextResponse.json({ ok: true })

  // A submitter completed their signature
  if (eventType === 'submission.submitter_completed') {
    const role = submission.role?.toLowerCase()
    if (role === 'client') {
      await supabase.from('contracts').update({ client_sig: 'DocuSeal' }).eq('id', contract.id)
      await supabase.from('audit_logs').insert({
        contract_id: contract.id, actor: 'Client',
        action: 'Client signed the lease agreement via DocuSeal',
      })
    } else if (role === 'provider') {
      await supabase.from('contracts').update({ provider_sig: 'DocuSeal' }).eq('id', contract.id)
      await supabase.from('audit_logs').insert({
        contract_id: contract.id, actor: 'Provider',
        action: 'Provider countersigned the lease agreement via DocuSeal',
      })
    }
  }

  // Both parties signed — advance to stage 4 (Signed) and store document URL
  if (eventType === 'submission.completed') {
    const documentUrl = submission.documents?.[0]?.url || null
    await supabase.from('contracts').update({
      stage: 4,
      client_sig: 'DocuSeal',
      provider_sig: 'DocuSeal',
      ...(documentUrl ? { contract_file_url: documentUrl } : {}),
    }).eq('id', contract.id)

    await supabase.from('audit_logs').insert({
      contract_id: contract.id, actor: 'System',
      action: 'Lease agreement fully executed — both parties signed via DocuSeal',
    })
  }

  return NextResponse.json({ ok: true })
}
