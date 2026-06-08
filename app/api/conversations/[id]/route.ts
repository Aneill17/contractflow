import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

// PATCH /api/conversations/[id] — update a conversation entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const body = await req.json()

  const allowedFields = [
    'type', 'direction', 'summary', 'next_action',
    'follow_up_date', 'contract_id', 'actor',
    'how_met', 'where_met', 'business_card',
  ]
  const patch: Record<string, any> = {}
  for (const key of allowedFields) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await supabase
    .from('conversations')
    .update(patch)
    .eq('id', params.id)
    .select(`
      *,
      contacts (id, name, company, status),
      contracts (id, reference, client_name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/conversations/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { error } = await supabase.from('conversations').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
