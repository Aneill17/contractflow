'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A'

interface ContractItem {
  id: string
  reference: string
  client_name: string
  location: string
  units: number
  price_per_unit: number
  status?: string
  stage: number
  start_date: string
  end_date: string
}
interface QuoteItem {
  id: string
  units_needed: number | null
  location: string | null
  status: string
  created_at: string
}

const COLS = [
  { id: 'quote_requested', label: 'Quote Requested', icon: '✦', color: A },
  { id: 'contract_sent',   label: 'Contract Sent',   icon: '📨', color: '#6366f1' },
  { id: 'active',          label: 'Active',           icon: '✅', color: T },
  { id: 'completed',       label: 'Completed',        icon: '🏁', color: '#64748b' },
]

export default function PipelinePage() {
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [quotes, setQuotes]       = useState<QuoteItem[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/client/login'; return }
      const h = { Authorization: `Bearer ${session.access_token}` }
      const [meRes, qRes] = await Promise.all([
        fetch('/api/client-portal/me', { headers: h }),
        fetch('/api/client/quotes',    { headers: h }),
      ])
      if (meRes.ok) { const d = await meRes.json(); setContracts(d.contracts || []) }
      if (qRes.ok)  { setQuotes(await qRes.json()) }
      setLoading(false)
    })()
  }, [])

  const itemsFor = (colId: string) => {
    if (colId === 'quote_requested') return quotes.filter(q => q.status === 'pending').map(q => ({
      key: q.id, title: `${q.units_needed||'?'} units · ${q.location||'TBD'}`, sub: new Date(q.created_at).toLocaleDateString('en-CA'), badge: 'quote',
    }))
    if (colId === 'contract_sent') return contracts.filter(c => c.stage === 3 || c.status === 'sent').map(c => ({
      key: c.id, title: c.reference, sub: `${c.units} units · ${c.location}`, badge: 'contract',
    }))
    if (colId === 'active') return contracts.filter(c => c.status === 'active' || c.stage === 4 || c.stage === 5).map(c => ({
      key: c.id, title: c.reference, sub: `${c.units} units · ${c.location}`, badge: 'contract',
    }))
    if (colId === 'completed') return contracts.filter(c => c.status === 'completed').map(c => ({
      key: c.id, title: c.reference, sub: `${c.units} units · ${c.location}`, badge: 'contract',
    }))
    return []
  }

  if (loading) return <div style={{ padding:40, color:'#94a3b8', fontFamily:'IBM Plex Mono', fontSize:12 }}>Loading…</div>

  return (
    <div style={{ padding:'32px 36px', minHeight:'100vh' }}>
      <div style={{ fontFamily:'IBM Plex Mono', fontSize:11, color:T, letterSpacing:'.1em', marginBottom:6 }}>PIPELINE</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <h1 style={{ fontWeight:800, color:N, fontSize:26, margin:0, letterSpacing:'-.01em' }}>Contract Pipeline</h1>
        <Link href="/client/dashboard" style={{ fontSize:12, color:T, textDecoration:'none', fontFamily:'IBM Plex Mono' }}>← Dashboard</Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, overflowX:'auto', minWidth:800 }}>
        {COLS.map(col => {
          const items = itemsFor(col.id)
          return (
            <div key={col.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #e8ecf0', minHeight:400, overflow:'hidden' }}>
              <div style={{ padding:'14px 16px', borderBottom:'1px solid #e8ecf0', background:`${col.color}08`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:14 }}>{col.icon}</span>
                  <span style={{ fontWeight:700, color:col.color, fontSize:13 }}>{col.label}</span>
                </div>
                <span style={{ background:col.color, color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, fontFamily:'IBM Plex Mono' }}>{items.length}</span>
              </div>
              <div style={{ padding:12, display:'flex', flexDirection:'column', gap:8 }}>
                {!items.length && <div style={{ textAlign:'center', padding:'30px 10px', color:'#cbd5e1', fontSize:12 }}>—</div>}
                {items.map(item => (
                  <div key={item.key} style={{ background:'#f8f9fb', borderRadius:8, padding:'10px 12px', border:'1px solid #e8ecf0' }}>
                    <div style={{ fontWeight:600, color:N, fontSize:13 }}>{item.title}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{item.sub}</div>
                    <span style={{ display:'inline-block', marginTop:6, fontSize:9, fontFamily:'IBM Plex Mono', fontWeight:700, padding:'2px 6px', borderRadius:4, textTransform:'uppercase', background:`${col.color}15`, color:col.color }}>{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
