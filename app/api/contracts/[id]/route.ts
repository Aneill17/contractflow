import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  sendQuoteEmail,
  sendConfirmationEmail,
  sendSigningEmail,
  sendExecutedEmail,
} from '@/lib/emails'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('contracts')
    .select(`*, occupants(*), audit_logs(order: created_at.desc)`)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await req.json()
  const { audit_action, actor = 'System', occupants, ...patch } = body

  // Fetch current contract for email triggers
  const { data: current } = await supabase
    .from('contracts')
    .select('*, occupants(*)')
    .eq('id', params.id)
    .single()

  // Update contract
  const { data: updated, error } = await supabase
    .from('contracts')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update occupants if provided
  if (occupants) {
    await supabase.from('occupants').delete().eq('contract_id', params.id)
    if (occupants.length) {
      await supabase.from('occupants').insert(
        occupants.map((name: string) => ({ contract_id: params.id, name }))
      )
    }
  }

  // Audit log
  if (audit_action) {
    await supabase.from('audit_logs').insert({
      contract_id: params.id,
      actor,
      action: audit_action,
    })
  }

  // ── Email triggers on stage change ──────────────────────────
  if (patch.stage !== undefined && current) {
    const occ = current.occupants || []
    try {
      if (patch.stage === 1) await sendQuoteEmail(updated, occ)
      if (patch.stage === 3) await sendConfirmationEmail(updated)
      if (patch.stage === 4 && updated.client_sig && updated.provider_sig) {
        await sendExecutedEmail(updated)
      }
    } catch (e) {
      console.error('Email send error:', e)
      // Don't fail the request if email fails
    }
  }

  return NextResponse.json(updated)
}
