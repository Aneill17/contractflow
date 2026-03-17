import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

// GET /api/sourcing/feed?contract_id=xxx&limit=20
// Returns all feed items with decision='pending', ordered by score desc
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contract_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  const supabase = createServerClient()

  let query = supabase
    .from('sourcing_feed_items')
    .select('*')
    .eq('decision', 'pending')
    .order('score', { ascending: false })
    .limit(limit)

  if (contractId) {
    query = query.eq('contract_id', contractId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Feed GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also return count of denied items for the UI counter
  const { count: deniedCount } = await supabase
    .from('sourcing_feed_items')
    .select('*', { count: 'exact', head: true })
    .eq('decision', 'denied')

  return NextResponse.json({
    items: data || [],
    denied_count: deniedCount || 0,
  })
}
