import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Client portal: get current client's data (contracts, units, stats)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Validate user
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // Get client_account
  const { data: account } = await supabase
    .from('client_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'No client account found' }, { status: 404 })

  // Get contracts linked to this client (by contact_email)
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, reference, client_name, contact_name, contact_email, start_date, end_date, stage, status, units, price_per_unit, location')
    .eq('contact_email', account.contact_email)
    .order('created_at', { ascending: false })

  const contractList = contracts || []

  // Get units for all contracts
  let totalUnits = 0
  let activeUnitsAll = 0
  for (const contract of contractList) {
    const { data: units } = await supabase
      .from('units')
      .select('id, status')
      .eq('contract_id', contract.id)
    totalUnits += units?.length || 0
    activeUnitsAll += units?.filter((u: any) => u.status === 'active').length || 0
  }

  const activeContracts = contractList.filter(c => c.stage >= 4 || c.status === 'active').length
  const pendingQuotes = contractList.filter(c => c.stage === 1).length
  const totalMonthlyCost = contractList
    .filter(c => c.status === 'active' || c.stage >= 4)
    .reduce((sum, c) => sum + ((c.units || 0) * (c.price_per_unit || 0) * 30), 0)

  return NextResponse.json({
    account,
    contracts: contractList,
    stats: {
      totalUnits,
      activeUnits: activeUnitsAll,
      activeContracts,
      pendingQuotes,
      totalMonthlyCost,
    },
  })
}
