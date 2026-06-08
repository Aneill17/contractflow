import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'
import { notifyUnitCleaned } from '@/lib/slack'

// POST /api/cleaning-requests/[id]/complete — mark a cleaning request as completed
// Also updates unit cleanliness to 'clean'
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // Fetch the cleaning request
  const { data: cr, error: crErr } = await supabase
    .from('cleaning_requests')
    .select('*')
    .eq('id', params.id)
    .single()

  if (crErr || !cr) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  // Mark complete
  const { error: updateErr } = await supabase
    .from('cleaning_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: user.name || user.email,
    })
    .eq('id', params.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Update unit cleanliness to 'clean'
  if (cr.unit_id) {
    await supabase
      .from('units')
      .update({ cleanliness: 'clean' })
      .eq('id', cr.unit_id)
  }

  // Fetch context for Slack notification
  let unitAddress = cr.unit_id || 'Unknown unit'
  let contractRef = cr.contract_id || ''

  if (cr.unit_id) {
    const { data: unit } = await supabase.from('units').select('address').eq('id', cr.unit_id).single()
    if (unit?.address) unitAddress = unit.address
  }
  if (cr.contract_id) {
    const { data: contract } = await supabase.from('contracts').select('reference').eq('id', cr.contract_id).single()
    if (contract?.reference) contractRef = contract.reference
  }

  await notifyUnitCleaned({
    unitAddress,
    markedBy: user.name || user.email,
    contractReference: contractRef,
  })

  return NextResponse.json({ ok: true })
}
