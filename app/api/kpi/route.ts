import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: contracts, error: ce } = await supabase
    .from('contracts')
    .select('id, reference, client_name, units, price_per_unit, start_date, end_date, stage, quote_line_items, damage_deposit')
    .order('created_at', { ascending: false })

  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  const { data: units, error: ue } = await supabase
    .from('units')
    .select('id, address, city, monthly_cost, status')

  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 })

  const STAGE_LABELS: Record<number, string> = {
    0: 'Request', 1: 'Quote Sent', 2: 'Contract', 3: 'Contract Sent', 4: 'Signed', 5: 'Complete',
  }

  const calcMonths = (c: any) =>
    Math.max(1, Math.round(
      (new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
    ))

  const calcTotal = (c: any) => {
    const months = calcMonths(c)
    const base = (c.units || 0) * (c.price_per_unit || 0) * months
    const lineItems = ((c.quote_line_items || []) as any[]).reduce((s: number, li: any) => s + (li.amount || 0), 0)
    const deposit = c.damage_deposit || 0
    return base + lineItems + deposit
  }

  const allContracts = contracts || []
  const allUnits = units || []

  const totalPortfolioValue = allContracts.reduce((sum, c) => sum + calcTotal(c), 0)
  const activeContracts = allContracts.filter(c => [3, 4].includes(c.stage))
  const monthlyRecurring = activeContracts.reduce((sum, c) => sum + (c.units || 0) * (c.price_per_unit || 0), 0)

  const occupiedUnits = allUnits.filter(u => u.status === 'occupied').length
  const occupancyRate = allUnits.length > 0 ? Math.round((occupiedUnits / allUnits.length) * 100) : 0

  const stageBreakdown = [0, 1, 2, 3, 4, 5].map(stage => ({
    stage,
    label: STAGE_LABELS[stage],
    count: allContracts.filter(c => c.stage === stage).length,
    value: allContracts.filter(c => c.stage === stage).reduce((sum, c) => sum + calcTotal(c), 0),
  }))

  const unitStatusBreakdown = {
    vacant: allUnits.filter(u => u.status === 'vacant').length,
    occupied: allUnits.filter(u => u.status === 'occupied').length,
    maintenance: allUnits.filter(u => u.status === 'maintenance').length,
    reserved: allUnits.filter(u => u.status === 'reserved').length,
    total: allUnits.length,
  }

  const clientMap: Record<string, { client_name: string; units: number; value: number; stage: number }> = {}
  for (const c of allContracts) {
    if (!clientMap[c.client_name]) {
      clientMap[c.client_name] = { client_name: c.client_name, units: 0, value: 0, stage: c.stage }
    }
    clientMap[c.client_name].units += c.units || 0
    clientMap[c.client_name].value += calcTotal(c)
    if (c.stage > clientMap[c.client_name].stage) clientMap[c.client_name].stage = c.stage
  }
  const topClients = Object.values(clientMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return NextResponse.json({
    totalPortfolioValue,
    monthlyRecurring,
    activeContractsCount: activeContracts.length,
    totalContractsCount: allContracts.length,
    occupancyRate,
    stageBreakdown,
    unitStatusBreakdown,
    topClients,
  })
}
