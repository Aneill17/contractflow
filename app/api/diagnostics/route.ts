import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, { ok: boolean; message: string }> = {}

  // ── Supabase ─────────────────────────────────────────────
  try {
    const supabase = createServerClient()
    const { count, error } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    results.supabase = { ok: true, message: `Connected — ${count} contracts in DB` }
  } catch (e: unknown) {
    results.supabase = { ok: false, message: e instanceof Error ? e.message : 'Connection failed' }
  }

  // ── Anthropic (Claude) ───────────────────────────────────
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set in environment')
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    })
    if (!res.ok) throw new Error(`API returned ${res.status}`)
    results.anthropic = { ok: true, message: 'API key valid — Claude ready for contract generation' }
  } catch (e: unknown) {
    results.anthropic = { ok: false, message: e instanceof Error ? e.message : 'Connection failed' }
  }

  // ── Docuseal ─────────────────────────────────────────────
  try {
    if (!process.env.DOCUSEAL_API_KEY) throw new Error('DOCUSEAL_API_KEY not set in environment')
    const res = await fetch('https://api.docuseal.com/templates', {
      headers: { 'X-Auth-Token': process.env.DOCUSEAL_API_KEY },
    })
    if (res.status === 401) throw new Error('Invalid API key')
    if (!res.ok && res.status !== 200) throw new Error(`API returned ${res.status}`)
    results.docuseal = { ok: true, message: 'API key valid — e-signature ready' }
  } catch (e: unknown) {
    results.docuseal = { ok: false, message: e instanceof Error ? e.message : 'Connection failed' }
  }

  // ── Resend ───────────────────────────────────────────────
  try {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set in environment')
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    })
    if (res.status === 401) throw new Error('Invalid API key')
    const data = await res.json()
    const domains = data.data || []
    const verified = domains.filter((d: { status: string }) => d.status === 'verified').map((d: { name: string }) => d.name)
    if (verified.length > 0) {
      results.resend = { ok: true, message: `API key valid — verified domains: ${verified.join(', ')}` }
    } else {
      results.resend = { ok: true, message: 'API key valid — no custom domains verified yet. Sending from onboarding@resend.dev' }
    }
  } catch (e: unknown) {
    results.resend = { ok: false, message: e instanceof Error ? e.message : 'Connection failed' }
  }

  return NextResponse.json(results)
}
