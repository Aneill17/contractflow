'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A'

interface Unit { id: string; address: string | null; guest_name: string | null; status: string; unit_photos?: Array<{ url: string; is_primary: boolean }> }
interface Contract {
  id: string; reference: string; client_name: string; location: string
  start_date: string; end_date: string; status?: string; stage: number
  units: number; price_per_unit: number
}

export default function ClientContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selected, setSelected]   = useState<Contract | null>(null)
  const [units, setUnits]         = useState<Unit[]>([])
  const [loading, setLoading]     = useState(true)
  const [loadingUnits, setLoadingUnits] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/client/login'; return }
      const res = await fetch('/api/client-portal/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) { const d = await res.json(); setContracts(d.contracts || []) }
      setLoading(false)
    })()
  }, [])

  const selectContract = async (c: Contract) => {
    setSelected(c); setUnits([]); setLoadingUnits(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch(`/api/contract-units?contract_id=${c.id}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) setUnits(await res.json())
    setLoadingUnits(false)
  }

  const statusColor = (s?: string) => s === 'active' ? T : s === 'completed' ? '#6366f1' : A

  if (loading) return <div style={{ padding:40, color:'#94a3b8', fontFamily:'IBM Plex Mono', fontSize:12 }}>Loading…</div>

  return (
    <div style={{ padding:'32px 36px', maxWidth:1200 }}>
      <div style={{ fontFamily:'IBM Plex Mono', fontSize:11, color:T, letterSpacing:'.1em', marginBottom:6 }}>CONTRACTS</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <h1 style={{ fontWeight:800, color:N, fontSize:26, margin:0 }}>Your Contracts</h1>
        <Link href="/client/dashboard" style={{ fontSize:12, color:T, textDecoration:'none', fontFamily:'IBM Plex Mono' }}>← Dashboard</Link>
      </div>

      {!contracts.length && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#94a3b8', background:'#fff', borderRadius:12, border:'1px solid #e8ecf0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:16 }}>No contracts yet</div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:selected?'380px 1fr':'1fr', gap:20 }}>
        {/* List */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {contracts.map(c => (
            <div key={c.id} onClick={()=>selectContract(c)}
              style={{ background:'#fff', border:`1px solid ${selected?.id===c.id?T+'55':'#e8ecf0'}`, borderRadius:10, padding:'16px 18px', cursor:'pointer', boxShadow:selected?.id===c.id?`0 0 0 2px ${T}22`:'0 1px 4px rgba(11,37,64,.05)', transition:'all .15s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:700, color:N, fontSize:14 }}>{c.reference}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{c.location}</div>
                </div>
                <span style={{ fontSize:9, fontFamily:'IBM Plex Mono', fontWeight:700, padding:'3px 8px', borderRadius:4, textTransform:'uppercase', background:`${statusColor(c.status)}15`, color:statusColor(c.status) }}>{c.status||'draft'}</span>
              </div>
              <div style={{ display:'flex', gap:14, marginTop:8, fontSize:11, color:'#94a3b8' }}>
                <span>🏠 {c.units} units</span>
                <span>💰 ${(c.units*c.price_per_unit).toLocaleString()}/mo</span>
                <span>📅 {c.start_date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8ecf0', padding:24, overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <div style={{ fontFamily:'IBM Plex Mono', fontSize:11, color:T, marginBottom:4 }}>{selected.reference}</div>
                <div style={{ fontWeight:800, color:N, fontSize:20 }}>{selected.client_name}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{selected.location}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #e8ecf0', background:'#f8f9fb', color:'#64748b', cursor:'pointer', fontSize:12 }}>✕ Close</button>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
              {[['Start Date',selected.start_date],['End Date',selected.end_date],['Units',`${selected.units} unit${selected.units>1?'s':''}`],['Monthly Cost',`$${(selected.units*selected.price_per_unit).toLocaleString()}`]].map(([l,v])=>(
                <div key={l} style={{ padding:'10px 12px', background:'#f8f9fb', borderRadius:8 }}>
                  <div style={{ fontSize:10, fontFamily:'IBM Plex Mono', color:'#94a3b8', marginBottom:3, textTransform:'uppercase', letterSpacing:'.06em' }}>{l}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:N }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Units grid */}
            {loadingUnits && <div style={{ color:'#94a3b8', fontSize:12, fontFamily:'IBM Plex Mono' }}>Loading units…</div>}
            {!loadingUnits && units.length>0 && (
              <div>
                <div style={{ fontWeight:700, color:N, fontSize:14, marginBottom:12 }}>Units ({units.length})</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
                  {units.map(u => {
                    const photo = u.unit_photos?.find(p=>p.is_primary)||u.unit_photos?.[0]
                    const active = u.status==='active'
                    return (
                      <div key={u.id} style={{ borderRadius:8, overflow:'hidden', border:'1px solid #e8ecf0' }}>
                        <div style={{ height:90, background:'#f1f4f8', overflow:'hidden' }}>
                          {photo ? <img src={photo.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> :
                            <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#cbd5e1' }}>🏠</div>}
                        </div>
                        <div style={{ padding:'8px 10px' }}>
                          <div style={{ fontSize:11, fontWeight:600, color:N, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.address||'TBD'}</div>
                          {u.guest_name && <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>👤 {u.guest_name}</div>}
                          <div style={{ fontSize:9, fontFamily:'IBM Plex Mono', marginTop:4, color:active?T:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{u.status}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Monthly AP */}
            <div style={{ marginTop:20, padding:16, background:`${A}08`, borderRadius:10, border:`1px solid ${A}22` }}>
              <div style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A, fontWeight:700, marginBottom:10, letterSpacing:'.08em' }}>MONTHLY ACCOUNTS PAYABLE</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:N, marginBottom:6 }}>
                <span>{selected.units} units × ${selected.price_per_unit?.toLocaleString()}/unit</span>
                <strong>${(selected.units*selected.price_per_unit).toLocaleString()}</strong>
              </div>
              <div style={{ borderTop:'1px solid #e8ecf0', paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:14, color:A }}>
                <span>Total Monthly</span>
                <span>${(selected.units*selected.price_per_unit).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
