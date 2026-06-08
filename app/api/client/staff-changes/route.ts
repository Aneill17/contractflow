import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireClientSession } from '@/lib/clientApiAuth'
import { notifyStaffChange } from '@/lib/slack'

// POST /api/client/staff-changes — create a staff change record
export async function POST(req: NextRequest) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth

  const body = await req.json()
  const { unit_id, outgoing_name, outgoing_date, incoming_name, incoming_date, notes } = body

  if (!unit_id || !outgoing_name || !outgoing_date) {
    return NextResponse.json({ error: 'unit_id, outgoing_name, outgoing_date required' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Verify access
  const { data: unit } = await supabase
    .from('units')
    .select('id, address, contract_id')
    .eq('id', unit_id)
    .single()

  if (!unit?.contract_id) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })

  const { data: link } = await supabase
    .from('client_company_contracts')
    .select('contract_id')
    .eq('company_id', session.company_id)
    .eq('contract_id', unit.contract_id)
    .single()

  if (!link) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: contract } = await supabase
    .from('contracts')
    .select('location, reference')
    .eq('id', unit.contract_id)
    .single()

  const { data: change, error } = await supabase
    .from('staff_changes')
    .insert({
      unit_id,
      contract_id: unit.contract_id,
      outgoing_name,
      outgoing_date,
      incoming_name: incoming_name || null,
      incoming_date: incoming_date || null,
      notes: notes || null,
      requested_by_email: session.email,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await notifyStaffChange({
    contractLocation: contract?.location || '',
    companyName: session.company_name,
    unitAddress: unit.address || unit_id,
    outgoingName: outgoing_name,
    outgoingDate: outgoing_date,
    incomingName: incoming_name,
    incomingDate: incoming_date,
    requestedBy: session.email,
  })

  return NextResponse.json(change)
}
