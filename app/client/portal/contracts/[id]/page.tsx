'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const N = '#0B2540', T = '#00BFA6'

interface Contract {
  id: string
  reference: string
  location: string
  start_date: string
  end_date: string
  stage: number
  units: number
  price_per_unit: number
  notes: string
  occupants?: Occupant[]
  contract_units?: UnitRow[]
}

interface Occupant {
  id: string
  name: string
  status: 'active' | 'departing' | 'incoming'
  departure_date?: string
  arrival_date?: string
}

interface UnitRow {
  id: string
  address: string
  cleanliness: 'clean' | 'dirty' | 'cleaning_requested'
  occupancy_status: 'occupied' | 'vacant'
  status: string
  guest_name?: string
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const CLEAN_BADGE = {
  clean: { emoji: '🟢', label: 'Clean', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  dirty: { emoji: '🔴', label: 'Dirty', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  cleaning_requested: { emoji: '🟡', label: 'Requested', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}

// ── Modal component ─────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px', maxWidth: 520, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: N }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Extension request modal ──────────────────────────────────────
function ExtensionModal({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  const [duration, setDuration] = useState('30')
  const [customDays, setCustomDays] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setLoading(true)
    const d = duration === 'custom' ? `${customDays} days` : `${duration} days`
    await fetch(`/api/client/contracts/${contractId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_extension', duration: d, note }),
    })
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <Modal title="Extension Requested" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
        <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 8 }}>Request Sent</div>
        <div style={{ color: '#64748b', fontSize: 13 }}>Our team will be in touch shortly.</div>
        <button onClick={onClose} style={{ marginTop: 20, background: T, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Close</button>
      </div>
    </Modal>
  )

  return (
    <Modal title="Request Extension" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Duration</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['30', '60', '90', 'custom'].map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid',
                borderColor: duration === d ? T : '#e2e8f0',
                background: duration === d ? 'rgba(0,191,166,0.1)' : '#fff',
                color: duration === d ? T : '#64748b',
                cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12,
              }}>{d === 'custom' ? 'Custom' : `${d} days`}</button>
            ))}
          </div>
          {duration === 'custom' && (
            <input style={{ ...inputStyle, marginTop: 10 }} type="number" placeholder="Number of days" value={customDays} onChange={e => setCustomDays(e.target.value)} />
          )}
        </div>
        <div>
          <label style={labelStyle}>Note (optional)</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder="Any context for this request…" />
        </div>
        <button onClick={submit} disabled={loading || (duration === 'custom' && !customDays)} style={btnStyle}>
          {loading ? 'Sending…' : 'Submit Request'}
        </button>
      </div>
    </Modal>
  )
}

// ── Notice to end modal ───────────────────────────────────────────
function NoticeToEndModal({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!endDate) return
    setLoading(true)
    await fetch(`/api/client/contracts/${contractId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notice_to_end', end_date: endDate, note }),
    })
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <Modal title="Notice Submitted" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
        <div style={{ color: N, fontWeight: 600, marginBottom: 8 }}>Notice Received</div>
        <div style={{ color: '#64748b', fontSize: 13 }}>Our team has been notified.</div>
        <button onClick={onClose} style={{ marginTop: 20, background: T, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Close</button>
      </div>
    </Modal>
  )

  return (
    <Modal title="Submit Notice to End" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Requested End Date</label>
          <input style={inputStyle} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Note (optional)</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder="Any context…" />
        </div>
        <button onClick={submit} disabled={loading || !endDate} style={{ ...btnStyle, background: '#ef4444' }}>
          {loading ? 'Sending…' : 'Submit Notice'}
        </button>
      </div>
    </Modal>
  )
}

// ── Add note modal ────────────────────────────────────────────────
function AddNoteModal({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!note.trim()) return
    setLoading(true)
    await fetch(`/api/client/contracts/${contractId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_note', note }),
    })
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <Modal title="Note Added" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
        <div style={{ color: T, fontWeight: 600, marginBottom: 8 }}>Note Sent</div>
        <button onClick={onClose} style={{ marginTop: 12, background: T, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Close</button>
      </div>
    </Modal>
  )

  return (
    <Modal title="Add Note" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder="Your note to the ERS team…" autoFocus />
        <button onClick={submit} disabled={loading || !note.trim()} style={btnStyle}>
          {loading ? 'Sending…' : 'Send Note'}
        </button>
      </div>
    </Modal>
  )
}

// ── Unit management panel (modal) ─────────────────────────────────
function UnitPanel({ unit, onClose, onSaved }: { unit: UnitRow; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<'staff' | 'cleaning'>('staff')
  // Staff change form
  const [outgoingName, setOutgoingName] = useState('')
  const [outgoingDate, setOutgoingDate] = useState('')
  const [incomingName, setIncomingName] = useState('')
  const [incomingDate, setIncomingDate] = useState('')
  const [staffNotes, setStaffNotes] = useState('')
  // Cleaning form
  const [cleanDate, setCleanDate] = useState('')
  const [cleanNotes, setCleanNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const cleanBadge = CLEAN_BADGE[unit.cleanliness] || CLEAN_BADGE.clean

  const submitStaffChange = async () => {
    if (!outgoingName || !outgoingDate) { setError('Outgoing name and date required'); return }
    setLoading(true); setError('')
    const res = await fetch(`/api/client/units/${unit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'staff_change',
        outgoing_name: outgoingName, outgoing_date: outgoingDate,
        incoming_name: incomingName || null, incoming_date: incomingDate || null,
        notes: staffNotes || null,
      }),
    })
    if (res.ok) { setSuccess('Staff change recorded'); onSaved() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
    setLoading(false)
  }

  const submitCleaning = async () => {
    if (!cleanDate) { setError('Cleaning date required'); return }
    setLoading(true); setError('')
    const res = await fetch(`/api/client/units/${unit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cleaning_request', scheduled_date: cleanDate, notes: cleanNotes || null }),
    })
    if (res.ok) { setSuccess('Cleaning requested'); onSaved() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '28px', width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: N, marginBottom: 4 }}>
              {unit.address || 'Unit'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: cleanBadge.bg, color: cleanBadge.color, fontFamily: 'IBM Plex Mono, monospace' }}>
                {cleanBadge.emoji} {cleanBadge.label}
              </span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: unit.occupancy_status === 'occupied' ? 'rgba(0,191,166,0.1)' : 'rgba(148,163,184,0.1)', color: unit.occupancy_status === 'occupied' ? T : '#94a3b8', fontFamily: 'IBM Plex Mono, monospace' }}>
                {unit.occupancy_status === 'occupied' ? 'Occupied' : 'Vacant'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
        </div>

        {success && (
          <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.1)', borderRadius: 8, color: '#22c55e', marginBottom: 16, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
            ✓ {success}
          </div>
        )}
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: '#ef4444', marginBottom: 16, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
          {[
            { key: 'staff' as const, label: '🔄 Swap Staff' },
            { key: 'cleaning' as const, label: '🧹 Request Cleaning' },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError(''); setSuccess('') }} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid',
              borderColor: tab === t.key ? T : '#e2e8f0',
              background: tab === t.key ? 'rgba(0,191,166,0.1)' : '#fff',
              color: tab === t.key ? T : '#64748b',
              cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Staff change */}
        {tab === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Outgoing Staff
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} placeholder="John Smith" value={outgoingName} onChange={e => setOutgoingName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Departure Date</label>
                <input style={inputStyle} type="date" value={outgoingDate} onChange={e => setOutgoingDate(e.target.value)} />
              </div>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
              Incoming Staff (optional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} placeholder="Jane Doe" value={incomingName} onChange={e => setIncomingName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Arrival Date</label>
                <input style={inputStyle} type="date" value={incomingDate} onChange={e => setIncomingDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} placeholder="Any context…" value={staffNotes} onChange={e => setStaffNotes(e.target.value)} />
            </div>
            <button onClick={submitStaffChange} disabled={loading} style={btnStyle}>
              {loading ? 'Saving…' : 'Save Staff Change →'}
            </button>
          </div>
        )}

        {/* Cleaning request */}
        {tab === 'cleaning' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {unit.cleanliness === 'cleaning_requested' && (
              <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, color: '#f59e0b', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
                🟡 A cleaning request is already pending for this unit.
              </div>
            )}
            <div>
              <label style={labelStyle}>Cleaning Date Needed</label>
              <input style={inputStyle} type="date" value={cleanDate} onChange={e => setCleanDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Access instructions, specific areas…" value={cleanNotes} onChange={e => setCleanNotes(e.target.value)} />
            </div>
            <button onClick={submitCleaning} disabled={loading} style={btnStyle}>
              {loading ? 'Sending…' : 'Request Cleaning →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared styles ────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 10,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  color: N,
  outline: 'none',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  background: T,
  color: '#fff',
  border: 'none',
  padding: '13px 20px',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  width: '100%',
}

// ── Main page ────────────────────────────────────────────────────
export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'extension' | 'notice' | 'note' | null>(null)
  const [activeUnit, setActiveUnit] = useState<UnitRow | null>(null)

  const loadContract = useCallback(async () => {
    const res = await fetch(`/api/client/contracts/${id}`)
    if (res.status === 401) { window.location.href = '/client/portal/login'; return }
    if (res.ok) setContract(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { loadContract() }, [loadContract])

  const logout = async () => {
    await fetch('/api/client/auth/logout', { method: 'POST' })
    window.location.href = '/client/portal/login'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8' }}>Loading…</div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Contract not found.</div>
          <Link href="/client/portal/contracts" style={{ color: T, textDecoration: 'none', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>← Back to contracts</Link>
        </div>
      </div>
    )
  }

  const units: UnitRow[] = (contract as any).contract_units || (contract as any).units_data || []

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: N, height: 56, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 4, position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginRight: 20 }}>ERS · Client Portal</div>
        {[{ href: '/client/portal', label: 'Overview' }, { href: '/client/portal/contracts', label: 'Contracts' }, { href: '/client/portal/team', label: 'Team' }].map(({ href, label }) => (
          <Link key={href} href={href} style={{ padding: '6px 14px', borderRadius: 7, color: href === '/client/portal/contracts' ? T : 'rgba(255,255,255,0.55)', fontWeight: href === '/client/portal/contracts' ? 600 : 400, fontSize: 13, textDecoration: 'none' }}>{label}</Link>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>Logout</button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px' }}>
        {/* Breadcrumb */}
        <Link href="/client/portal/contracts" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          ← Contracts
        </Link>

        {/* Contract header */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', padding: '24px 28px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Contract</div>
              <div style={{ fontWeight: 700, fontSize: 24, color: N, marginBottom: 4 }}>{contract.reference}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>{contract.location}</div>
            </div>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setActiveModal('extension')} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(0,191,166,0.4)', background: 'rgba(0,191,166,0.06)', color: T, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                📅 Request Extension
              </button>
              <button onClick={() => setActiveModal('notice')} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                🔴 Notice to End
              </button>
              <button onClick={() => setActiveModal('note')} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8f9fb', color: '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                📝 Add Note
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { label: 'Start Date', value: fmt(contract.start_date) },
              { label: 'End Date', value: fmt(contract.end_date) },
              { label: 'Units', value: String(contract.units) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, color: N, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Units grid */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: N, marginBottom: 16 }}>Units ({units.length})</div>

          {units.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8' }}>No units found for this contract.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {units.map(unit => {
                const badge = CLEAN_BADGE[unit.cleanliness] || CLEAN_BADGE.clean
                return (
                  <div key={unit.id} style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e8ecf0',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: N }}>{unit.address || '(no address)'}</div>
                    {unit.guest_name && (
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b' }}>👤 {unit.guest_name}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: badge.bg, color: badge.color, fontFamily: 'IBM Plex Mono, monospace' }}>
                        {badge.emoji} {badge.label}
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: unit.occupancy_status === 'occupied' ? 'rgba(0,191,166,0.1)' : 'rgba(148,163,184,0.1)', color: unit.occupancy_status === 'occupied' ? T : '#94a3b8', fontFamily: 'IBM Plex Mono, monospace' }}>
                        {unit.occupancy_status === 'occupied' ? 'Occupied' : 'Vacant'}
                      </span>
                    </div>
                    <button onClick={() => setActiveUnit(unit)} style={{
                      marginTop: 4,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: `1px solid rgba(0,191,166,0.3)`,
                      background: 'rgba(0,191,166,0.06)',
                      color: T,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      Manage Unit →
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'extension' && <ExtensionModal contractId={id} onClose={() => setActiveModal(null)} />}
      {activeModal === 'notice' && <NoticeToEndModal contractId={id} onClose={() => setActiveModal(null)} />}
      {activeModal === 'note' && <AddNoteModal contractId={id} onClose={() => setActiveModal(null)} />}
      {activeUnit && (
        <UnitPanel
          unit={activeUnit}
          onClose={() => setActiveUnit(null)}
          onSaved={() => { loadContract(); setTimeout(() => setActiveUnit(null), 1500) }}
        />
      )}
    </div>
  )
}
