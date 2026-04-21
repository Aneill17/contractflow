import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contract_id')
  if (!contractId) return NextResponse.json({ error: 'contract_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('contract_documents')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const contractId = formData.get('contract_id') as string
  const type = formData.get('type') as string

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!contractId) return NextResponse.json({ error: 'contract_id required' }, { status: 400 })

  const supabase = createServerClient()
  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `${contractId}/${type}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabase.storage
    .from('contract-documents')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('contract-documents').getPublicUrl(path)

  const { data, error } = await supabase
    .from('contract_documents')
    .insert([{
      contract_id: contractId,
      type: type || 'other',
      file_url: urlData.publicUrl,
      file_name: file.name,
      uploaded_by: user.email || 'team',
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createServerClient()

  const { data: doc } = await supabase
    .from('contract_documents')
    .select('file_url')
    .eq('id', id)
    .single()

  if (doc?.file_url) {
    const pathPart = doc.file_url.split('/contract-documents/')[1]
    if (pathPart) await supabase.storage.from('contract-documents').remove([pathPart])
  }

  const { error } = await supabase.from('contract_documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
