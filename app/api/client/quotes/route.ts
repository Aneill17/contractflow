import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

async function getClientAccount(req: NextRequest) {
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
  const { data: account } = await srv.from('client_accounts').select('*').eq('user_id', user.id).single()
  return account
}

export async function GET(req: NextRequest) {
  const account = await getClientAccount(req)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const srv = createServerClient()
  const { data, error } = await srv.from('quote_requests').select('*').eq('client_id', account.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const account = await getClientAccount(req)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const srv = createServerClient()
  const { data, error } = await srv.from('quote_requests').insert([{
    client_id: account.id,
    units_needed: body.units_needed || null,
    location: body.location || null,
    start_date: body.start_date || null,
    duration_months: body.duration_months || null,
    notes: body.notes || null,
    status: 'pending',
  }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
