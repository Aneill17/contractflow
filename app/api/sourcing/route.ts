import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('sourcing_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('sourcing_leads')
    .insert([{
      title: body.title,
      address: body.address || null,
      city: body.city || null,
      region: body.region || null,
      monthly_rent: body.monthly_rent ? parseFloat(body.monthly_rent) : null,
      furnished: body.furnished ?? false,
      bedrooms: body.bedrooms ? parseInt(body.bedrooms) : null,
      bathrooms: body.bathrooms ? parseFloat(body.bathrooms) : null,
      unit_type: body.unit_type || null,
      available_date: body.available_date || null,
      listing_url: body.listing_url || null,
      source: body.source || 'other',
      notes: body.notes || null,
      status: 'new',
      landlord_name: body.landlord_name || null,
      landlord_contact: body.landlord_contact || null,
      monthly_cost_ers: body.monthly_cost_ers ? parseFloat(body.monthly_cost_ers) : null,
      nightly_rate_client: body.nightly_rate_client ? parseFloat(body.nightly_rate_client) : 105,
      added_by: user.name || user.email,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
