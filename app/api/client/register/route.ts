import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email, password, company_name, contact_name } = await req.json()
  if (!email || !password || !company_name || !contact_name) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

  const userId = authData.user.id

  const { error: profileErr } = await admin
    .from('user_profiles')
    .insert([{ id: userId, role: 'client', name: contact_name, email }])

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  const { error: acctErr } = await admin
    .from('client_accounts')
    .insert([{ user_id: userId, company_name, contact_name, contact_email: email }])

  if (acctErr) return NextResponse.json({ error: acctErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
