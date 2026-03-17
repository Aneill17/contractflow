import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServerClient()

  // Build update object — only include defined fields
  const update: Record<string, unknown> = {}
  const allowed = [
    'status', 'notes', 'viewing_date', 'contract_id',
    'title', 'address', 'city', 'region', 'monthly_rent',
    'furnished', 'bedrooms', 'bathrooms', 'unit_type',
    'available_date', 'listing_url', 'source',
    'landlord_name', 'landlord_contact', 'landlord_phone',
    'monthly_cost_ers', 'nightly_rate_client',
    'photo_url', 'lease_term', 'available_date_text',
  ]
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase
    .from('sourcing_leads')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Owner only
  if (user.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('sourcing_leads')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
