import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireClientSession } from '@/lib/clientApiAuth'
import { notifyStaffChange, notifyCleaningRequest } from '@/lib/slack'

// Verify client company can access this unit (via contract)
async function verifyUnitAccess(
  supabase: ReturnType<typeof createServerClient>,
  companyId: string,
  unitId: string
): Promise<{ unit: any; contract: any } | null> {
  // Get the unit and its contract_id
  const { data: unit } = await supabase
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()

  if (!unit || !unit.contract_id) return null

  // Check company has access to that contract
  const { data: link } = await supabase
    .from('client_company_contracts')
    .select('contract_id')
    .eq('company_id', companyId)
    .eq('contract_id', unit.contract_id)
    .single()

  if (!link) return null

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, location, reference, client_name')
    .eq('id', unit.contract_id)
    .single()

  return { unit, contract }
}

// GET /api/client/units/[id] — unit detail with occupants + cleaning requests
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth

  const supabase = createServerClient()
  const access = await verifyUnitAccess(supabase, session.company_id, params.id)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { unit } = access

  // Get occupants for this unit via contract
  const { data: occupants } = await supabase
    .from('occupants')
    .select('*')
    .eq('contract_id', unit.contract_id)
    .order('created_at')

  // Get open cleaning requests
  const { data: cleaningRequests } = await supabase
    .from('cleaning_requests')
    .select('*')
    .eq('unit_id', params.id)
    .neq('status', 'completed')
    .order('scheduled_date')

  return NextResponse.json({ ...unit, occupants: occupants || [], cleaning_requests: cleaningRequests || [] })
}

// PATCH /api/client/units/[id] — staff change + cleaning request
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error
  const { session } = auth

  const supabase = createServerClient()
  const access = await verifyUnitAccess(supabase, session.company_id, params.id)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { unit, contract } = access
  const body = await req.json()
  const { action, ...payload } = body
  const requestedBy = session.email

  if (action === 'staff_change') {
    const { outgoing_name, outgoing_date, incoming_name, incoming_date, notes } = payload

    if (!outgoing_name || !outgoing_date) {
      return NextResponse.json({ error: 'outgoing_name and outgoing_date required' }, { status: 400 })
    }

    // Insert staff_changes record
    await supabase.from('staff_changes').insert({
      unit_id: params.id,
      contract_id: unit.contract_id,
      outgoing_name,
      outgoing_date,
      incoming_name: incoming_name || null,
      incoming_date: incoming_date || null,
      notes: notes || null,
      requested_by_email: requestedBy,
    })

    // Update occupant status if name matches
    if (outgoing_name) {
      await supabase
        .from('occupants')
        .update({ status: 'departing', departure_date: outgoing_date })
        .eq('contract_id', unit.contract_id)
        .ilike('name', outgoing_name)
    }

    if (incoming_name && incoming_date) {
      // Add incoming occupant
      const { data: existing } = await supabase
        .from('occupants')
        .select('id')
        .eq('contract_id', unit.contract_id)
        .ilike('name', incoming_name)
        .single()

      if (!existing) {
        await supabase.from('occupants').insert({
          contract_id: unit.contract_id,
          name: incoming_name,
          status: 'incoming',
          arrival_date: incoming_date,
        })
      }
    }

    // Slack notification
    await notifyStaffChange({
      contractLocation: contract.location,
      companyName: session.company_name,
      unitAddress: unit.address || params.id,
      outgoingName: outgoing_name,
      outgoingDate: outgoing_date,
      incomingName: incoming_name,
      incomingDate: incoming_date,
      requestedBy,
    })

    return NextResponse.json({ ok: true })
  }

  if (action === 'cleaning_request') {
    const { scheduled_date, notes } = payload

    if (!scheduled_date) {
      return NextResponse.json({ error: 'scheduled_date required' }, { status: 400 })
    }

    // Insert cleaning request
    await supabase.from('cleaning_requests').insert({
      unit_id: params.id,
      contract_id: unit.contract_id,
      requested_by_email: requestedBy,
      scheduled_date,
      notes: notes || null,
      status: 'pending',
    })

    // Update unit cleanliness
    await supabase
      .from('units')
      .update({ cleanliness: 'cleaning_requested' })
      .eq('id', params.id)

    // Slack
    await notifyCleaningRequest({
      contractLocation: contract.location,
      companyName: session.company_name,
      unitAddress: unit.address || params.id,
      scheduledDate: scheduled_date,
      notes,
      requestedBy,
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
