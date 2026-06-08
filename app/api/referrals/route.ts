import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

// GET /api/referrals — list all referrals (internal)
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      contacts (id, name, company, status, email),
      contracts (id, reference, client_name)
    `)
    .order('sent_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// PATCH /api/referrals — update referral status
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, status, notes } = body
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const supabase = createServerClient()

  const updates: any = { status }
  if (notes !== undefined) updates.notes = notes
  if (status === 'contacted') updates.contacted_at = new Date().toISOString()
  if (status === 'converted') updates.converted_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('referrals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
