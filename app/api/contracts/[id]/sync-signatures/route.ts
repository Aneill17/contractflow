import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY!

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!contract.docuseal_submission_id) return NextResponse.json({ error: 'No DocuSeal submission' }, { status: 400 })

  // Fetch submission status from DocuSeal
  const res = await fetch(`https://api.docuseal.com/submissions/${contract.docuseal_submission_id}`, {
    headers: { 'X-Auth-Token': DOCUSEAL_API_KEY },
  })

  if (!res.ok) return NextResponse.json({ error: 'DocuSeal fetch failed' }, { status: 500 })

  const submission = await res.json()
  const submitters: any[] = submission.submitters || []

  const landlord = submitters.find((s: any) => s.role?.toLowerCase() === 'landlord')
  const tenant = submitters.find((s: any) => s.role?.toLowerCase() === 'tenant')

  const landlordSigned = landlord?.status === 'completed'
  const tenantSigned = tenant?.status === 'completed'
  const bothSigned = landlordSigned && tenantSigned

  const patch: any = {}
  if (landlordSigned && !contract.provider_sig) patch.provider_sig = 'DocuSeal'
  if (tenantSigned && !contract.client_sig) patch.client_sig = 'DocuSeal'
  if (bothSigned && contract.stage < 4) patch.stage = 4

  if (Object.keys(patch).length > 0) {
    await supabase.from('contracts').update(patch).eq('id', contract.id)
    if (patch.stage === 4) {
      await supabase.from('audit_logs').insert({
        contract_id: contract.id, actor: 'System',
        action: 'Lease agreement fully executed — both parties signed via DocuSeal',
      })
    }
  }

  return NextResponse.json({
    landlord: { name: landlord?.name, status: landlord?.status, signed: landlordSigned },
    tenant: { name: tenant?.name, status: tenant?.status, signed: tenantSigned },
    bothSigned,
  })
}
