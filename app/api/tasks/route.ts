import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const assignedTo = searchParams.get('assigned_to')
  const statusFilter = searchParams.get('status')

  let query = supabase
    .from('tasks')
    .select('*, staff:assigned_to(name)')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  if (statusFilter) query = query.eq('status', statusFilter)

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
    .from('tasks')
    .insert([{
      title: body.title,
      description: body.description || null,
      assigned_to: body.assigned_to || null,
      contract_id: body.contract_id || null,
      unit_id: body.unit_id || null,
      priority: body.priority || 'normal',
      status: body.status || 'open',
      due_date: body.due_date || null,
      notes: body.notes || null,
    }])
    .select('*, staff:assigned_to(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
