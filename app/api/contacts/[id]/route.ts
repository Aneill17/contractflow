import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

// GET /api/contacts/[id] — single contact with full conversations list
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      contracts (id, reference, client_name, stage),
      conversations (
        id, type, direction, summary, next_action, follow_up_date, actor, created_at,
        contracts (id, reference, client_name)
      )
    `)
    .eq('id', params.id)
    .order('created_at', { ascending: false, foreignTable: 'conversations' })
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/contacts/[id] — update contact
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const body = await req.json()

  const allowedFields = [
    'name', 'company', 'role', 'email', 'phone',
    'source', 'referred_by', 'contract_id',
    'quoted', 'status', 'notes',
  ]
  const patch: Record<string, any> = {}
  for (const key of allowedFields) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/contacts/[id] — owner only
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServerClient()
  const { error } = await supabase.from('contacts').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
