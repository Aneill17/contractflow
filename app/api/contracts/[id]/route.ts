import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendQuoteEmail, sendExecutedEmail } from '@/lib/emails'
import { getAuthUser } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('contracts')
    .select(`*, occupants(*), audit_logs(*)`)
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await req.json()
  const { audit_action, _audit, actor = 'System', occupants, ...patch } = body
  const auditMsg = audit_action || _audit

  // Fetch current contract
  const { data: current } = await supabase
    .from('contracts')
    .select('*, occupants(*)')
    .eq('id', params.id)
    .single()

  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // GUARD: Stage 1 → 2 (Quote Approved) can only be done by the client
  if (patch.stage === 2 && current.stage === 1 && actor !== 'Client') {
    return NextResponse.json({ error: 'Only the client can approve the quote.' }, { status: 403 })
  }

  // Update contract
  const { data: updated, error } = await supabase
    .from('contracts')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update occupants
  if (occupants) {
    await supabase.from('occupants').delete().eq('contract_id', params.id)
    if (occupants.length) {
      await supabase.from('occupants').insert(
        occupants.map((name: string) => ({ contract_id: params.id, name }))
      )
    }
  }

  // Audit log
  if (auditMsg) {
    await supabase.from('audit_logs').insert({ contract_id: params.id, actor, action: auditMsg })
  }

  // Email triggers
  if (patch.stage !== undefined) {
    const occ = current.occupants || []
    try {
      // Quote sent (0 → 1)
      if (patch.stage === 1 && current.stage === 0) {
        await sendQuoteEmail(updated, occ)
      }
      // Both signed (→ 4)
      if (patch.stage === 4 || (updated.client_sig && updated.provider_sig && current.stage < 4)) {
        await sendExecutedEmail(updated)
      }
    } catch (e) {
      console.error('Email error:', e)
    }
  }

  return NextResponse.json(updated)
}

// DELETE — owner role only
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServerClient()
  const { error } = await supabase.from('contracts').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
