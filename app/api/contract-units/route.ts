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

  const { data, error } = await supabase
    .from('units')
    .insert([{
      contract_id: body.contract_id,
      address: body.address || null,
      wifi_ssid: body.wifi_ssid || null,
      wifi_password: body.wifi_password || null,
      guest_name: body.guest_name || null,
      guest_contact: body.guest_contact || null,
      status: body.status || 'active',
      lease_type: body.lease_type || 'month-to-month',
      lease_start: body.lease_start || null,
      lease_end: body.lease_end || null,
      landlord_name: body.landlord_name || null,
      landlord_email: body.landlord_email || null,
      landlord_phone: body.landlord_phone || null,
      concierge_name: body.concierge_name || null,
      concierge_phone: body.concierge_phone || null,
      concierge_notes: body.concierge_notes || null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
