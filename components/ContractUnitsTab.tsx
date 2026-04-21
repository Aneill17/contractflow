'use client'

import { useState, useEffect, useRef } from 'react'
import { Contract, ContractUnit, formatDate } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A', P = '#6366f1'

async function authHdr(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

const inSt: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #dde2e8',
  borderRadius: 6, fontSize: 13, color: N, boxSizing: 'border-box', marginBottom: 10,
  fontFamily: 'inherit',
}
const lbSt: React.CSSProperties = {
  display: 'block', fontSize: 10, fontFamily: 'IBM Plex Mono', color: '#64748b',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em',
}
const secHdr = (color: string): React.CSSProperties => ({
  fontFamily: 'IBM Plex Mono', fontSize: 10, color, textTransform: 'uppercase',
  letterSpacing: '.1em', fontWeight: 700, marginBottom: 10, paddingBottom: 6,
  borderBottom: `1px solid ${color}22`,
})

// ─── Mini Calendar ────────────────────────────────────────────
function UnitCalendar({ unit, contract }: { unit: ContractUnit; contract: Contract }) {
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DN = ['Su','Mo','Tu','We','Th','Fr','Sa']

  const cStart = contract.start_date ? new Date(contract.start_date) : null
  const cEnd   = contract.end_date   ? new Date(contract.end_date)   : null
  const lStart = unit.lease_start    ? new Date(unit.lease_start)    : null
  const lEnd   = unit.lease_end      ? new Date(unit.lease_end)      : null

  const anchor = lStart || cStart || new Date()
  const [ym, setYm] = useState({ y: anchor.getFullYear(), m: anchor.getMonth() })
  const nav = (d: -1|1) => setYm(p => { let m=p.m+d, y=p.y; if(m<0){m=11;y--} if(m>11){m=0;y++} return {y,m} })

  const { y, m } = ym
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m+1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i)=>i+1)]

  const dayStyle = (day: number) => {
    const d = new Date(y, m, day)
    const inContract = cStart && cEnd && d >= cStart && d <= cEnd
    const inLease    = lStart && lEnd && d >= lStart && d <= lEnd
    const isToday    = d.toDateString() === new Date().toDateString()
    const isCS = cStart && d.toDateString() === cStart.toDateString()
    const isCE = cEnd   && d.toDateString() === cEnd.toDateString()
    const isLS = lStart && d.toDateString() === lStart.toDateString()
    const isLE = lEnd   && d.toDateString() === lEnd.toDateString()

    let bg = '#f8f9fb', color = '#94a3b8', fw = 400, border = '1px solid transparent'
    if (inLease)    { bg = `${A}22`; color = '#92400e' }
    if (inContract) { bg = `${T}22`; color = '#065f46' }
    if (isCS || isCE) { bg = T; color = '#fff'; fw = 800 }
    if (isLS || isLE) { bg = A; color = '#fff'; fw = 800 }
    if (isToday) border = `2px solid ${T}`

    return { aspectRatio: '1', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: fw, background: bg, color, border } as React.CSSProperties
  }

  const fmt = (d: Date | null) => d ? `${MN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : '—'

  // Tooltip text for a day
  const dayTitle = (day: number) => {
    const d = new Date(y, m, day)
    const parts: string[] = []
    if (cStart && d.toDateString() === cStart.toDateString()) parts.push('Contract Start')
    if (cEnd   && d.toDateString() === cEnd.toDateString())   parts.push('Contract End')
    if (lStart && d.toDateString() === lStart.toDateString()) parts.push('Lease Start')
    if (lEnd   && d.toDateString() === lEnd.toDateString())   parts.push('Lease End')
    return parts.join(' · ')
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 800, color: N, fontSize: 18 }}>{MN[m]} {y}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => nav(-1)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', cursor: 'pointer', color: N, fontSize: 16, lineHeight: 1 }}>‹</button>
          {lStart && <button onClick={() => setYm({ y: lStart.getFullYear(), m: lStart.getMonth() })} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${A}55`, background: `${A}15`, cursor: 'pointer', fontSize: 11, color: A, fontFamily: 'IBM Plex Mono' }}>Lease Start</button>}
          {cStart && <button onClick={() => setYm({ y: cStart.getFullYear(), m: cStart.getMonth() })} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T}55`, background: `${T}15`, cursor: 'pointer', fontSize: 11, color: T, fontFamily: 'IBM Plex Mono' }}>Contract Start</button>}
          {(cEnd || lEnd) && <button onClick={() => { const e = lEnd || cEnd!; setYm({ y: e.getFullYear(), m: e.getMonth() }) }} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#f8f9fb', cursor: 'pointer', fontSize: 11, color: '#64748b', fontFamily: 'IBM Plex Mono' }}>Jump to End</button>}
          <button onClick={() => nav(1)}  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', cursor: 'pointer', color: N, fontSize: 16, lineHeight: 1 }}>›</button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 3 }}>
        {DN.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#94a3b8', padding: '4px 0' }}>{d}</div>)}
      </div>

      {/* Grid — bigger cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {cells.map((day, i) => day
          ? <div key={i} title={dayTitle(day)} style={{ ...dayStyle(day), minHeight: 44, fontSize: 14 }}>{day}</div>
          : <div key={i} style={{ minHeight: 44 }} />
        )}
      </div>

      {/* Legend + date summary */}
      <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8f9fb', borderRadius: 8, border: '1px solid #e8ecf0' }}>
        {cStart && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 12, height: 12, background: T, borderRadius: 3, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#334155' }}><strong>Client Contract:</strong> {fmt(cStart)} → {fmt(cEnd)}</span>
          </div>
        )}
        {lStart && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, background: A, borderRadius: 3, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#334155' }}><strong>Landlord Lease:</strong> {fmt(lStart)} → {fmt(lEnd)}</span>
          </div>
        )}
        {!cStart && !lStart && <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Add lease dates on the left panel to see them on the calendar.</div>}
      </div>
    </div>
  )
}

// ─── Unit Card ────────────────────────────────────────────────
function UnitCard({ unit, onClick }: { unit: ContractUnit; onClick: () => void }) {
  const photo = unit.unit_photos?.find(p => p.is_primary) || unit.unit_photos?.[0]
  const active = unit.status === 'active'
  return (
    <div onClick={onClick}
      style={{ background: '#fff', border: `1px solid ${active ? T+'33' : '#e8ecf0'}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .18s', boxShadow: '0 1px 4px rgba(11,37,64,.06)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,37,64,.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(11,37,64,.06)')}
    >
      <div style={{ height: 120, background: '#f1f4f8', position: 'relative', overflow: 'hidden' }}>
        {photo
          ? <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#cbd5e1' }}>🏠</div>
        }
        <div style={{ position: 'absolute', top: 7, right: 7, background: active ? `${T}dd` : '#94a3b8dd', color: '#fff', fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase' }}>
          {unit.status}
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 600, color: N, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {unit.address || 'Address TBD'}
        </div>
        {unit.guest_name
          ? <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>👤 {unit.guest_name}</div>
          : <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>No guest assigned</div>
        }
        {unit.lease_start && (
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontFamily: 'IBM Plex Mono' }}>
            📅 {unit.lease_start} → {unit.lease_end || '?'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Unit Form ─────────────────────────────────────────────
function AddUnitForm({ contractId, onDone, onCancel }: { contractId: string; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({
    address: '', wifi_ssid: '', wifi_password: '',
    guest_name: '', guest_email: '', guest_phone: '',
    guest2_name: '', guest2_email: '', guest2_phone: '',
    lease_type: 'month-to-month', lease_start: '', lease_end: '',
    landlord_name: '', landlord_email: '', landlord_phone: '', landlord_additional_contact: '',
    concierge_name: '', concierge_phone: '', concierge_notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [showGuest2, setShowGuest2] = useState(false)

  const save = async () => {
    if (!f.address.trim()) { setErr('Address is required'); return }
    setSaving(true)
    const h = await authHdr()
    const res = await fetch('/api/contract-units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...h },
      body: JSON.stringify({ contract_id: contractId, ...f }),
    })
    if (!res.ok) { const d = await res.json(); setErr(d.error || 'Failed'); setSaving(false); return }
    onDone()
  }

  const inp = (label: string, key: keyof typeof f, type = 'text', ph = '') => (
    <div>
      <label style={lbSt}>{label}</label>
      <input type={type} value={f[key]} onChange={e => setF(p => ({ ...p, [key]: e.target.value }))} style={inSt} placeholder={ph} />
    </div>
  )

  return (
    <div style={{ background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, color: N, fontSize: 14, marginBottom: 16 }}>Add Unit</div>
      {err && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
        {/* Left — Property & Landlord */}
        <div>
          <div style={secHdr(P)}>Property &amp; Landlord</div>
          {inp('Address *', 'address', 'text', '123 Main St, City, BC')}
          <div style={{ marginBottom: 0 }}>
            <label style={lbSt}>Lease Type</label>
            <select value={f.lease_type} onChange={e => setF(p => ({ ...p, lease_type: e.target.value }))} style={{ ...inSt, cursor: 'pointer' }}>
              <option value="month-to-month">Month-to-Month</option>
              <option value="fixed-term">Fixed Term</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          {inp('Lease Start', 'lease_start', 'date')}
          {inp('Lease End', 'lease_end', 'date')}
          <div style={{ height: 1, background: '#e8ecf0', margin: '6px 0 12px' }} />
          {inp('Landlord Name', 'landlord_name', 'text', 'Property owner')}
          {inp('Landlord Email', 'landlord_email', 'email', 'owner@example.com')}
          {inp('Landlord Phone', 'landlord_phone', 'tel', '250-555-0100')}
          {inp('Additional Contact', 'landlord_additional_contact', 'text', 'Property manager, strata, etc.')}
          <div style={{ height: 1, background: '#e8ecf0', margin: '6px 0 12px' }} />
          {inp('Concierge Name', 'concierge_name', 'text', 'Building contact')}
          {inp('Concierge Phone', 'concierge_phone', 'tel', '250-555-0101')}
          <div>
            <label style={lbSt}>Concierge Notes</label>
            <textarea value={f.concierge_notes} onChange={e => setF(p => ({ ...p, concierge_notes: e.target.value }))} rows={2} placeholder="Access codes, parking, building rules…" style={{ ...inSt, resize: 'vertical' }} />
          </div>
          {inp('WiFi SSID', 'wifi_ssid', 'text', 'Network name')}
          {inp('WiFi Password', 'wifi_password', 'text', 'Password')}
        </div>

        {/* Right — Contract & Guest */}
        <div>
          <div style={secHdr(T)}>Contract &amp; Guest</div>
          <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#64748b' }}>
            Contract start/end dates come from the contract itself. Add the contract manager and guest below.
          </div>
          <div style={{ height: 1, background: '#e8ecf0', margin: '0 0 12px' }} />
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Guest 1</div>
          {inp('Guest Name', 'guest_name', 'text', 'Occupant full name')}
          {inp('Guest Email', 'guest_email', 'email', 'guest@example.com')}
          {inp('Guest Phone', 'guest_phone', 'tel', '250-555-0200')}

          {!showGuest2 && (
            <button onClick={() => setShowGuest2(true)} style={{ marginTop: 4, marginBottom: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${T}44`, background: `${T}10`, color: T, cursor: 'pointer', fontSize: 12 }}>
              + Add Second Guest
            </button>
          )}
          {showGuest2 && (
            <>
              <div style={{ height: 1, background: '#e8ecf0', margin: '4px 0 12px' }} />
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Guest 2</div>
              {inp('Guest 2 Name', 'guest2_name', 'text', 'Second occupant')}
              {inp('Guest 2 Email', 'guest2_email', 'email', 'guest2@example.com')}
              {inp('Guest 2 Phone', 'guest2_phone', 'tel', '250-555-0201')}
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: T, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {saving ? 'Adding…' : 'Add Unit'}
        </button>
      </div>
    </div>
  )
}

// ─── Unit Modal ────────────────────────────────────────────────
function UnitModal({ unit, contract, onClose, onSaved }: { unit: ContractUnit; contract: Contract; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    address: unit.address || '',
    wifi_ssid: unit.wifi_ssid || '',
    wifi_password: unit.wifi_password || '',
    guest_name: unit.guest_name || '',
    guest_email: (unit as any).guest_email || '',
    guest_phone: (unit as any).guest_phone || '',
    guest2_name: (unit as any).guest2_name || '',
    guest2_email: (unit as any).guest2_email || '',
    guest2_phone: (unit as any).guest2_phone || '',
    notes: (unit as any).notes || '',
    lease_type: unit.lease_type || 'month-to-month',
    lease_start: unit.lease_start || '',
    lease_end: unit.lease_end || '',
    landlord_name: unit.landlord_name || '',
    landlord_email: unit.landlord_email || '',
    landlord_phone: unit.landlord_phone || '',
    landlord_additional_contact: (unit as any).landlord_additional_contact || '',
    concierge_name: unit.concierge_name || '',
    concierge_phone: unit.concierge_phone || '',
    concierge_notes: unit.concierge_notes || '',
  })
  const [rightTab, setRightTab] = useState<'contract' | 'guests' | 'calendar' | 'photos' | 'leases'>('contract')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [current, setCurrent] = useState(unit)
  const [showGuest2, setShowGuest2] = useState(!!(unit as any).guest2_name)
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
    await fetch(`/api/contract-units/${unit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...h },
      body: JSON.stringify(f),
    })
    await refresh()
    setSaving(false)
  }

  const toggleStatus = async () => {
    const h = await authHdr()
    const next = current.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/contract-units/${unit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...h }, body: JSON.stringify({ status: next }) })
    await refresh()
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    const h = await authHdr()
    const fd = new FormData()
    fd.append('file', file); fd.append('is_primary', 'false')
    await fetch(`/api/contract-units/${unit.id}/photos`, { method: 'POST', headers: h, body: fd })
    await refresh(); setUploading(false)
  }

  const deletePhoto = async (id: string) => {
    const h = await authHdr()
    await fetch(`/api/contract-units/${unit.id}/photos?photo_id=${id}`, { method: 'DELETE', headers: h })
    await refresh()
  }

  const uploadLease = async (file: File, type: 'landlord' | 'client') => {
    setUploading(true)
    const h = await authHdr()
    const fd = new FormData()
    fd.append('file', file); fd.append('type', type)
    await fetch(`/api/contract-units/${unit.id}/leases`, { method: 'POST', headers: h, body: fd })
    await refresh(); setUploading(false)
  }

  const inp = (label: string, key: keyof typeof f, type = 'text', ph = '') => (
    <div>
      <label style={lbSt}>{label}</label>
      <input type={type} value={f[key]} onChange={e => setF(p => ({ ...p, [key]: e.target.value }))} style={inSt} placeholder={ph} />
    </div>
  )

  const RIGHT_TABS = [
    { key: 'contract', label: '📋 Contract' },
    { key: 'guests',   label: '👤 Guests' },
    { key: 'calendar', label: '📅 Calendar' },
    { key: 'photos',   label: '📸 Photos' },
    { key: 'leases',   label: '📄 Leases' },
  ] as const

  const months = contract.start_date && contract.end_date
    ? Math.max(1, Math.round((new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,37,64,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 960, maxHeight: '94vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(11,37,64,.22)' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8ecf0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: N }}>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{current.address || 'Unit Detail'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{contract.client_name} · {contract.reference}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={toggleStatus} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${current.status === 'active' ? '#ef444455' : T+'55'}`, background: current.status === 'active' ? 'rgba(239,68,68,.15)' : `${T}22`, color: current.status === 'active' ? '#fca5a5' : T, cursor: 'pointer', fontSize: 12 }}>
              {current.status === 'active' ? '⏸ Deactivate' : '▶ Activate'}
            </button>
            <button onClick={onClose} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
        </div>

        {/* Two-panel body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

          {/* LEFT — Property & Landlord */}
          <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #e8ecf0', background: '#f8f9fb', overflowY: 'auto', padding: '18px 16px' }}>

            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: P, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 12 }}>Property &amp; Landlord</div>

            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Address</label>
              <input value={f.address} onChange={e => setF(p => ({ ...p, address: e.target.value }))} style={inSt} placeholder="123 Main St" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>WiFi SSID</label>
              <input value={f.wifi_ssid} onChange={e => setF(p => ({ ...p, wifi_ssid: e.target.value }))} style={inSt} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>WiFi Password</label>
              <input value={f.wifi_password} onChange={e => setF(p => ({ ...p, wifi_password: e.target.value }))} style={inSt} />
            </div>

            <div style={{ height: 1, background: '#e8ecf0', margin: '12px 0' }} />
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Lease</div>

            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Lease Type</label>
              <select value={f.lease_type} onChange={e => setF(p => ({ ...p, lease_type: e.target.value }))} style={{ ...inSt, cursor: 'pointer' }}>
                <option value="month-to-month">Month-to-Month</option>
                <option value="fixed-term">Fixed Term</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Lease Start</label>
              <input type="date" value={f.lease_start} onChange={e => setF(p => ({ ...p, lease_start: e.target.value }))} style={inSt} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Lease End</label>
              <input type="date" value={f.lease_end} onChange={e => setF(p => ({ ...p, lease_end: e.target.value }))} style={inSt} />
            </div>

            <div style={{ height: 1, background: '#e8ecf0', margin: '12px 0' }} />
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Landlord</div>

            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Landlord Name</label>
              <input value={f.landlord_name} onChange={e => setF(p => ({ ...p, landlord_name: e.target.value }))} style={inSt} placeholder="Property owner" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Landlord Email</label>
              <input type="email" value={f.landlord_email} onChange={e => setF(p => ({ ...p, landlord_email: e.target.value }))} style={inSt} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Landlord Phone</label>
              <input type="tel" value={f.landlord_phone} onChange={e => setF(p => ({ ...p, landlord_phone: e.target.value }))} style={inSt} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Additional Contact</label>
              <input value={f.landlord_additional_contact} onChange={e => setF(p => ({ ...p, landlord_additional_contact: e.target.value }))} style={inSt} placeholder="Strata, property mgr…" />
            </div>

            <div style={{ height: 1, background: '#e8ecf0', margin: '12px 0' }} />
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Concierge</div>

            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Concierge Name</label>
              <input value={f.concierge_name} onChange={e => setF(p => ({ ...p, concierge_name: e.target.value }))} style={inSt} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Concierge Phone</label>
              <input type="tel" value={f.concierge_phone} onChange={e => setF(p => ({ ...p, concierge_phone: e.target.value }))} style={inSt} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbSt}>Concierge Notes</label>
              <textarea value={f.concierge_notes} onChange={e => setF(p => ({ ...p, concierge_notes: e.target.value }))} rows={3} placeholder="Parking, access codes, rules…" style={{ ...inSt, resize: 'vertical' }} />
            </div>

            {/* Save button at bottom of left panel */}
            <button onClick={save} disabled={saving} style={{ width: '100%', marginTop: 8, padding: '8px 0', borderRadius: 7, border: 'none', background: T, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* RIGHT — Tabs */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e8ecf0', padding: '0 16px', background: '#fff', flexWrap: 'wrap' }}>
              {RIGHT_TABS.map(t => (
                <button key={t.key} onClick={() => setRightTab(t.key)}
                  style={{ padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'IBM Plex Mono', color: rightTab === t.key ? N : '#94a3b8', borderBottom: `2px solid ${rightTab === t.key ? T : 'transparent'}`, transition: 'all .15s', whiteSpace: 'nowrap' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

              {/* CONTRACT TAB */}
              {rightTab === 'contract' && (
                <div>
                  {/* Client header banner */}
                  <div style={{ background: N, borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 17 }}>{contract.client_name}</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: T, marginTop: 3 }}>{contract.reference} · {contract.location}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 20, color: T, fontWeight: 800 }}>${(contract.price_per_unit || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>per unit / month</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', marginBottom: 16 }}>
                    {/* Contract period */}
                    <div>
                      <div style={secHdr(T)}>Contract Period</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label style={lbSt}>Start</label>
                          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: N, padding: '8px 10px', background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 6 }}>{formatDate(contract.start_date) || '—'}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={lbSt}>End</label>
                          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: N, padding: '8px 10px', background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 6 }}>{formatDate(contract.end_date) || '—'}</div>
                        </div>
                      </div>
                      {months && (
                        <div style={{ padding: '8px 12px', background: `${T}10`, border: `1px solid ${T}33`, borderRadius: 6, fontSize: 13, color: '#065f46', fontFamily: 'IBM Plex Mono' }}>
                          {months} months · {contract.units} unit{contract.units !== 1 ? 's' : ''} · ${((contract.price_per_unit || 0) * contract.units * months).toLocaleString()} total
                        </div>
                      )}
                    </div>

                    {/* Contract manager */}
                    <div>
                      <div style={secHdr(A)}>Contract Manager</div>
                      <div style={{ padding: '12px 14px', background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, color: N, fontSize: 14, marginBottom: 4 }}>{contract.contact_name || '—'}</div>
                        {contract.contact_email && (
                          <a href={`mailto:${contract.contact_email}`} style={{ display: 'block', fontSize: 12, color: T, textDecoration: 'none', marginBottom: 2 }}>✉ {contract.contact_email}</a>
                        )}
                        {contract.contact_phone && (
                          <a href={`tel:${contract.contact_phone}`} style={{ display: 'block', fontSize: 12, color: '#64748b', textDecoration: 'none' }}>📞 {contract.contact_phone}</a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unit notes */}
                  <div>
                    <label style={lbSt}>Unit Notes</label>
                    <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inSt, resize: 'vertical' }} placeholder="Unit-specific notes for this contract…" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button onClick={save} disabled={saving} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: T, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {saving ? 'Saving…' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              )}

              {/* GUESTS TAB */}
              {rightTab === 'guests' && (
                <div>
                  <div style={secHdr(T)}>Guest 1</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 14px', marginBottom: 16 }}>
                    {inp('Name', 'guest_name', 'text', 'Full name')}
                    {inp('Email', 'guest_email', 'email', 'guest@example.com')}
                    {inp('Phone', 'guest_phone', 'tel', '250-555-0200')}
                  </div>

                  {!showGuest2
                    ? <button onClick={() => setShowGuest2(true)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T}44`, background: `${T}10`, color: T, cursor: 'pointer', fontSize: 12 }}>+ Add Second Guest</button>
                    : <>
                        <div style={{ height: 1, background: '#e8ecf0', margin: '4px 0 16px' }} />
                        <div style={secHdr(A)}>Guest 2</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 14px', marginBottom: 16 }}>
                          {inp('Name', 'guest2_name', 'text', 'Full name')}
                          {inp('Email', 'guest2_email', 'email', 'guest2@example.com')}
                          {inp('Phone', 'guest2_phone', 'tel', '250-555-0201')}
                        </div>
                        <button onClick={() => { setShowGuest2(false); setF(p => ({ ...p, guest2_name: '', guest2_email: '', guest2_phone: '' })) }} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #fca5a533', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                          Remove Guest 2
                        </button>
                      </>
                  }

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                    <button onClick={save} disabled={saving} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: T, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {/* CALENDAR TAB */}
              {rightTab === 'calendar' && (
                <div>
                  <UnitCalendar
                    unit={{ ...unit, lease_start: f.lease_start || unit.lease_start, lease_end: f.lease_end || unit.lease_end }}
                    contract={contract}
                  />
                  {!f.lease_start && !unit.lease_start && (
                    <div style={{ marginTop: 14, padding: '10px 14px', background: `${A}10`, border: `1px solid ${A}33`, borderRadius: 8, fontSize: 12, color: A }}>
                      💡 Add lease start &amp; end dates in the Property &amp; Landlord panel to see them on this calendar.
                    </div>
                  )}
                </div>
              )}

              {/* PHOTOS TAB */}
              {rightTab === 'photos' && (
                <div>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0]) }} />
                  <button onClick={() => photoRef.current?.click()} disabled={uploading} style={{ padding: '8px 14px', borderRadius: 6, border: `1px solid ${T}44`, background: `${T}10`, color: T, cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                    {uploading ? 'Uploading…' : '+ Add Photo'}
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {(current.unit_photos || []).map(p => (
                      <div key={p.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: p.is_primary ? `2px solid ${T}` : '1px solid #e8ecf0' }}>
                        <img src={p.url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                        <button onClick={() => deletePhoto(p.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '2px 6px', fontSize: 11 }}>✕</button>
                      </div>
                    ))}
                    {!current.unit_photos?.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>No photos yet</div>}
                  </div>
                </div>
              )}

              {/* LEASES TAB */}
              {rightTab === 'leases' && (
                <div>
                  <input ref={llRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadLease(e.target.files[0], 'landlord') }} />
                  <input ref={clRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadLease(e.target.files[0], 'client') }} />
                  {(['landlord', 'client'] as const).map(type => {
                    const leases = (current.unit_leases || []).filter(l => l.type === type)
                    return (
                      <div key={type} style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ fontWeight: 700, color: N, fontSize: 14 }}>{type === 'landlord' ? '🏠 Landlord Lease' : '🤝 Client Lease'}</div>
                          <button onClick={() => type === 'landlord' ? llRef.current?.click() : clRef.current?.click()} disabled={uploading}
                            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T}44`, background: `${T}10`, color: T, cursor: 'pointer', fontSize: 12 }}>
                            {uploading ? 'Uploading…' : '+ Upload PDF'}
                          </button>
                        </div>
                        {!leases.length
                          ? <div style={{ padding: 16, background: '#f8f9fb', borderRadius: 8, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No {type} lease uploaded</div>
                          : leases.map(l => (
                            <div key={l.id} style={{ padding: '12px 14px', background: '#f8f9fb', borderRadius: 8, marginBottom: 8 }}>
                              <a href={l.file_url || '#'} target="_blank" rel="noreferrer" style={{ color: T, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>📄 View {type} lease</a>
                              {(l.lease_start || l.lease_end) && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{l.lease_start && `From: ${l.lease_start}`} {l.lease_end && `To: ${l.lease_end}`}</div>}
                            </div>
                          ))
                        }
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────
export default function ContractUnitsTab({ contract, showToast }: { contract: Contract; showToast: (m: string, t?: string) => void }) {
  const [units, setUnits] = useState<ContractUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<ContractUnit | null>(null)

  const fetch_ = async () => {
    setLoading(true)
    const h = await authHdr()
    const r = await fetch(`/api/contract-units?contract_id=${contract.id}`, { headers: h })
    setUnits(r.ok ? await r.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [contract.id])

  const active = units.filter(u => u.status === 'active').length
  const total = units.length

  return (
    <div>
      {total > 0 && (
        <div style={{ background: active < total ? '#fff7ed' : `${T}0a`, border: `1px solid ${active < total ? A+'44' : T+'33'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: active < total ? A : '#0B6654', display: 'flex', alignItems: 'center', gap: 8 }}>
          {active < total ? '⚠️' : '✅'} <strong>{active} of {total} units active</strong>
          {active < total && <span style={{ color: '#64748b', fontWeight: 400 }}> — billing adjusted to active units only</span>}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: N, fontSize: 15 }}>Units ({total})</div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: T, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Add Unit</button>
      </div>

      {showAdd && <AddUnitForm contractId={contract.id} onDone={() => { setShowAdd(false); fetch_(); showToast('Unit added') }} onCancel={() => setShowAdd(false)} />}

      {loading
        ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</div>
        : total === 0
          ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', background: '#f8f9fb', borderRadius: 10 }}><div style={{ fontSize: 28, marginBottom: 8 }}>🏠</div>No units yet — click Add Unit to get started</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
              {units.map(u => <UnitCard key={u.id} unit={u} onClick={() => setSelected(u)} />)}
            </div>
      }

      {selected && <UnitModal unit={selected} contract={contract} onClose={() => setSelected(null)} onSaved={() => { fetch_(); setSelected(null) }} />}
    </div>
  )
}
