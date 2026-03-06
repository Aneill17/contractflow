import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { nanoid } from 'nanoid'

export async function GET() {
  const supabase = createServerClient()

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select(`*, occupants(*), audit_logs(*)`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(contracts)
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { occupants, ...contractData } = body

  // Generate reference number
  const year = new Date().getFullYear()
  const { count } = await supabase.from('contracts').select('*', { count: 'exact', head: true })
  const ref = `QT-${year}-${String((count || 0) + 1).padStart(4, '0')}`

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({ ...contractData, reference: ref, stage: 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert occupants
  if (occupants?.length) {
    await supabase.from('occupants').insert(
      occupants.map((name: string) => ({ contract_id: contract.id, name }))
    )
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    contract_id: contract.id,
    actor: 'System',
    action: 'Contract created',
  })

  return NextResponse.json(contract, { status: 201 })
}
