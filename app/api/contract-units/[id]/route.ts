import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('units')
    .select('*, unit_photos(*), unit_leases(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServerClient()

  // Always-safe base fields (exist in original units table)
  const baseAllowed = ['address', 'status', 'notes', 'landlord_name', 'landlord_email', 'landlord_phone', 'lease_start', 'lease_end', 'damage_deposit']
  // Extended fields added via migrations
  const extAllowed = [
    'wifi_ssid', 'wifi_password', 'guest_name', 'guest_contact',
    'lease_type', 'landlord_additional_contact',
    'guest_email', 'guest_phone', 'guest2_name', 'guest2_email', 'guest2_phone',
    'lease_monthly_price',
  ]

  const patch: Record<string, unknown> = {}
  for (const f of [...baseAllowed, ...extAllowed]) if (f in body) patch[f] = body[f]
  // Map lease_monthly_price → monthly_cost (existing column)
  if ('lease_monthly_price' in body) { patch.monthly_cost = body.lease_monthly_price ? Number(body.lease_monthly_price) : null; delete patch.lease_monthly_price }
  if ('damage_deposit' in body) patch.damage_deposit = body.damage_deposit ? Number(body.damage_deposit) : null

  // Try full patch first, fall back to base fields if schema cache error
  let { data, error } = await supabase.from('units').update(patch).eq('id', params.id).select().single()

  if (error && (error.message.includes('schema cache') || error.message.includes('column') || error.code === 'PGRST204')) {
    const basePatch: Record<string, unknown> = {}
    for (const f of baseAllowed) if (f in body) basePatch[f] = body[f]
    const fallback = await supabase.from('units').update(basePatch).eq('id', params.id).select().single()
    data = fallback.data; error = fallback.error
  }

  const finalResult = { data, error };
  if (finalResult.error) return NextResponse.json({ error: finalResult.error.message }, { status: 500 });
  const { data: finalData } = finalResult;

  if (finalResult.error) return NextResponse.json({ error: finalResult.error.message }, { status: 500 })
  return NextResponse.json(finalData)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServerClient()
  const { error } = await supabase.from('units').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
