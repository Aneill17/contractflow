'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Color constants ───────────────────────────────────────────────
const N = '#0B2540'
const T = '#00BFA6'
const A = '#F59E0B'

// ── Mock Data ─────────────────────────────────────────────────────
const MOCK_CONTRACT = {
  id: 'CF-2024-0012',
  reference: 'CF-2024-0012',
  company: 'Maxwell Floors',
  location: 'Couch Bay Staff Housing',
  start_date: '2024-11-01',
  end_date: '2026-09-01',
  rate: 105,
  people: 21,
  ers_contact: { name: 'Austin Neill', email: 'austin@eliasrangestays.ca' },
}

const MOCK_UNITS = [
  {
    id: 'unit-101',
    number: 'Unit 101',
    address: '1595 Kingsview Rd, Couch Bay',
    occupancy: 'occupied' as const,
    cleanliness: 'clean' as const,
    occupants: [
      { name: 'Will Thompson', status: 'active' as const },
      { name: 'Marcus Lee', status: 'active' as const },
    ],
  },
  {
    id: 'unit-102',
    number: 'Unit 102',
    address: '1597 Kingsview Rd, Couch Bay',
    occupancy: 'occupied' as const,
    cleanliness: 'dirty' as const,
    occupants: [
      { name: 'Jake Reyes', status: 'departing' as const, date: 'Jul 1, 2026' },
      { name: 'Incoming TBD', status: 'incoming' as const },
    ],
  },
  {
    id: 'unit-103',
    number: 'Unit 103',
    address: '1599 Kingsview Rd, Couch Bay',
    occupancy: 'occupied' as const,
    cleanliness: 'clean' as const,
    occupants: [{ name: 'Priya Anand', status: 'active' as const }],
  },
  {
    id: 'unit-104',
    number: 'Unit 104',
    address: '1601 Kingsview Rd, Couch Bay',
    occupancy: 'vacant' as const,
    cleanliness: 'cleaning_requested' as const,
    occupants: [],
  },
  {
    id: 'unit-105',
    number: 'Unit 105',
    address: '1603 Kingsview Rd, Couch Bay',
    occupancy: 'occupied' as const,
    cleanliness: 'clean' as const,
    occupants: [
      { name: 'Derek Wang', status: 'active' as const },
      { name: 'Sam Foster', status: 'active' as const },
    ],
  },
]

// ── Style constants ───────────────────────────────────────────────
const CLEAN_BADGE = {
  clean: { emoji: '🟢', label: 'Clean', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  dirty: { emoji: '🔴', label: 'Dirty', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  cleaning_requested: { emoji: '🟡', label: 'Cleaning Requested', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}

const OCC_BADGE = {
  occupied: { label: 'Occupied', color: T, bg: 'rgba(0,191,166,0.1)' },
  vacant: { label: 'Vacant', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

const STATUS_STYLE = {
  active: { label: 'active', color: '#22c55e' },
  departing: { label: 'departing', color: '#ef4444' },
  incoming: { label: 'incoming TBD', color: '#94a3b8' },
}

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
  background: '#fff',
}

const btnPrimary: React.CSSProperties = {
  background: T,
  color: '#fff',
  border: 'none',
  padding: '11px 20px',
  borderRadius: 9,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  background: 'transparent',
  color: '#64748b',
  border: '1px solid #e2e8f0',
  padding: '11px 20px',
  borderRadius: 9,
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })

// ── Unit Manage Panel (inline below card) ─────────────────────────
function UnitManagePanel({ unit, onClose }: { unit: typeof MOCK_UNITS[0]; onClose: () => void }) {
  const [incomingName, setIncomingName] = useState('')
  const [arrivalDate, setArrivalDate] = useState('')
  const [cleaningChecked, setCleaningChecked] = useState(true)
  const [cleaningDate, setCleaningDate] = useState('2026-07-02')
  const [cleaningNote, setCleaningNote] = useState('Deep clean before new tenant')
  const [saved, setSaved] = useState(false)

  const departing = unit.occupants.find(o => o.status === 'departing')

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${T}`,
      borderRadius: 12,
      padding: '24px',
      marginTop: 8,
      boxShadow: '0 4px 20px rgba(0,191,166,0.12)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: N }}>Manage {unit.number}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
      </div>

      {/* Current occupant departing */}
      {departing && (
        <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Current Occupant
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: N }}>{departing.name}</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#ef4444', marginTop: 3 }}>
            ✈ Departing {departing.date}
          </div>
        </div>
      )}

      {/* Add incoming staff */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14, fontWeight: 700 }}>
          Add Incoming Staff
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              style={inputStyle}
              placeholder="New tenant name"
              value={incomingName}
              onChange={e => setIncomingName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Arrival Date</label>
            <input
              style={inputStyle}
              type="date"
              value={arrivalDate}
              onChange={e => setArrivalDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cleaning request */}
      <div style={{ marginBottom: 24, padding: '16px', background: '#f8f9fb', borderRadius: 10, border: '1px solid #e8ecf0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cleaningChecked ? 14 : 0 }}>
          <input
            type="checkbox"
            id="cleaning-check"
            checked={cleaningChecked}
            onChange={e => setCleaningChecked(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: T, cursor: 'pointer' }}
          />
          <label htmlFor="cleaning-check" style={{ fontWeight: 600, fontSize: 13, color: N, cursor: 'pointer' }}>
            Request Cleaning
          </label>
        </div>
        {cleaningChecked && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            <div>
              <label style={labelStyle}>Scheduled Date</label>
              <input
                style={inputStyle}
                type="date"
                value={cleaningDate}
                onChange={e => setCleaningDate(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Note</label>
              <input
                style={inputStyle}
                placeholder="Notes for cleaning team…"
                value={cleaningNote}
                onChange={e => setCleaningNote(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {saved ? (
        <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.1)', borderRadius: 8, color: '#22c55e', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, textAlign: 'center' }}>
          ✓ Changes saved — ERS team has been notified.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnPrimary} onClick={() => setSaved(true)}>Save Changes →</button>
          <button style={btnSecondary} onClick={onClose}>Cancel</button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function ClientPortalPreview() {
  const [openUnit, setOpenUnit] = useState<string | null>('unit-102') // Unit 102 open by default

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Preview Banner ── */}
      <div style={{
        background: A,
        color: '#fff',
        textAlign: 'center',
        padding: '10px 20px',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
        ⚠ PREVIEW MODE — No live data · All content is hardcoded mock data for UI review
      </div>

      {/* ── Top Nav ── */}
      <nav style={{
        background: N,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 4,
        position: 'sticky',
        top: 40,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Logo area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 20 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #00BFA6, #0099cc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
          }}>
            MF
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#fff', fontWeight: 700 }}>
            Maxwell Floors
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 8px' }} />

        {[{ label: 'Contracts', active: true }, { label: 'Team', active: false }].map(({ label, active }) => (
          <span key={label} style={{
            padding: '6px 14px',
            borderRadius: 7,
            color: active ? T : 'rgba(255,255,255,0.55)',
            fontWeight: active ? 600 : 400,
            fontSize: 13,
            cursor: 'pointer',
          }}>{label}</span>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginRight: 16 }}>
          kelly@maxwellfloors.com
        </div>
        <button style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.4)',
          padding: '6px 14px',
          borderRadius: 7,
          cursor: 'pointer',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 11,
        }}>
          Logout
        </button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: T, cursor: 'pointer' }}>← Contracts</span>
        </div>

        {/* ── Contract Header Card ── */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', padding: '28px', marginBottom: 24, boxShadow: '0 1px 6px rgba(11,37,64,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
                Contract · {MOCK_CONTRACT.reference}
              </div>
              <div style={{ fontWeight: 700, fontSize: 26, color: N, marginBottom: 4, letterSpacing: '-0.01em' }}>
                {MOCK_CONTRACT.location}
              </div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                📍 Couch Bay, BC
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8' }}>
                  {fmt(MOCK_CONTRACT.start_date)} → {fmt(MOCK_CONTRACT.end_date)}
                </div>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: N }}>
                  ${MOCK_CONTRACT.rate}/night · {MOCK_CONTRACT.people} people
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <button style={{
                padding: '9px 18px', borderRadius: 8,
                border: '1px solid rgba(0,191,166,0.4)', background: 'rgba(0,191,166,0.06)',
                color: T, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                📅 Request Extension
              </button>
              <button style={{
                padding: '9px 18px', borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)',
                color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                🔴 Submit Notice to End
              </button>
              <button style={{
                padding: '9px 18px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#f8f9fb',
                color: '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                📝 Add Note
              </button>
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20, borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
            {[
              { label: 'Start Date', value: fmt(MOCK_CONTRACT.start_date) },
              { label: 'End Date', value: fmt(MOCK_CONTRACT.end_date) },
              { label: 'Rate', value: `$${MOCK_CONTRACT.rate}/night` },
              { label: 'People', value: String(MOCK_CONTRACT.people) },
              { label: 'Units', value: String(MOCK_UNITS.length) },
              { label: 'ERS Contact', value: MOCK_CONTRACT.ers_contact.name },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, color: N, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* ERS contact row */}
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(0,191,166,0.05)', borderRadius: 9, border: '1px solid rgba(0,191,166,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${T}, #0099cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>
              AN
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: N }}>{MOCK_CONTRACT.ers_contact.name}</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b' }}>
                ERS Account Manager · <a href={`mailto:${MOCK_CONTRACT.ers_contact.email}`} style={{ color: T, textDecoration: 'none' }}>{MOCK_CONTRACT.ers_contact.email}</a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Units Section ── */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: N }}>Units ({MOCK_UNITS.length})</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8' }}>
            {MOCK_UNITS.filter(u => u.occupancy === 'occupied').length} occupied ·{' '}
            {MOCK_UNITS.filter(u => u.cleanliness !== 'clean').length} need attention
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {MOCK_UNITS.map(unit => {
            const cleanBadge = CLEAN_BADGE[unit.cleanliness]
            const occBadge = OCC_BADGE[unit.occupancy]
            const isOpen = openUnit === unit.id

            return (
              <div key={unit.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Unit Card */}
                <div style={{
                  background: '#fff',
                  borderRadius: isOpen ? '12px 12px 0 0' : 12,
                  border: `1px solid ${isOpen ? T : '#e8ecf0'}`,
                  borderBottom: isOpen ? `1px solid ${T}` : '1px solid #e8ecf0',
                  padding: '18px 20px',
                  boxShadow: isOpen ? `0 2px 12px rgba(0,191,166,0.08)` : '0 1px 4px rgba(11,37,64,0.04)',
                  transition: 'all 0.15s',
                }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T, fontWeight: 700, marginBottom: 3 }}>
                        {unit.number}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: N }}>{unit.address}</div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{
                      fontSize: 11, padding: '3px 9px', borderRadius: 20,
                      background: occBadge.bg, color: occBadge.color,
                      fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600,
                    }}>
                      {occBadge.label}
                    </span>
                    <span style={{
                      fontSize: 11, padding: '3px 9px', borderRadius: 20,
                      background: cleanBadge.bg, color: cleanBadge.color,
                      fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600,
                    }}>
                      {cleanBadge.emoji} {cleanBadge.label}
                    </span>
                  </div>

                  {/* Occupants */}
                  <div style={{ marginBottom: 14, minHeight: 24 }}>
                    {unit.occupants.length === 0 ? (
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                        No occupants
                      </div>
                    ) : (
                      unit.occupants.map((occ, i) => {
                        const s = STATUS_STYLE[occ.status]
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: N, fontWeight: 500 }}>{occ.name}</span>
                            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: s.color }}>
                              {occ.status === 'departing' && (occ as any).date
                                ? `departing ${(occ as any).date}`
                                : s.label}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Manage button */}
                  <button
                    onClick={() => setOpenUnit(isOpen ? null : unit.id)}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: isOpen ? `1px solid ${T}` : '1px solid rgba(0,191,166,0.3)',
                      background: isOpen ? T : 'rgba(0,191,166,0.06)',
                      color: isOpen ? '#fff' : T,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isOpen ? '✕ Close Panel' : 'Manage Unit →'}
                  </button>
                </div>

                {/* Inline panel when open */}
                {isOpen && (
                  <UnitManagePanel unit={unit} onClose={() => setOpenUnit(null)} />
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
