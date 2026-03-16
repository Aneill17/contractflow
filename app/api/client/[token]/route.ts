import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendQuoteApprovedEmail } from '@/lib/emails'

export async function GET(_: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('contracts')
    .select('*, occupants(*)')
    .eq('client_token', params.token)
    .single()

  if (error) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createServerClient()
  const body = await req.json()
  const { audit_action, ...patch } = body

  const { data: contract, error: findError } = await supabase
    .from('contracts')
    .select('id, contact_name')
    .eq('client_token', params.token)
    .single()

  if (findError) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: updated, error } = await supabase
    .from('contracts')
    .update(patch)
    .eq('id', contract.id)
    .select('*, occupants(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (audit_action) {
    await supabase.from('audit_logs').insert({
      contract_id: contract.id,
      actor: contract.contact_name,
      action: audit_action,
    })
  }

  // Notify Austin when client approves the quote
  if (patch.stage === 2 && updated) {
    try {
      await sendQuoteApprovedEmail(updated)
    } catch (e) {
      console.error('Quote approved email failed:', e)
    }
  }

  return NextResponse.json(updated)
}
