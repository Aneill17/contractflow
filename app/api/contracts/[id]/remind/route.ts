import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendQuoteReminderEmail } from '@/lib/emails'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  if (contract.stage !== 1) {
    return NextResponse.json({ error: 'Reminders can only be sent for quotes awaiting approval.' }, { status: 400 })
  }

  try {
    await sendQuoteReminderEmail(contract)

    // Log it
    await supabase.from('audit_logs').insert({
      contract_id: contract.id,
      actor: 'Team',
      action: `Quote reminder sent to ${contract.contact_email}`,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Reminder email failed:', e)
    return NextResponse.json({ error: 'Failed to send reminder email.' }, { status: 500 })
  }
}
