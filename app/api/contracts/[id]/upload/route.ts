import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `contracts/${params.id}/contract.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('contract-files')
    .upload(path, file, { upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('contract-files')
    .getPublicUrl(path)

  // Save URL to contract
  await supabase.from('contracts').update({ contract_file_url: publicUrl }).eq('id', params.id)
  await supabase.from('audit_logs').insert({
    contract_id: params.id,
    actor: 'System',
    action: `Contract document uploaded: ${file.name}`,
  })

  return NextResponse.json({ url: publicUrl })
}
