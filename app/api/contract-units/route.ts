import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contract_id')

  const supabase = createServerClient()
  let query = supabase
    .from('units')
    .select('*, unit_photos(*), unit_leases(*)')
    .not('contract_id', 'is', null)
    .order('created_at', { ascending: true })

  if (contractId) query = query.eq('contract_id', contractId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServerClient()

  // Base fields — always exist in the units table
  const baseInsert: Record<string, unknown> = {
    contract_id: body.contract_id,
    address: body.address || null,
    status: body.status || 'active',
    landlord_name: body.landlord_name || null,
    landlord_email: body.landlord_email || null,
    landlord_phone: body.landlord_phone || null,
    lease_start: body.lease_start || null,
    lease_end: body.lease_end || null,
    damage_deposit: body.damage_deposit ? Number(body.damage_deposit) : null,
    monthly_cost: body.lease_monthly_price ? Number(body.lease_monthly_price) : null,
    notes: body.notes || null,
  }

  // Extended fields — added via migration 008+. Insert and ignore errors for missing cols.
  const extended: Record<string, unknown> = {
    wifi_ssid: body.wifi_ssid || null,
    wifi_password: body.wifi_password || null,
    guest_name: body.guest_name || null,
    guest_contact: body.guest_contact || null,
    lease_type: body.lease_type || 'month-to-month',
    landlord_additional_contact: body.landlord_additional_contact || null,
    guest_email: body.guest_email || null,
    guest_phone: body.guest_phone || null,
    guest2_name: body.guest2_name || null,
    guest2_email: body.guest2_email || null,
    guest2_phone: body.guest2_phone || null,
    lease_monthly_price: body.lease_monthly_price ? Number(body.lease_monthly_price) : null,
  }

  // Try with all fields first
  const { data, error } = await supabase
    .from('units')
    .insert([{ ...baseInsert, ...extended }])
    .select()
    .single()

  if (!error) return NextResponse.json(data)

  // If schema cache error (missing columns), fall back to base fields only
  if (error.message.includes('schema cache') || error.message.includes('column') || error.code === 'PGRST204') {
    const { data: data2, error: error2 } = await supabase
      .from('units')
      .insert([baseInsert])
      .select()
      .single()
    if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
    return NextResponse.json(data2)
  }

  return NextResponse.json({ error: error.message }, { status: 500 })
}
