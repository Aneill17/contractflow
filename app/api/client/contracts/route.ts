import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireClientSession } from '@/lib/clientApiAuth'

// GET /api/client/contracts — list contracts for the authenticated client company
export async function GET(req: NextRequest) {
  const auth = requireClientSession(req)
  if (auth.error) return auth.error

  const { session } = auth
  const supabase = createServerClient()

  // Get all contract_ids for this company
  const { data: links, error: linkErr } = await supabase
    .from('client_company_contracts')
    .select('contract_id')
    .eq('company_id', session.company_id)

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })

  const contractIds = (links || []).map((l: any) => l.contract_id)
  if (!contractIds.length) return NextResponse.json([])

  // Fetch contracts with occupants
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('*, occupants(*)')
    .in('id', contractIds)
    .order('start_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(contracts || [])
}
