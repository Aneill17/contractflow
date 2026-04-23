'use client'

import { useState, useEffect, useRef } from 'react'
import { Contract, ContractUnit } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A'

async function authHdr(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

// ─── Unit Card ───────────────────────────────────────────────
function UnitCard({ unit, onClick }: { unit: ContractUnit; onClick: () => void }) {
  const photo = unit.unit_photos?.find(p => p.is_primary) || unit.unit_photos?.[0]
  const active = unit.status === 'active'
  return (
    <div onClick={onClick} style={{ background:'#fff', border:`1px solid ${active?T+'33':'#e8ecf0'}`, borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'box-shadow .18s', boxShadow:'0 1px 4px rgba(11,37,64,.06)' }}
      onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 4px 16px rgba(11,37,64,.12)')}
      onMouseLeave={e=>(e.currentTarget.style.boxShadow='0 1px 4px rgba(11,37,64,.06)')}>
      <div style={{ height:130, background:'#f1f4f8', position:'relative', overflow:'hidden' }}>
        {photo ? <img src={photo.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> :
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, color:'#cbd5e1' }}>🏠</div>}
        <div style={{ position:'absolute', top:8, right:8, background:active?`${T}dd`:'#94a3b8dd', color:'#fff', fontSize:9, fontFamily:'IBM Plex Mono', fontWeight:700, padding:'3px 8px', borderRadius:20, textTransform:'uppercase' }}>{unit.status}</div>
      </div>
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontWeight:600, color:N, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{unit.address||'Address TBD'}</div>
        {unit.guest_name && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>👤 {unit.guest_name}</div>}
        {!unit.guest_name && <div style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>No guest assigned</div>}
        {unit.wifi_ssid && <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>📶 {unit.wifi_ssid}</div>}
      </div>
    </div>
  )
}

// ─── Add Unit Form ───────────────────────────────────────────
function AddUnitForm({ contractId, contract, onDone, onCancel }: { contractId: string; contract: Contract; onDone:()=>void; onCancel:()=>void }) {
  const [f, setF] = useState({
    address:'',
    // Landlord lease side
    landlord_name:'', landlord_email:'', landlord_phone:'',
    lease_start:'', lease_end:'', lease_monthly_price:'',
    // Contract/guest side
    guest_name:'', guest_contact:'', contract_amount:'',
    // Extras
    wifi_ssid:'', wifi_password:'', notes:'',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    if (!f.address.trim()) { setErr('Address is required'); return }
    setSaving(true)
    const h = await authHdr()
    const res = await fetch('/api/contract-units', {
      method:'POST',
      headers:{'Content-Type':'application/json',...h},
      body:JSON.stringify({
        contract_id: contractId,
        address: f.address,
        landlord_name: f.landlord_name||null,
        landlord_email: f.landlord_email||null,
        landlord_phone: f.landlord_phone||null,
        lease_start: f.lease_start||null,
        lease_end: f.lease_end||null,
        lease_monthly_price: f.lease_monthly_price ? Number(f.lease_monthly_price) : null,
        guest_name: f.guest_name||null,
        guest_contact: f.guest_contact||null,
        daily_rate: f.contract_amount ? Number(f.contract_amount) : null,
        wifi_ssid: f.wifi_ssid||null,
        wifi_password: f.wifi_password||null,
        notes: f.notes||null,
        status: 'active',
      })
    })
    if (!res.ok) { const d=await res.json(); setErr(d.error||'Failed'); setSaving(false); return }
    onDone()
  }

  const lb: React.CSSProperties = { display:'block', fontSize:10, fontFamily:'IBM Plex Mono', color:'#64748b', marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em' as const }
  const inp = (label:string, key:keyof typeof f, type='text', placeholder='') => (
    <div style={{ marginBottom:12 }}>
      <label style={lb}>{label}</label>
      <input type={type} value={f[key] as string} placeholder={placeholder} onChange={e=>setF(p=>({...p,[key]:e.target.value}))} style={{ width:'100%', padding:'8px 10px', border:'1px solid #dde2e8', borderRadius:6, fontSize:13, color:N, boxSizing:'border-box' }} />
    </div>
  )
  const sectionTitle = (icon:string, label:string, color=N) => (
    <div style={{ fontFamily:'IBM Plex Mono', fontSize:10, fontWeight:700, color, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${color}22` }}>{icon} {label}</div>
  )

  return (
    <div style={{ background:'#f8f9fb', border:'1px solid #e8ecf0', borderRadius:10, padding:20, marginBottom:20 }}>
      <div style={{ fontWeight:700, color:N, fontSize:14, marginBottom:18 }}>Add Unit</div>
      {err && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'8px 12px', borderRadius:6, fontSize:12, marginBottom:14 }}>{err}</div>}

      {/* Address */}
      {inp('Unit Address','address','text','103-1504 Scott Crescent, Squamish')}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 28px', marginTop:4 }}>
        {/* LEFT — Landlord Lease */}
        <div>
          {sectionTitle('🏠','Landlord Lease','#1B4353')}
          {inp('Landlord Name','landlord_name')}
          {inp('Landlord Email','landlord_email','email')}
          {inp('Landlord Phone','landlord_phone','tel')}
          {inp('Lease Start','lease_start','date')}
          {inp('Lease End','lease_end','date')}
          {inp('Monthly Lease Amount ($)','lease_monthly_price','number','2800')}
        </div>
        {/* RIGHT — Contract / Guest */}
        <div>
          {sectionTitle('🤝','Contract & Guest',A)}
          {/* Contract dates pulled from contract — read only */}
          <div style={{ background:`${A}0d`, border:`1px solid ${A}33`, borderRadius:6, padding:'10px 12px', marginBottom:12 }}>
            <div style={{ fontSize:10, fontFamily:'IBM Plex Mono', color:A, fontWeight:700, letterSpacing:'.06em', marginBottom:6 }}>CONTRACT DATES</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div><div style={{ fontSize:9, color:'#94a3b8', fontFamily:'IBM Plex Mono', marginBottom:2 }}>START</div><div style={{ fontSize:13, color:N, fontWeight:600 }}>{contract.start_date||'—'}</div></div>
              <div><div style={{ fontSize:9, color:'#94a3b8', fontFamily:'IBM Plex Mono', marginBottom:2 }}>END</div><div style={{ fontSize:13, color:N, fontWeight:600 }}>{contract.end_date||'—'}</div></div>
            </div>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:6, fontStyle:'italic' }}>Compare with landlord lease dates on the left</div>
          </div>
          {inp('Guest Name','guest_name')}
          {inp('Guest Contact','guest_contact','tel')}
          {inp('Contract Daily Rate ($)','contract_amount','number','105')}
          {inp('WiFi SSID','wifi_ssid')}
          {inp('WiFi Password','wifi_password')}
          <div style={{ marginBottom:12 }}>
            <label style={lb}>Notes</label>
            <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} rows={2} style={{ width:'100%', padding:'8px 10px', border:'1px solid #dde2e8', borderRadius:6, fontSize:13, color:N, boxSizing:'border-box', resize:'vertical' }} />
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
        <button onClick={onCancel} style={{ padding:'7px 14px', borderRadius:6, border:'1px solid #e8ecf0', background:'#fff', color:'#64748b', cursor:'pointer', fontSize:13 }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding:'7px 14px', borderRadius:6, border:'none', background:T, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>{saving?'Adding…':'Add Unit'}</button>
      </div>
    </div>
  )
}

// ─── Unit Detail Modal ───────────────────────────────────────
function UnitModal({ unit, contract, onClose, onSaved }: { unit: ContractUnit; contract: Contract; onClose:()=>void; onSaved:()=>void }) {
  const u0 = unit as ContractUnit & { landlord_name?:string; landlord_email?:string; landlord_phone?:string; lease_start?:string; lease_end?:string; lease_monthly_price?:number; daily_rate?:number; notes?:string }
  const [f, setF] = useState({
    address: u0.address||'',
    landlord_name: u0.landlord_name||'', landlord_email: u0.landlord_email||'', landlord_phone: u0.landlord_phone||'',
    lease_start: u0.lease_start||'', lease_end: u0.lease_end||'', lease_monthly_price: u0.lease_monthly_price?.toString()||'',
    guest_name: u0.guest_name||'', guest_contact: u0.guest_contact||'', contract_amount: u0.daily_rate?.toString()||'',
    wifi_ssid: u0.wifi_ssid||'', wifi_password: u0.wifi_password||'', notes: u0.notes||'',
  })
  const [tab, setTab] = useState<'details'|'photos'|'leases'>('details')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [current, setCurrent] = useState(unit)
  const photoRef = useRef<HTMLInputElement>(null)
  const llRef = useRef<HTMLInputElement>(null)
  const clRef = useRef<HTMLInputElement>(null)

  const refresh = async () => {
    const h = await authHdr()
    const r = await fetch(`/api/contract-units/${unit.id}`, { headers: h })
    if (r.ok) { const d = await r.json(); setCurrent(d) }
    onSaved()
  }

  const save = async () => {
    setSaving(true)
    const h = await authHdr()
    await fetch(`/api/contract-units/${unit.id}`, { method:'PATCH', headers:{'Content-Type':'application/json',...h}, body:JSON.stringify({
      address: f.address,
      landlord_name: f.landlord_name||null, landlord_email: f.landlord_email||null, landlord_phone: f.landlord_phone||null,
      lease_start: f.lease_start||null, lease_end: f.lease_end||null,
      lease_monthly_price: f.lease_monthly_price ? Number(f.lease_monthly_price) : null,
      guest_name: f.guest_name||null, guest_contact: f.guest_contact||null,
      daily_rate: f.contract_amount ? Number(f.contract_amount) : null,
      wifi_ssid: f.wifi_ssid||null, wifi_password: f.wifi_password||null, notes: f.notes||null,
    }) })
    await refresh(); setSaving(false)
  }

  const toggleStatus = async () => {
    const h = await authHdr()
    const next = current.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/contract-units/${unit.id}`, { method:'PATCH', headers:{'Content-Type':'application/json',...h}, body:JSON.stringify({ status:next }) })
    await refresh()
  }

  const uploadPhoto = async (file:File, isPrimary:boolean) => {
    setUploading(true)
    const h = await authHdr(); const fd = new FormData()
    fd.append('file', file); fd.append('is_primary', isPrimary?'true':'false')
    await fetch(`/api/contract-units/${unit.id}/photos`, { method:'POST', headers:h, body:fd })
    await refresh(); setUploading(false)
  }

  const deletePhoto = async (id:string) => {
    const h = await authHdr()
    await fetch(`/api/contract-units/${unit.id}/photos?photo_id=${id}`, { method:'DELETE', headers:h })
    await refresh()
  }

  const uploadLease = async (file:File, type:'landlord'|'client') => {
    setUploading(true)
    const h = await authHdr(); const fd = new FormData()
    fd.append('file', file); fd.append('type', type)
    await fetch(`/api/contract-units/${unit.id}/leases`, { method:'POST', headers:h, body:fd })
    await refresh(); setUploading(false)
  }

  const inSt: React.CSSProperties = { width:'100%', padding:'8px 10px', border:'1px solid #dde2e8', borderRadius:6, fontSize:13, color:N, boxSizing:'border-box', marginBottom:12 }
  const lbSt: React.CSSProperties = { display:'block', fontSize:10, fontFamily:'IBM Plex Mono', color:'#64748b', marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,37,64,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:700, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #e8ecf0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <div>
            <div style={{ fontWeight:700, color:N, fontSize:16 }}>{current.address||'Unit Detail'}</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{current.guest_name||'No guest'}{current.guest_contact?` · ${current.guest_contact}`:''}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setF(p=>({...p, guest_name:'', guest_contact:''}))} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${A}44`, background:`${A}10`, color:A, cursor:'pointer', fontSize:12 }}>👥 Change Staff</button>
            <button onClick={toggleStatus} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${current.status==='active'?'#ef444444':''+T+'44'}`, background:current.status==='active'?'#fef2f2':`${T}10`, color:current.status==='active'?'#ef4444':T, cursor:'pointer', fontSize:12 }}>{current.status==='active'?'⏸ Deactivate':'▶ Activate'}</button>
            <button onClick={onClose} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #e8ecf0', background:'#f8f9fb', color:'#64748b', cursor:'pointer', fontSize:12 }}>✕</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #e8ecf0', padding:'0 24px' }}>
          {(['details','photos','leases'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'10px 16px', border:'none', background:'none', cursor:'pointer', fontSize:12, fontFamily:'IBM Plex Mono', textTransform:'uppercase', letterSpacing:'.06em', color:tab===t?N:'#94a3b8', borderBottom:`2px solid ${tab===t?T:'transparent'}`, transition:'all .15s' }}>
              {t==='details'?'📝 Details':t==='photos'?'📸 Photos':'📄 Leases'}
            </button>
          ))}
        </div>
        {/* Body */}
        <div style={{ flex:1, overflow:'auto', padding:24 }}>
          {tab==='details' && (
            <div>
              <div style={{ marginBottom:14 }}>
                <label style={lbSt}>Unit Address</label>
                <input value={f.address} onChange={e=>setF(p=>({...p,address:e.target.value}))} style={inSt} placeholder="103-1504 Scott Crescent, Squamish"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
                {/* Landlord Lease */}
                <div>
                  <div style={{ fontFamily:'IBM Plex Mono', fontSize:10, fontWeight:700, color:'#1B4353', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10, paddingBottom:6, borderBottom:'1px solid #1B435322' }}>🏠 Landlord Lease</div>
                  <label style={lbSt}>Landlord Name</label><input value={f.landlord_name} onChange={e=>setF(p=>({...p,landlord_name:e.target.value}))} style={inSt}/>
                  <label style={lbSt}>Landlord Email</label><input value={f.landlord_email} onChange={e=>setF(p=>({...p,landlord_email:e.target.value}))} style={inSt}/>
                  <label style={lbSt}>Landlord Phone</label><input value={f.landlord_phone} onChange={e=>setF(p=>({...p,landlord_phone:e.target.value}))} style={inSt}/>
                  <label style={lbSt}>Lease Start</label><input type="date" value={f.lease_start} onChange={e=>setF(p=>({...p,lease_start:e.target.value}))} style={inSt}/>
                  <label style={lbSt}>Lease End</label><input type="date" value={f.lease_end} onChange={e=>setF(p=>({...p,lease_end:e.target.value}))} style={inSt}/>
                  <label style={lbSt}>Monthly Lease Amount ($)</label><input type="number" value={f.lease_monthly_price} onChange={e=>setF(p=>({...p,lease_monthly_price:e.target.value}))} style={inSt} placeholder="2800"/>
                </div>
                {/* Contract / Guest */}
                <div>
                  <div style={{ fontFamily:'IBM Plex Mono', fontSize:10, fontWeight:700, color:A, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${A}22` }}>🤝 Contract & Guest</div>
                  <div style={{ background:`${A}0d`, border:`1px solid ${A}33`, borderRadius:6, padding:'10px 12px', marginBottom:12 }}>
                    <div style={{ fontSize:10, fontFamily:'IBM Plex Mono', color:A, fontWeight:700, letterSpacing:'.06em', marginBottom:6 }}>CONTRACT DATES</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <div><div style={{ fontSize:9, color:'#94a3b8', fontFamily:'IBM Plex Mono', marginBottom:2 }}>START</div><div style={{ fontSize:13, color:N, fontWeight:600 }}>{contract.start_date||'—'}</div></div>
                      <div><div style={{ fontSize:9, color:'#94a3b8', fontFamily:'IBM Plex Mono', marginBottom:2 }}>END</div><div style={{ fontSize:13, color:N, fontWeight:600 }}>{contract.end_date||'—'}</div></div>
                    </div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:4, fontStyle:'italic' }}>Compare with landlord lease dates on the left</div>
                  </div>
                  <label style={lbSt}>Guest Name</label><input value={f.guest_name} onChange={e=>setF(p=>({...p,guest_name:e.target.value}))} style={inSt}/>
                  <label style={lbSt}>Guest Contact</label><input value={f.guest_contact} onChange={e=>setF(p=>({...p,guest_contact:e.target.value}))} style={inSt}/>
                  <label style={lbSt}>Contract Daily Rate ($)</label><input type="number" value={f.contract_amount} onChange={e=>setF(p=>({...p,contract_amount:e.target.value}))} style={inSt} placeholder="105"/>
                  <label style={lbSt}>WiFi SSID</label><input value={f.wifi_ssid} onChange={e=>setF(p=>({...p,wifi_ssid:e.target.value}))} style={inSt}/>
                  <label style={lbSt}>WiFi Password</label><input value={f.wifi_password} onChange={e=>setF(p=>({...p,wifi_password:e.target.value}))} style={inSt}/>
                  <label style={lbSt}>Notes</label><textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} rows={3} style={{ ...inSt, resize:'vertical' }}/>
                </div>
              </div>
            </div>
          )}
          {tab==='photos' && (
            <div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{ if(e.target.files?.[0]) uploadPhoto(e.target.files[0], false) }}/>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <button onClick={()=>photoRef.current?.click()} disabled={uploading} style={{ padding:'8px 14px', borderRadius:6, border:`1px solid ${T}44`, background:`${T}10`, color:T, cursor:'pointer', fontSize:13 }}>{uploading?'Uploading…':'+ Add Photo'}</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {(current.unit_photos||[]).map(p=>(
                  <div key={p.id} style={{ position:'relative', borderRadius:8, overflow:'hidden', border:p.is_primary?`2px solid ${T}`:'1px solid #e8ecf0' }}>
                    <img src={p.url} alt="" style={{ width:'100%', height:110, objectFit:'cover' }}/>
                    {p.is_primary && <div style={{ position:'absolute', bottom:4, left:4, background:`${T}dd`, color:'#fff', fontSize:9, padding:'2px 6px', borderRadius:4, fontFamily:'IBM Plex Mono' }}>PRIMARY</div>}
                    <button onClick={()=>deletePhoto(p.id)} style={{ position:'absolute', top:4, right:4, background:'rgba(0,0,0,.6)', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', padding:'2px 6px', fontSize:11 }}>✕</button>
                  </div>
                ))}
                {!current.unit_photos?.length && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'#94a3b8', fontSize:13 }}>No photos yet</div>}
              </div>
            </div>
          )}
          {tab==='leases' && (
            <div>
              <input ref={llRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e=>{ if(e.target.files?.[0]) uploadLease(e.target.files[0],'landlord') }}/>
              <input ref={clRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e=>{ if(e.target.files?.[0]) uploadLease(e.target.files[0],'client') }}/>
              {(['landlord','client'] as const).map(type=>{
                const leases = (current.unit_leases||[]).filter(l=>l.lease_type===type)
                return (
                  <div key={type} style={{ marginBottom:24 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div style={{ fontWeight:700, color:N, fontSize:14 }}>{type==='landlord'?'🏠 Landlord Lease':'🤝 Client Lease'}</div>
                      <button onClick={()=>type==='landlord'?llRef.current?.click():clRef.current?.click()} disabled={uploading} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T}44`, background:`${T}10`, color:T, cursor:'pointer', fontSize:12 }}>{uploading?'Uploading…':'+ Upload'}</button>
                    </div>
                    {!leases.length && <div style={{ padding:16, background:'#f8f9fb', borderRadius:8, textAlign:'center', color:'#94a3b8', fontSize:12 }}>No {type} lease uploaded</div>}
                    {leases.map(l=>(
                      <div key={l.id} style={{ padding:'12px 14px', background:'#f8f9fb', borderRadius:8, marginBottom:8 }}>
                        <a href={l.file_url||'#'} target="_blank" rel="noreferrer" style={{ color:T, fontWeight:600, fontSize:13, textDecoration:'none' }}>📄 View {type} lease</a>
                        {(l.lease_start||l.lease_end) && <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{l.lease_start&&`From: ${l.lease_start}`} {l.lease_end&&`To: ${l.lease_end}`}</div>}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {/* Footer */}
        {tab==='details' && (
          <div style={{ padding:'14px 24px', borderTop:'1px solid #e8ecf0', display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 14px', borderRadius:6, border:'1px solid #e8ecf0', background:'#fff', color:'#64748b', cursor:'pointer', fontSize:13 }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding:'8px 14px', borderRadius:6, border:'none', background:T, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>{saving?'Saving…':'Save Changes'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────
export default function ContractUnitsTab({ contract, showToast }: { contract: Contract; showToast:(m:string,t?:string)=>void }) {
  const [units, setUnits] = useState<ContractUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<ContractUnit|null>(null)

  const fetch_ = async () => {
    setLoading(true)
    const h = await authHdr()
    const r = await fetch(`/api/contract-units?contract_id=${contract.id}`, { headers:h })
    setUnits(r.ok ? await r.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [contract.id])

  const active = units.filter(u=>u.status==='active').length
  const total = units.length

  return (
    <div>
      {/* Billing banner */}
      {total > 0 && (
        <div style={{ background:active<total?'#fff7ed':`${T}0a`, border:`1px solid ${active<total?A+'44':T+'33'}`, borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:13, color:active<total?A:'#0B6654', display:'flex', alignItems:'center', gap:8 }}>
          {active<total?'⚠️':'✅'} <strong>{active} of {total} units active</strong>
          {active<total && <span style={{ color:'#64748b', fontWeight:400 }}> — billing adjusted to active units only</span>}
        </div>
      )}
      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontWeight:700, color:N, fontSize:15 }}>Units ({total})</div>
        <button onClick={()=>setShowAdd(true)} style={{ padding:'8px 16px', borderRadius:6, border:'none', background:T, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>+ Add Unit</button>
      </div>
      {showAdd && <AddUnitForm contractId={contract.id} contract={contract} onDone={()=>{ setShowAdd(false); fetch_(); showToast('Unit added') }} onCancel={()=>setShowAdd(false)} />}
      {loading ? <div style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Loading…</div> :
        total===0 ? (
          <div style={{ textAlign:'center', padding:40, color:'#94a3b8', background:'#f8f9fb', borderRadius:10 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🏠</div>
            <div>No units yet — click Add Unit to get started</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 }}>
            {units.map(u=><UnitCard key={u.id} unit={u} onClick={()=>setSelected(u)} />)}
          </div>
        )
      }
      {selected && <UnitModal unit={selected} contract={contract} onClose={()=>setSelected(null)} onSaved={()=>{ fetch_(); setSelected(null) }} />}
    </div>
  )
}
