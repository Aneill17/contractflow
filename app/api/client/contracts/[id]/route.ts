import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireClientSession } from '@/lib/clientApiAuth'
import {
  notifyContractExtension,
  notifyNoticeToEnd,
  notifyAddNote,
} from '@/lib/slack'

// Verify this company has access to this contract
async function verifyAccess(supabase: ReturnType<typeof createServerClient>, companyId: string, contractId: string) {
  const { data } = await supabase
    .from('client_company_contracts')
    .select('contract_id')
    .eq('company_id', companyId)
    .eq('contract_id', contractId)
    .single()
  return !!data
}

// GET /api/client/contracts/[id] — contract detail with units + occupants
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth

  const supabase = createServerClient()

  if (!(await verifyAccess(supabase, session.company_id, params.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*, occupants(*), audit_logs(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Fetch units for this contract
  const { data: units } = await supabase
    .from('units')
    .select('*')
    .eq('contract_id', params.id)
    .order('address')

  return NextResponse.json({ ...contract, contract_units: units || [] })
}

// PATCH /api/client/contracts/[id] — extension request, notice to end, add note
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth

  const supabase = createServerClient()

  if (!(await verifyAccess(supabase, session.company_id, params.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action, ...payload } = body

  // Fetch contract for context
  const { data: contract } = await supabase
    .from('contracts')
    .select('location, reference, client_name')
    .eq('id', params.id)
    .single()

  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  const companyName = session.company_name
  const requestedBy = session.email

  if (action === 'request_extension') {
    const { duration, note } = payload
    // Log to audit_logs
    await supabase.from('audit_logs').insert({
      contract_id: params.id,
      actor: requestedBy,
      action: `Extension request: ${duration} · ${note || 'no note'}`,
    })
    // Slack
    await notifyContractExtension({
      contractLocation: contract.location,
      companyName,
      duration,
      note,
      requestedBy,
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'notice_to_end') {
    const { end_date, note } = payload
    await supabase.from('audit_logs').insert({
      contract_id: params.id,
      actor: requestedBy,
      action: `Notice to end: ${end_date} · ${note || 'no note'}`,
    })
    await notifyNoticeToEnd({
      contractLocation: contract.location,
      companyName,
      endDate: end_date,
      note,
      requestedBy,
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'add_note') {
    const { note } = payload
    if (!note) return NextResponse.json({ error: 'Note required' }, { status: 400 })
    await supabase.from('audit_logs').insert({
      contract_id: params.id,
      actor: requestedBy,
      action: `Client note: ${note}`,
    })
    await notifyAddNote({
      contractLocation: contract.location,
      companyName,
      note,
      requestedBy,
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
