import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

// GET /api/sourcing/queue
// Returns all sourcing_leads queued for messaging (new status, queued_for_messaging=true)
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('sourcing_leads')
    .select('*, contracts(reference, client_name)')
    .eq('queued_for_messaging', true)
    .eq('status', 'new')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Queue GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// PATCH /api/sourcing/queue
// body: { lead_id: string, approved_by?: string }
// Approve a lead for messaging → queued_for_messaging=true, status unchanged (stays 'new')
// OR approve outreach → set messaging_approved_by/at, status='contacted'
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { lead_id, action } = body

  if (!lead_id) {
    return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
  }

  const supabase = createServerClient()

  if (action === 'queue') {
    // Move to queued for messaging column
    const { data, error } = await supabase
      .from('sourcing_leads')
      .update({ queued_for_messaging: true })
      .eq('id', lead_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, lead: data })
  }

  if (action === 'approve') {
    // Manager approval → mark contacted
    const { data, error } = await supabase
      .from('sourcing_leads')
      .update({
        messaging_approved_by: user.id,
        messaging_approved_at: new Date().toISOString(),
        status: 'contacted',
        queued_for_messaging: true,
      })
      .eq('id', lead_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, lead: data })
  }

  if (action === 'remove') {
    // Remove from queue / pipeline
    const { error } = await supabase
      .from('sourcing_leads')
      .delete()
      .eq('id', lead_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action. Use queue|approve|remove' }, { status: 400 })
}
