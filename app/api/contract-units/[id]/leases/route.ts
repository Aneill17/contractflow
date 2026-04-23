import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const lease_type = formData.get('type') as 'landlord' | 'client' | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!lease_type) return NextResponse.json({ error: 'type required' }, { status: 400 })

  const supabase = createServerClient()
  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `${params.id}/${lease_type}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabase.storage
    .from('unit-leases')
    .upload(path, buffer, { contentType: file.type || 'application/pdf', upsert: false })
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('unit-leases').getPublicUrl(path)

  const { data, error } = await supabase
    .from('unit_leases')
    .insert([{
      unit_id: params.id,
      lease_type,
      file_url: urlData.publicUrl,
      lease_start: formData.get('lease_start') || null,
      lease_end: formData.get('lease_end') || null,
      terms: formData.get('terms') || null,
    }])
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const leaseId = searchParams.get('lease_id')
  if (!leaseId) return NextResponse.json({ error: 'lease_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase.from('unit_leases').delete().eq('id', leaseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
