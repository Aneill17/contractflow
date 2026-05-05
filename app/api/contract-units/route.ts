import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contract_id')

  const supabase = createServerClient()
  // Try with contract_id filter; fall back to full list if schema cache missing it
  let { data, error } = await supabase
    .from('units')
    .select('*, unit_photos(*), unit_leases(*)')
    .eq('contract_id', contractId || '')
    .order('created_at', { ascending: true })

  if (error && (error.message.includes('contract_id') || error.code === 'PGRST204')) {
    // Schema cache stale — fetch all and filter in JS
    const fallback = await supabase.from('units').select('*, unit_photos(*), unit_leases(*)').order('created_at', { ascending: true })
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 })
    const filtered = contractId ? (fallback.data ?? []).filter((u: Record<string,unknown>) => u.contract_id === contractId) : (fallback.data ?? [])
    return NextResponse.json(filtered)
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServerClient()

  const contractId = body.contract_id || null

  // Insert all fields in one shot (contract_id, wifi, guest now exist in schema)
  const fullInsert: Record<string, unknown> = {
    contract_id: contractId,
    address: body.address || null,
    status: body.status || 'active',
    landlord_name: body.landlord_name || null,
    landlord_email: body.landlord_email || null,
    landlord_phone: body.landlord_phone || null,
    lease_start: body.lease_start || null,
    lease_end: body.lease_end || null,
    lease_monthly_price: body.lease_monthly_price ? Number(body.lease_monthly_price) : null,
    damage_deposit: body.damage_deposit ? Number(body.damage_deposit) : null,
    monthly_cost: body.lease_monthly_price ? Number(body.lease_monthly_price) : null,
    daily_rate: body.daily_rate ? Number(body.daily_rate) : null,
    wifi_ssid: body.wifi_ssid || null,
    wifi_password: body.wifi_password || null,
    guest_name: body.guest_name || null,
    guest_contact: body.guest_contact || null,
    notes: body.notes || null,
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('units').insert([fullInsert]).select().single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json(inserted)
}
