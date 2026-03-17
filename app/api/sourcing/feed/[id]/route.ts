import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

// PATCH /api/sourcing/feed/[id]
// body: { decision: 'accepted' | 'denied', deny_reason?: string, contract_id?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const body = await req.json()
  const { decision, deny_reason, contract_id } = body

  if (!['accepted', 'denied'].includes(decision)) {
    return NextResponse.json({ error: 'decision must be accepted or denied' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Fetch the feed item
  const { data: feedItem, error: fetchError } = await supabase
    .from('sourcing_feed_items')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !feedItem) {
    return NextResponse.json({ error: 'Feed item not found' }, { status: 404 })
  }

  // Update the feed item decision
  const { error: updateError } = await supabase
    .from('sourcing_feed_items')
    .update({
      decision,
      decision_at: new Date().toISOString(),
      decision_by: user.id,
      deny_reason: deny_reason || null,
      contract_id: contract_id || feedItem.contract_id || null,
    })
    .eq('id', id)

  if (updateError) {
    console.error('Feed PATCH update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  if (decision === 'accepted') {
    // Create a sourcing_lead linked to this feed item + contract
    const { data: newLead, error: leadError } = await supabase
      .from('sourcing_leads')
      .insert([{
        title: feedItem.title,
        city: feedItem.city,
        address: feedItem.address,
        monthly_rent: feedItem.price,
        bedrooms: feedItem.bedrooms,
        bathrooms: feedItem.bathrooms,
        furnished: feedItem.furnished ?? false,
        unit_type: feedItem.unit_type,
        listing_url: feedItem.url,
        source: feedItem.source,
        status: 'new',
        contract_id: contract_id || feedItem.contract_id || null,
        feed_item_id: feedItem.id,
        queued_for_messaging: false,
      }])
      .select()
      .single()

    if (leadError) {
      console.error('Lead creation error:', leadError)
      return NextResponse.json({ error: 'Lead creation failed: ' + leadError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, decision: 'accepted', lead: newLead })
  }

  if (decision === 'denied' && deny_reason) {
    // Build deny pattern based on deny_reason
    let pattern_type: string | null = null
    let pattern_value: string | null = null

    switch (deny_reason) {
      case 'too_expensive':
        pattern_type = 'price_range'
        pattern_value = feedItem.price ? `>${feedItem.price}` : null
        break
      case 'wrong_area':
        pattern_type = 'location'
        pattern_value = feedItem.city || null
        break
      case 'poor_quality': {
        // Extract quality-signal words from title
        const qualityWords = ['old', 'dated', 'needs work', 'fixer', 'as-is', 'as is', 'rough', 'worn', 'stained', 'damaged', 'repair', 'fix']
        const lowerTitle = (feedItem.title || '').toLowerCase()
        const found = qualityWords.find(w => lowerTitle.includes(w))
        pattern_type = 'keyword'
        pattern_value = found || lowerTitle.split(' ').slice(0, 2).join(' ')
        break
      }
      case 'wrong_type':
        pattern_type = 'unit_type'
        pattern_value = feedItem.unit_type || null
        break
      case 'other':
        // No pattern to learn from
        break
    }

    if (pattern_type && pattern_value) {
      // Check if pattern already exists
      const { data: existing } = await supabase
        .from('sourcing_deny_patterns')
        .select('*')
        .eq('pattern_type', pattern_type)
        .eq('pattern_value', pattern_value)
        .single()

      if (existing) {
        // Increment deny_count and increase weight
        await supabase
          .from('sourcing_deny_patterns')
          .update({
            deny_count: existing.deny_count + 1,
            weight: Math.min(existing.weight + 0.25, 5.0), // cap at 5x
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('sourcing_deny_patterns')
          .insert([{ pattern_type, pattern_value, deny_count: 1, weight: 1.0 }])
      }
    }
  }

  return NextResponse.json({ success: true, decision: 'denied' })
}
