import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

// GET /api/conversations — list, filterable by contact_id or contract_id
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const contact_id = searchParams.get('contact_id')
  const contract_id = searchParams.get('contract_id')
  const type = searchParams.get('type')
  const from = searchParams.get('from')   // ISO date
  const to = searchParams.get('to')       // ISO date

  let query = supabase
    .from('conversations')
    .select(`
      *,
      contacts (id, name, company, status),
      contracts (id, reference, client_name)
    `)
    .order('created_at', { ascending: false })

  if (contact_id) query = query.eq('contact_id', contact_id)
  if (contract_id) query = query.eq('contract_id', contract_id)
  if (type) query = query.eq('type', type)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/conversations — create a conversation log entry
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const body = await req.json()

  const {
    contact_id,
    contract_id,
    type = 'call',
    direction = 'outbound',
    summary = '',
    next_action,
    follow_up_date,
    actor = 'Austin',
    how_met,
    where_met,
    business_card = false,
  } = body

  if (!contact_id) {
    return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      contact_id,
      contract_id: contract_id || null,
      type,
      direction,
      summary,
      next_action: next_action || null,
      follow_up_date: follow_up_date || null,
      actor,
      how_met: how_met || null,
      where_met: where_met || null,
      business_card: business_card ?? false,
    })
    .select(`
      *,
      contacts (id, name, company, status),
      contracts (id, reference, client_name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If follow_up_date set, bump contact status if still prospect
  if (data && follow_up_date) {
    await supabase
      .from('contacts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', contact_id)
  }

  return NextResponse.json(data, { status: 201 })
}
