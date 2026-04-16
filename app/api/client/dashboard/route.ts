import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

async function getClientInfo(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )
  const { data: { user } } = await anon.auth.getUser()
  if (!user) return null

  const srv = createServerClient()
  const { data: profile } = await srv.from('user_profiles').select('role,name').eq('id', user.id).single()
  if (!profile) return null

  const { data: account } = await srv.from('client_accounts').select('*').eq('user_id', user.id).single()
  return { user, profile, account }
}

export async function GET(req: NextRequest) {
  const info = await getClientInfo(req)
  if (!info) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const srv = createServerClient()
  const acctId = info.account?.id

  const [contractsRes, quotesRes] = await Promise.all([
    acctId
      ? srv.from('contracts')
          .select('id,reference,client_name,location,start_date,end_date,status,stage,units,price_per_unit,created_at')
          .eq('client_account_id', acctId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as unknown[], error: null }),
    acctId
      ? srv.from('quote_requests').select('*').eq('client_id', acctId).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as unknown[], error: null }),
  ])

  const contracts = (contractsRes.data ?? []) as Array<{ status?: string; units?: number; price_per_unit?: number }>
  const quotes = (quotesRes.data ?? []) as Array<{ status: string }>

  const activeContracts = contracts.filter(c => c.status === 'active').length
  const pendingQuotes = quotes.filter(q => q.status === 'pending').length
  const monthlyCost = contracts
    .filter(c => c.status === 'active')
    .reduce((s, c) => s + (c.units || 0) * (c.price_per_unit || 0), 0)

  // Fetch units for active contracts
  let totalUnits = 0
  if (acctId) {
    const contractIds = (contractsRes.data ?? []).map((c: unknown) => (c as { id: string }).id)
    if (contractIds.length) {
      const { data: units } = await srv.from('units').select('id').in('contract_id', contractIds)
      totalUnits = units?.length ?? 0
    }
  }

  return NextResponse.json({
    account: info.account,
    profile: info.profile,
    contracts: contractsRes.data ?? [],
    quotes: quotesRes.data ?? [],
    stats: { total_units: totalUnits, active_contracts: activeContracts, pending_quotes: pendingQuotes, monthly_cost: monthlyCost },
  })
}
