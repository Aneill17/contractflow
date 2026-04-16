import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const isPrimary = formData.get('is_primary') === 'true'
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const supabase = createServerClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${params.id}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabase.storage
    .from('unit-photos')
    .upload(path, buffer, { contentType: file.type, upsert: false })
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('unit-photos').getPublicUrl(path)

  if (isPrimary) {
    await supabase.from('unit_photos').update({ is_primary: false }).eq('unit_id', params.id)
  }

  const { data, error } = await supabase
    .from('unit_photos')
    .insert([{ unit_id: params.id, url: urlData.publicUrl, is_primary: isPrimary }])
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const photoId = searchParams.get('photo_id')
  if (!photoId) return NextResponse.json({ error: 'photo_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data: photo } = await supabase.from('unit_photos').select('url').eq('id', photoId).single()
  if (photo?.url) {
    const pathPart = photo.url.split('/unit-photos/')[1]
    if (pathPart) await supabase.storage.from('unit-photos').remove([pathPart])
  }

  const { error } = await supabase.from('unit_photos').delete().eq('id', photoId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
