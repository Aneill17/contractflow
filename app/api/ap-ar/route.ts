import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // All active/signed contracts with their unit assignments
  const { data: contracts, error: ce } = await supabase
    .from('contracts')
    .select('id, reference, client_name, contact_email, units, price_per_unit, start_date, end_date, stage, quote_line_items, damage_deposit')
    .in('stage', [2, 3, 4, 5])
    .order('start_date', { ascending: true })

  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  // All units
  const { data: units, error: ue } = await supabase
    .from('units')
    .select('id, address, city, monthly_cost, status, lease_end, landlord_name, landlord_email')
    .order('address')

  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 })

  // Contract-unit assignments
  const { data: assignments, error: ae } = await supabase
    .from('contract_units')
    .select('*')

  return NextResponse.json({ contracts, units, assignments: assignments || [] })
}
