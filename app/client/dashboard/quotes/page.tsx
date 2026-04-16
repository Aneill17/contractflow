'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A'

interface Quote { id: string; units_needed: number | null; location: string | null; start_date: string | null; duration_months: number | null; notes: string | null; status: string; created_at: string }

export default function ClientQuotesPage() {
  const [quotes, setQuotes]     = useState<Quote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]   = useState(false)
  const [form, setForm] = useState({ units_needed: '', location: '', start_date: '', duration_months: '', notes: '' })

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/client/quotes', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) setQuotes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/client/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ units_needed: parseInt(form.units_needed)||null, location: form.location||null, start_date: form.start_date||null, duration_months: parseInt(form.duration_months)||null, notes: form.notes||null }),
    })
    if (res.ok) { setSuccess(true); setShowForm(false); setForm({ units_needed:'', location:'', start_date:'', duration_months:'', notes:'' }); await load(); setTimeout(()=>setSuccess(false),4000) }
    setSubmitting(false)
  }

  const sColor = (s: string) => s==='converted'?T:s==='reviewed'?'#6366f1':A
  const sLabel = (s: string) => s==='converted'?'Converted':s==='reviewed'?'Under Review':'Pending'

  const inSt: React.CSSProperties = { width:'100%', padding:'10px 12px', border:'1px solid #dde2e8', borderRadius:8, fontSize:14, color:N, marginBottom:16, boxSizing:'border-box', outline:'none' }
  const lbSt: React.CSSProperties = { display:'block', fontSize:11, fontFamily:'IBM Plex Mono', color:'#64748b', marginBottom:6, letterSpacing:'.06em', textTransform:'uppercase' }

  return (
    <div style={{ padding:'32px 36px', maxWidth:900 }}>
      <div style={{ fontFamily:'IBM Plex Mono', fontSize:11, color:T, letterSpacing:'.1em', marginBottom:6 }}>QUOTES</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <h1 style={{ fontWeight:800, color:N, fontSize:26, margin:0 }}>Quote Requests</h1>
        <div style={{ display:'flex', gap:10 }}>
          <Link href="/client/dashboard" style={{ fontSize:12, color:T, textDecoration:'none', fontFamily:'IBM Plex Mono', lineHeight:'40px' }}>← Dashboard</Link>
          <button onClick={()=>setShowForm(true)} style={{ padding:'10px 20px', borderRadius:8, border:'none', background:T, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14 }}>+ Request a Quote</button>
        </div>
      </div>

      {success && <div style={{ background:'#f0fdf4', border:'1px solid #86efac', color:'#16a34a', padding:'12px 16px', borderRadius:8, marginBottom:20, fontSize:13 }}>✅ Quote request submitted! We&apos;ll be in touch shortly.</div>}

      {showForm && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8ecf0', padding:28, marginBottom:28, boxShadow:'0 4px 16px rgba(11,37,64,.08)' }}>
          <h2 style={{ fontWeight:700, color:N, fontSize:18, marginBottom:20, marginTop:0 }}>Request a Quote</h2>
          <form onSubmit={submit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
              <div>
                <label style={lbSt}>Units Needed</label>
                <input type="number" min="1" required value={form.units_needed} onChange={e=>setForm(f=>({...f,units_needed:e.target.value}))} style={inSt}/>
                <label style={lbSt}>Preferred Location</label>
                <input type="text" required value={form.location} placeholder="City, Province" onChange={e=>setForm(f=>({...f,location:e.target.value}))} style={inSt}/>
              </div>
              <div>
                <label style={lbSt}>Start Date</label>
                <input type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} style={inSt}/>
                <label style={lbSt}>Duration (months)</label>
                <input type="number" min="1" value={form.duration_months} onChange={e=>setForm(f=>({...f,duration_months:e.target.value}))} style={inSt}/>
              </div>
            </div>
            <label style={lbSt}>Additional Notes</label>
            <textarea rows={4} value={form.notes} placeholder="Special requirements, unit preferences…" onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ ...inSt, resize:'vertical', marginBottom:20 }}/>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" onClick={()=>setShowForm(false)} style={{ padding:'10px 18px', borderRadius:8, border:'1px solid #e8ecf0', background:'#fff', color:'#64748b', cursor:'pointer', fontSize:14 }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ padding:'10px 20px', borderRadius:8, border:'none', background:T, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14 }}>{submitting?'Submitting…':'Submit Request'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div style={{ color:'#94a3b8', fontFamily:'IBM Plex Mono', fontSize:12 }}>Loading…</div> :
        !quotes.length ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#94a3b8', background:'#fff', borderRadius:12, border:'1px solid #e8ecf0' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>✦</div>
            <div style={{ fontSize:15 }}>No quote requests yet</div>
            <div style={{ fontSize:13, marginTop:6 }}>Click &ldquo;Request a Quote&rdquo; to get started</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {quotes.map(q => (
              <div key={q.id} style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:10, padding:'16px 20px', boxShadow:'0 1px 4px rgba(11,37,64,.05)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:700, color:N, fontSize:14 }}>{q.units_needed} unit{(q.units_needed||0)>1?'s':''} in {q.location||'TBD'}</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>
                      {q.start_date&&`Start: ${q.start_date}`}{q.duration_months&&` · ${q.duration_months} month${q.duration_months>1?'s':''}`}
                    </div>
                    {q.notes && <div style={{ fontSize:12, color:'#94a3b8', marginTop:6, fontStyle:'italic' }}>{q.notes}</div>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <span style={{ fontSize:9, fontFamily:'IBM Plex Mono', fontWeight:700, padding:'3px 8px', borderRadius:4, textTransform:'uppercase', background:`${sColor(q.status)}15`, color:sColor(q.status) }}>{sLabel(q.status)}</span>
                    <span style={{ fontSize:10, color:'#94a3b8' }}>{new Date(q.created_at).toLocaleDateString('en-CA')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
