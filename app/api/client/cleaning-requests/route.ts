import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireClientSession } from '@/lib/clientApiAuth'
import { notifyCleaningRequest } from '@/lib/slack'

// POST /api/client/cleaning-requests — create a cleaning request
export async function POST(req: NextRequest) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth

  const body = await req.json()
  const { unit_id, scheduled_date, notes } = body

  if (!unit_id || !scheduled_date) {
    return NextResponse.json({ error: 'unit_id and scheduled_date required' }, { status: 400 })
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

  // Insert cleaning request
  const { data: cr, error } = await supabase
    .from('cleaning_requests')
    .insert({
      unit_id,
      contract_id: unit.contract_id,
      requested_by_email: session.email,
      scheduled_date,
      notes: notes || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update unit cleanliness status
  await supabase
    .from('units')
    .update({ cleanliness: 'cleaning_requested' })
    .eq('id', unit_id)

  await notifyCleaningRequest({
    contractLocation: contract?.location || '',
    companyName: session.company_name,
    unitAddress: unit.address || unit_id,
    scheduledDate: scheduled_date,
    notes,
    requestedBy: session.email,
  })

  return NextResponse.json(cr)
}
