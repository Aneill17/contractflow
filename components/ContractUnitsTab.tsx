'use client'

import { useState, useEffect, useRef } from 'react'
import { Contract, ContractUnit, formatDate } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A'

async function authHdr(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

const inSt: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #dde2e8',
  borderRadius: 6, fontSize: 13, color: N, boxSizing: 'border-box', marginBottom: 10,
  fontFamily: 'IBM Plex Mono, monospace',
}
const lbSt: React.CSSProperties = {
  display: 'block', fontSize: 10, fontFamily: 'IBM Plex Mono', color: '#64748b',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em',
}

// ─── Unit Card ───────────────────────────────────────────────
function UnitCard({ unit, onClick }: { unit: ContractUnit; onClick: () => void }) {
  const photo = unit.unit_photos?.find(p => p.is_primary) || unit.unit_photos?.[0]
  const active = unit.status === 'active'
  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: `1px solid ${active ? T + '33' : '#e8ecf0'}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .18s', boxShadow: '0 1px 4px rgba(11,37,64,.06)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,37,64,.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(11,37,64,.06)')}
    >
      <div style={{ height: 130, background: '#f1f4f8', position: 'relative', overflow: 'hidden' }}>
        {photo
          ? <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#cbd5e1' }}>🏠</div>
        }
        <div style={{ position: 'absolute', top: 8, right: 8, background: active ? `${T}dd` : '#94a3b8dd', color: '#fff', fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase' }}>
          {unit.status}
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 600, color: N, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {unit.address || 'Address TBD'}
        </div>
        {unit.guest_name && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>👤 {unit.guest_name}</div>}
        {!unit.guest_name && <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>No guest assigned</div>}
        {unit.lease_start && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontFamily: 'IBM Plex Mono' }}>
            📅 {unit.lease_start} → {unit.lease_end || '?'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Unit Form ───────────────────────────────────────────
function AddUnitForm({ contractId, onDone, onCancel }: { contractId: string; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({
    address: '', wifi_ssid: '', wifi_password: '',
    guest_name: '', guest_contact: '',
    lease_type: 'month-to-month', lease_start: '', lease_end: '',
    landlord_name: '', landlord_email: '', landlord_phone: '',
    concierge_name: '', concierge_phone: '', concierge_notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

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

  const inp = (label: string, key: keyof typeof f, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 0 }}>
      <label style={lbSt}>{label}</label>
      <input type={type} value={f[key]} onChange={e => setF(p => ({ ...p, [key]: e.target.value }))} style={inSt} placeholder={placeholder} />
    </div>
  )

  return (
    <div style={{ background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, color: N, fontSize: 14, marginBottom: 14 }}>Add Unit</div>
      {err && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        {/* Left column */}
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: T, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, fontWeight: 700 }}>Property & Guest</div>
          {inp('Address *', 'address', 'text', '123 Main St, City, BC')}
          {inp('Guest Name', 'guest_name', 'text', 'Occupant name')}
          {inp('Guest Contact', 'guest_contact', 'text', 'Phone or email')}
          {inp('WiFi SSID', 'wifi_ssid', 'text', 'Network name')}
          {inp('WiFi Password', 'wifi_password', 'text', 'Password')}
        </div>

        {/* Right column */}
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, fontWeight: 700 }}>Lease & Contacts</div>
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
          {inp('Landlord Name', 'landlord_name', 'text', 'Property owner')}
          {inp('Landlord Email', 'landlord_email', 'email', 'landlord@example.com')}
          {inp('Landlord Phone', 'landlord_phone', 'tel', '250-555-0100')}
          {inp('Concierge Name', 'concierge_name', 'text', 'Building contact')}
          {inp('Concierge Phone', 'concierge_phone', 'tel', '250-555-0101')}
          <div style={{ marginBottom: 0 }}>
            <label style={lbSt}>Concierge Notes</label>
            <textarea
              value={f.concierge_notes}
              onChange={e => setF(p => ({ ...p, concierge_notes: e.target.value }))}
              rows={2}
              placeholder="Access codes, parking, building rules…"
              style={{ ...inSt, resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <button onClick={onCancel} style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: T, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {saving ? 'Adding…' : 'Add Unit'}
        </button>
      </div>
    </div>
  )
}

// ─── Unit Detail Modal ───────────────────────────────────────
function UnitModal({
  unit, contract, onClose, onSaved,
}: {
  unit: ContractUnit
  contract: Contract
  onClose: () => void
  onSaved: () => void
}) {
  const [f, setF] = useState({
    address: unit.address || '',
    wifi_ssid: unit.wifi_ssid || '',
    wifi_password: unit.wifi_password || '',
    guest_name: unit.guest_name || '',
    guest_contact: unit.guest_contact || '',
    notes: unit.notes || '',
    lease_type: unit.lease_type || 'month-to-month',
    lease_start: unit.lease_start || '',
    lease_end: unit.lease_end || '',
    landlord_name: unit.landlord_name || '',
    landlord_email: unit.landlord_email || '',
    landlord_phone: unit.landlord_phone || '',
    concierge_name: unit.concierge_name || '',
    concierge_phone: unit.concierge_phone || '',
    concierge_notes: unit.concierge_notes || '',
  })
  const [tab, setTab] = useState<'details' | 'photos' | 'leases'>('details')
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
    await fetch(`/api/contract-units/${unit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...h },
      body: JSON.stringify({ status: next }),
    })
    await refresh()
  }

  const uploadPhoto = async (file: File, isPrimary: boolean) => {
    setUploading(true)
    const h = await authHdr()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('is_primary', isPrimary ? 'true' : 'false')
    await fetch(`/api/contract-units/${unit.id}/photos`, { method: 'POST', headers: h, body: fd })
    await refresh()
    setUploading(false)
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
    fd.append('file', file)
    fd.append('type', type)
    await fetch(`/api/contract-units/${unit.id}/leases`, { method: 'POST', headers: h, body: fd })
    await refresh()
    setUploading(false)
  }

  const months = contract.start_date && contract.end_date
    ? Math.max(1, Math.round((new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : null

  const monthlyRate = contract.price_per_unit || 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,37,64,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 860, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8ecf0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: '#f8f9fb' }}>
          <div>
            <div style={{ fontWeight: 700, color: N, fontSize: 15 }}>{current.address || 'Unit Detail'}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {current.guest_name || 'No guest'}{current.guest_contact ? ` · ${current.guest_contact}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggleStatus}
              style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${current.status === 'active' ? '#ef444444' : T + '44'}`, background: current.status === 'active' ? '#fef2f2' : `${T}10`, color: current.status === 'active' ? '#ef4444' : T, cursor: 'pointer', fontSize: 12 }}
            >
              {current.status === 'active' ? '⏸ Deactivate' : '▶ Activate'}
            </button>
            <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>
        </div>

        {/* Body: two-panel split */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

          {/* LEFT PANEL — Contract Summary */}
          <div style={{ width: '32%', minWidth: 220, borderRight: '1px solid #e8ecf0', background: '#f8f9fb', padding: '20px 18px', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>
              Contract Summary
            </div>

            <div style={{ fontWeight: 700, color: N, fontSize: 15, marginBottom: 10 }}>{contract.client_name}</div>

            <div style={{ marginBottom: 10 }}>
              <div style={lbSt}>Reference</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: T }}>{contract.reference}</div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={lbSt}>Period</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#334155' }}>
                {formatDate(contract.start_date)}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8' }}>→</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#334155' }}>
                {formatDate(contract.end_date)}
              </div>
              {months && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{months} months</div>}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={lbSt}>Contact Manager</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#334155' }}>{contract.contact_name}</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#64748b', marginTop: 2 }}>{contract.contact_email}</div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={lbSt}>Monthly Rate / Unit</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, color: A, fontWeight: 700 }}>
                ${monthlyRate.toLocaleString()}
              </div>
            </div>

            <div style={{ marginTop: 14, padding: '10px 12px', background: current.status === 'active' ? `${T}0f` : '#f1f4f8', borderRadius: 8, border: `1px solid ${current.status === 'active' ? T + '33' : '#e8ecf0'}` }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: current.status === 'active' ? T : '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {current.status === 'active' ? '● Active' : '○ Inactive'}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — Tabs */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e8ecf0', padding: '0 20px', background: '#fff' }}>
              {(['details', 'photos', 'leases'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '.06em', color: tab === t ? N : '#94a3b8', borderBottom: `2px solid ${tab === t ? T : 'transparent'}`, transition: 'all .15s' }}
                >
                  {t === 'details' ? '📝 Details' : t === 'photos' ? '📸 Photos' : '📄 Leases'}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

              {tab === 'details' && (
                <div>
                  {/* GUEST INFO */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: T, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${T}22` }}>Guest Info</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                      <div><label style={lbSt}>Guest Name</label><input value={f.guest_name} onChange={e => setF(p => ({ ...p, guest_name: e.target.value }))} style={inSt} /></div>
                      <div><label style={lbSt}>Guest Contact</label><input value={f.guest_contact} onChange={e => setF(p => ({ ...p, guest_contact: e.target.value }))} style={inSt} /></div>
                    </div>
                  </div>

                  {/* LEASE INFO */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${A}22` }}>Lease Info</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
                      <div>
                        <label style={lbSt}>Lease Type</label>
                        <select value={f.lease_type} onChange={e => setF(p => ({ ...p, lease_type: e.target.value }))} style={{ ...inSt, cursor: 'pointer' }}>
                          <option value="month-to-month">Month-to-Month</option>
                          <option value="fixed-term">Fixed Term</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                      <div><label style={lbSt}>Lease Start</label><input type="date" value={f.lease_start} onChange={e => setF(p => ({ ...p, lease_start: e.target.value }))} style={inSt} /></div>
                      <div><label style={lbSt}>Lease End</label><input type="date" value={f.lease_end} onChange={e => setF(p => ({ ...p, lease_end: e.target.value }))} style={inSt} /></div>
                    </div>
                  </div>

                  {/* LANDLORD */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #6366f122' }}>Landlord</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
                      <div><label style={lbSt}>Landlord Name</label><input value={f.landlord_name} onChange={e => setF(p => ({ ...p, landlord_name: e.target.value }))} style={inSt} /></div>
                      <div><label style={lbSt}>Landlord Email</label><input type="email" value={f.landlord_email} onChange={e => setF(p => ({ ...p, landlord_email: e.target.value }))} style={inSt} /></div>
                      <div><label style={lbSt}>Landlord Phone</label><input type="tel" value={f.landlord_phone} onChange={e => setF(p => ({ ...p, landlord_phone: e.target.value }))} style={inSt} /></div>
                    </div>
                  </div>

                  {/* CONCIERGE */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e8ecf0' }}>Concierge</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                      <div><label style={lbSt}>Concierge Name</label><input value={f.concierge_name} onChange={e => setF(p => ({ ...p, concierge_name: e.target.value }))} style={inSt} /></div>
                      <div><label style={lbSt}>Concierge Phone</label><input type="tel" value={f.concierge_phone} onChange={e => setF(p => ({ ...p, concierge_phone: e.target.value }))} style={inSt} /></div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={lbSt}>Concierge Notes</label>
                        <textarea value={f.concierge_notes} onChange={e => setF(p => ({ ...p, concierge_notes: e.target.value }))} rows={2} style={{ ...inSt, resize: 'vertical' }} />
                      </div>
                    </div>
                  </div>

                  {/* PROPERTY */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e8ecf0' }}>Property</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={lbSt}>Address</label>
                        <input value={f.address} onChange={e => setF(p => ({ ...p, address: e.target.value }))} style={inSt} />
                      </div>
                      <div><label style={lbSt}>WiFi SSID</label><input value={f.wifi_ssid} onChange={e => setF(p => ({ ...p, wifi_ssid: e.target.value }))} style={inSt} /></div>
                      <div><label style={lbSt}>WiFi Password</label><input value={f.wifi_password} onChange={e => setF(p => ({ ...p, wifi_password: e.target.value }))} style={inSt} /></div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={lbSt}>Notes</label>
                        <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inSt, resize: 'vertical' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'photos' && (
                <div>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0], false) }} />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button onClick={() => photoRef.current?.click()} disabled={uploading} style={{ padding: '8px 14px', borderRadius: 6, border: `1px solid ${T}44`, background: `${T}10`, color: T, cursor: 'pointer', fontSize: 13 }}>
                      {uploading ? 'Uploading…' : '+ Add Photo'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {(current.unit_photos || []).map(p => (
                      <div key={p.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: p.is_primary ? `2px solid ${T}` : '1px solid #e8ecf0' }}>
                        <img src={p.url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                        {p.is_primary && <div style={{ position: 'absolute', bottom: 4, left: 4, background: `${T}dd`, color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontFamily: 'IBM Plex Mono' }}>PRIMARY</div>}
                        <button onClick={() => deletePhoto(p.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '2px 6px', fontSize: 11 }}>✕</button>
                      </div>
                    ))}
                    {!current.unit_photos?.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>No photos yet</div>}
                  </div>
                </div>
              )}

              {tab === 'leases' && (
                <div>
                  <input ref={llRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadLease(e.target.files[0], 'landlord') }} />
                  <input ref={clRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadLease(e.target.files[0], 'client') }} />
                  {(['landlord', 'client'] as const).map(type => {
                    const leases = (current.unit_leases || []).filter(l => l.type === type)
                    return (
                      <div key={type} style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ fontWeight: 700, color: N, fontSize: 14 }}>{type === 'landlord' ? '🏠 Landlord Lease' : '🤝 Client Lease'}</div>
                          <button
                            onClick={() => type === 'landlord' ? llRef.current?.click() : clRef.current?.click()}
                            disabled={uploading}
                            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T}44`, background: `${T}10`, color: T, cursor: 'pointer', fontSize: 12 }}
                          >
                            {uploading ? 'Uploading…' : '+ Upload'}
                          </button>
                        </div>
                        {!leases.length && <div style={{ padding: 16, background: '#f8f9fb', borderRadius: 8, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No {type} lease uploaded</div>}
                        {leases.map(l => (
                          <div key={l.id} style={{ padding: '12px 14px', background: '#f8f9fb', borderRadius: 8, marginBottom: 8 }}>
                            <a href={l.file_url || '#'} target="_blank" rel="noreferrer" style={{ color: T, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>📄 View {type} lease</a>
                            {(l.lease_start || l.lease_end) && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{l.lease_start && `From: ${l.lease_start}`} {l.lease_end && `To: ${l.lease_end}`}</div>}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {tab === 'details' && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid #e8ecf0', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#fff' }}>
                <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: T, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────
export default function ContractUnitsTab({
  contract,
  showToast,
}: {
  contract: Contract
  showToast: (m: string, t?: string) => void
}) {
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
      {/* Billing banner */}
      {total > 0 && (
        <div style={{ background: active < total ? '#fff7ed' : `${T}0a`, border: `1px solid ${active < total ? A + '44' : T + '33'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: active < total ? A : '#0B6654', display: 'flex', alignItems: 'center', gap: 8 }}>
          {active < total ? '⚠️' : '✅'}{' '}
          <strong>{active} of {total} units active</strong>
          {active < total && <span style={{ color: '#64748b', fontWeight: 400 }}> — billing adjusted to active units only</span>}
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: N, fontSize: 15 }}>Units ({total})</div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: T, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Add Unit</button>
      </div>

      {showAdd && (
        <AddUnitForm
          contractId={contract.id}
          onDone={() => { setShowAdd(false); fetch_(); showToast('Unit added') }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {loading
        ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</div>
        : total === 0
          ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', background: '#f8f9fb', borderRadius: 10 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏠</div>
              <div>No units yet — click Add Unit to get started</div>
            </div>
          )
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
              {units.map(u => <UnitCard key={u.id} unit={u} onClick={() => setSelected(u)} />)}
            </div>
          )
      }

      {selected && (
        <UnitModal
          unit={selected}
          contract={contract}
          onClose={() => setSelected(null)}
          onSaved={() => { fetch_(); setSelected(null) }}
        />
      )}
    </div>
  )
}
