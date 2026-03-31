import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contract_id')

  let query = supabase
    .from('units')
    .select('*, unit_photos(*)')
    .order('created_at', { ascending: false })

  if (contractId) {
    query = query.eq('contract_id', contractId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('units')
    .insert([{
      contract_id: body.contract_id || null,
      address: body.address,
      wifi_ssid: body.wifi_ssid || null,
      wifi_password: body.wifi_password || null,
      guest_name: body.guest_name || null,
      guest_contact: body.guest_contact || null,
      status: body.status || 'active',
      // Legacy fields (keep for compatibility with existing units table)
      city: body.city || null,
      province: body.province || 'BC',
      lat: body.lat || null,
      lng: body.lng || null,
      monthly_cost: body.monthly_cost || null,
      daily_rate: body.daily_rate || null,
      bedrooms: body.bedrooms || null,
      landlord_name: body.landlord_name || null,
      landlord_email: body.landlord_email || null,
      landlord_phone: body.landlord_phone || null,
      lease_start: body.lease_start || null,
      lease_end: body.lease_end || null,
      damage_deposit: body.damage_deposit || null,
      notes: body.notes || null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
