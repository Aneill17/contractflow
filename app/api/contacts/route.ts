import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

// GET /api/contacts — list all contacts with latest conversation + contract info
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select(`
      *,
      contracts (id, reference, client_name, stage),
      conversations (
        id, type, direction, summary, next_action, follow_up_date, actor, created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort conversations by created_at desc and attach latest
  const enriched = contacts.map((c: any) => {
    const sorted = [...(c.conversations || [])].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return { ...c, conversations: sorted, latest_conversation: sorted[0] ?? null }
  })

  return NextResponse.json(enriched)
}

// POST /api/contacts — create a new contact
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const body = await req.json()

  const {
    name, company, role, email, phone,
    source = 'direct', referred_by,
    contract_id, quoted = false,
    status = 'prospect', notes,
    relationship_start_date, first_meeting_location,
    first_meeting_event, first_meeting_context,
  } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      name: name.trim(),
      company: company || null,
      role: role || null,
      email: email || null,
      phone: phone || null,
      source,
      referred_by: referred_by || null,
      contract_id: contract_id || null,
      quoted,
      status,
      notes: notes || null,
      relationship_start_date: relationship_start_date || null,
      first_meeting_location: first_meeting_location || null,
      first_meeting_event: first_meeting_event || null,
      first_meeting_context: first_meeting_context || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
