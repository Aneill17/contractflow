import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

// GET /api/cleaning-requests — internal ERS dashboard: all cleaning requests with unit + contract info
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { searchParams } = new URL(req.url)
  const unitId = searchParams.get('unit_id')

  let query = supabase
    .from('cleaning_requests')
    .select('*')
    .order('scheduled_date', { ascending: true, nullsFirst: false })

  if (unitId) query = query.eq('unit_id', unitId)

  const { data: requests, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with unit address and contract info
  const enriched = await Promise.all(
    (requests || []).map(async (r: any) => {
      let unit_address = null
      let contract_reference = null
      let contract_location = null

      if (r.unit_id) {
        const { data: unit } = await supabase
          .from('units')
          .select('address')
          .eq('id', r.unit_id)
          .single()
        unit_address = unit?.address || null
      }

      if (r.contract_id) {
        const { data: contract } = await supabase
          .from('contracts')
          .select('reference, location')
          .eq('id', r.contract_id)
          .single()
        contract_reference = contract?.reference || null
        contract_location = contract?.location || null
      }

      return { ...r, unit_address, contract_reference, contract_location }
    })
  )

  return NextResponse.json(enriched)
}
