'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Color constants ───────────────────────────────────────────────
const N = '#0B2540'
const T = '#00BFA6'
const A = '#F59E0B'

// ── Mock Data ─────────────────────────────────────────────────────
const MOCK_UNITS = [
  {
    id: 'unit-101',
    number: 'Unit 101',
    address: '1595 Kingsview Rd, Couch Bay',
    contract_ref: 'CF-2024-0012',
    contract_name: 'Maxwell Floors',
    occupants: ['Will Thompson', 'Marcus Lee'],
    occupancy: 'occupied' as const,
    cleanliness: 'clean' as const,
    overdue: false,
  },
  {
    id: 'unit-102',
    number: 'Unit 102',
    address: '1597 Kingsview Rd, Couch Bay',
    contract_ref: 'CF-2024-0012',
    contract_name: 'Maxwell Floors',
    occupants: ['Jake Reyes (departing Jul 1)'],
    occupancy: 'occupied' as const,
    cleanliness: 'dirty' as const,
    overdue: false,
  },
  {
    id: 'unit-103',
    number: 'Unit 103',
    address: '1599 Kingsview Rd, Couch Bay',
    contract_ref: 'CF-2024-0012',
    contract_name: 'Maxwell Floors',
    occupants: ['Priya Anand'],
    occupancy: 'occupied' as const,
    cleanliness: 'clean' as const,
    overdue: false,
  },
  {
    id: 'unit-104',
    number: 'Unit 104',
    address: '1601 Kingsview Rd, Couch Bay',
    contract_ref: 'CF-2024-0012',
    contract_name: 'Maxwell Floors',
    occupants: [],
    occupancy: 'vacant' as const,
    cleanliness: 'cleaning_requested' as const,
    overdue: true,
  },
  {
    id: 'unit-105',
    number: 'Unit 105',
    address: '1603 Kingsview Rd, Couch Bay',
    contract_ref: 'CF-2024-0012',
    contract_name: 'Maxwell Floors',
    occupants: ['Derek Wang', 'Sam Foster'],
    occupancy: 'occupied' as const,
    cleanliness: 'clean' as const,
    overdue: false,
  },
]

const MOCK_CLEANING_REQUESTS = [
  {
    id: 'cr-001',
    unit_number: 'Unit 102',
    unit_address: '1597 Kingsview Rd',
    contract_ref: 'CF-2024-0012',
    contract_name: 'Maxwell Floors',
    requested_by: 'kelly@maxwellfloors.com',
    scheduled_date: 'Jul 2, 2026',
    status: 'pending' as const,
    notes: 'Deep clean before new tenant',
  },
  {
    id: 'cr-002',
    unit_number: 'Unit 104',
    unit_address: '1601 Kingsview Rd',
    contract_ref: 'CF-2024-0012',
    contract_name: 'Maxwell Floors',
    requested_by: 'kelly@maxwellfloors.com',
    scheduled_date: 'Jun 10, 2026',
    status: 'pending' as const,
    overdue: true,
    notes: null,
  },
  {
    id: 'cr-003',
    unit_number: 'Unit 201',
    unit_address: '44 Lakeshore Blvd',
    contract_ref: 'CF-2024-0009',
    contract_name: 'Green Infrastructure Partners',
    requested_by: 'pm@greeninfra.ca',
    scheduled_date: 'Jun 15, 2026',
    status: 'assigned' as const,
    notes: null,
  },
]

const MOCK_STAFF_CHANGES = [
  {
    id: 'sc-001',
    unit_number: 'Unit 102',
    unit_address: '1597 Kingsview Rd, Couch Bay',
    contract_name: 'Maxwell Floors',
    outgoing: 'Jake Reyes',
    outgoing_date: 'Jul 1, 2026',
    incoming: 'TBD',
    incoming_date: null,
    requested_by: 'kelly@maxwellfloors.com',
    time_ago: '2h ago',
  },
  {
    id: 'sc-002',
    unit_number: 'Unit 305',
    unit_address: '88 Meridian Way, Fort McMurray',
    contract_name: 'Meridian Construction Group',
    outgoing: 'Sarah Kim',
    outgoing_date: 'Jun 20, 2026',
    incoming: 'Raj Patel',
    incoming_date: 'Jun 22, 2026',
    requested_by: 'ops@meridiangroup.ca',
    time_ago: 'Yesterday',
  },
]

// ── Badge configs ─────────────────────────────────────────────────
const CLEAN_BADGE = {
  clean: { emoji: '🟢', label: 'Clean', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  dirty: { emoji: '🔴', label: 'Dirty', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  cleaning_requested: { emoji: '🟡', label: 'Cleaning Requested', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}

const OCC_BADGE = {
  occupied: { label: 'Occupied', color: T, bg: 'rgba(0,191,166,0.1)' },
  vacant: { label: 'Vacant', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

const STATUS_BADGE = {
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  assigned: { label: 'Assigned', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  completed: { label: 'Completed', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
}

const lbl: React.CSSProperties = {
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#94a3b8',
  fontWeight: 600,
}

// ── Section Header ────────────────────────────────────────────────
function SectionHeader({ label, title, count }: { label: string; title: string; count?: number }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: N }}>{title}</div>
        {count !== undefined && (
          <span style={{ background: 'rgba(0,191,166,0.1)', color: T, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}>
            {count}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Units Overview Table ──────────────────────────────────────────
function UnitsOverview() {
  const [markedClean, setMarkedClean] = useState<string[]>([])

  return (
    <div>
      <SectionHeader label="Operations" title="Units Overview" count={MOCK_UNITS.length} />
      <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 2fr 2fr 1.2fr 1.8fr 1.5fr',
          padding: '10px 20px',
          background: '#f8f9fb',
          borderBottom: '1px solid #e8ecf0',
          gap: 8,
        }}>
          {['Unit Address', 'Contract', 'Occupants', 'Occupancy', 'Cleanliness', 'Actions'].map(h => (
            <div key={h} style={lbl}>{h}</div>
          ))}
        </div>

        {MOCK_UNITS.map((unit, i) => {
          const cleanBadge = CLEAN_BADGE[unit.cleanliness]
          const occBadge = OCC_BADGE[unit.occupancy]
          const isClean = markedClean.includes(unit.id)
          const effectiveBadge = isClean ? CLEAN_BADGE.clean : cleanBadge
          const needsAction = !isClean && unit.cleanliness !== 'clean'

          return (
            <div
              key={unit.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 2fr 2fr 1.2fr 1.8fr 1.5fr',
                padding: '14px 20px',
                borderBottom: i < MOCK_UNITS.length - 1 ? '1px solid #f1f4f8' : 'none',
                background: unit.overdue && !isClean
                  ? 'rgba(239,68,68,0.03)'
                  : 'transparent',
                gap: 8,
                alignItems: 'center',
                transition: 'background 0.2s',
              }}
            >
              {/* Address */}
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T, fontWeight: 700, marginBottom: 2 }}>
                  {unit.number}
                </div>
                <div style={{ fontSize: 12, color: N, fontWeight: 500 }}>{unit.address}</div>
              </div>

              {/* Contract */}
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T }}>{unit.contract_ref}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{unit.contract_name}</div>
              </div>

              {/* Occupants */}
              <div>
                {unit.occupants.length === 0 ? (
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                ) : (
                  unit.occupants.map((name, j) => (
                    <div key={j} style={{ fontSize: 12, color: '#334155', marginBottom: 1 }}>{name}</div>
                  ))
                )}
              </div>

              {/* Occupancy */}
              <div>
                <span style={{
                  fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600,
                  padding: '3px 9px', borderRadius: 20,
                  background: occBadge.bg, color: occBadge.color,
                }}>
                  {occBadge.label}
                </span>
              </div>

              {/* Cleanliness */}
              <div>
                <span style={{
                  fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600,
                  padding: '3px 9px', borderRadius: 20,
                  background: effectiveBadge.bg, color: effectiveBadge.color,
                }}>
                  {effectiveBadge.emoji} {effectiveBadge.label}
                </span>
                {unit.overdue && !isClean && (
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#ef4444', marginTop: 3, fontWeight: 700, letterSpacing: '0.1em' }}>
                    ⚠ OVERDUE 3 DAYS
                  </div>
                )}
              </div>

              {/* Action */}
              <div>
                {needsAction ? (
                  <button
                    onClick={() => setMarkedClean(prev => [...prev, unit.id])}
                    style={{
                      background: T, color: '#fff', border: 'none',
                      padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                      fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Mark Clean ✓
                  </button>
                ) : isClean ? (
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#22c55e', fontWeight: 700 }}>
                    ✓ Marked clean
                  </span>
                ) : (
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#cbd5e1' }}>—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Cleaning Requests Queue ───────────────────────────────────────
function CleaningQueue() {
  const [completed, setCompleted] = useState<string[]>([])

  return (
    <div>
      <SectionHeader
        label="Operations"
        title="Cleaning Requests"
        count={MOCK_CLEANING_REQUESTS.filter(r => !completed.includes(r.id)).length}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK_CLEANING_REQUESTS.map(req => {
          const isDone = completed.includes(req.id)
          const badge = isDone ? STATUS_BADGE.completed : STATUS_BADGE[req.status]
          const isOverdue = (req as any).overdue && !isDone

          return (
            <div key={req.id} style={{
              background: isDone ? '#f8f9fb' : '#fff',
              border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : '#e8ecf0'}`,
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
              transition: 'all 0.2s',
              opacity: isDone ? 0.65 : 1,
            }}>
              {/* Left: unit + contract */}
              <div style={{ flex: '1 1 180px' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T, fontWeight: 700, marginBottom: 2 }}>
                  {req.unit_number}
                </div>
                <div style={{ fontSize: 13, color: N, fontWeight: 600, marginBottom: 2 }}>{req.unit_address}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b' }}>
                  {req.contract_ref} · {req.contract_name}
                </div>
              </div>

              {/* Middle: request details */}
              <div style={{ flex: '1 1 160px' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                  Requested by
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                  {req.requested_by}
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                  Scheduled
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: isOverdue ? '#ef4444' : N, fontWeight: isOverdue ? 700 : 400 }}>
                  {req.scheduled_date}
                  {isOverdue && (
                    <span style={{ marginLeft: 6, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#ef4444', fontWeight: 800, background: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: 4 }}>
                      OVERDUE
                    </span>
                  )}
                </div>
              </div>

              {/* Right: status + action */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flex: '0 0 auto' }}>
                <span style={{
                  fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700,
                  padding: '4px 10px', borderRadius: 20,
                  background: badge.bg, color: badge.color,
                  border: `1px solid ${badge.color}44`,
                }}>
                  {isDone ? '✓ Completed' : badge.label}
                </span>
                {req.notes && (
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', maxWidth: 180, textAlign: 'right' }}>
                    "{req.notes}"
                  </div>
                )}
                {!isDone && (
                  <button
                    onClick={() => setCompleted(prev => [...prev, req.id])}
                    style={{
                      background: T, color: '#fff', border: 'none',
                      padding: '7px 14px', borderRadius: 7, cursor: 'pointer',
                      fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Mark Complete ✓
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Staff Changes Feed ────────────────────────────────────────────
function StaffChangeFeed() {
  return (
    <div>
      <SectionHeader label="Notifications" title="Recent Staff Changes" count={MOCK_STAFF_CHANGES.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK_STAFF_CHANGES.map(change => (
          <div key={change.id} style={{
            background: '#fff',
            border: '1px solid #e8ecf0',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}>
            {/* Icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(0,191,166,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>
              🔄
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T, fontWeight: 700 }}>
                  {change.unit_number}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>· {change.contract_name}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>
                  {change.time_ago}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{change.unit_address}</div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                {/* Outgoing */}
                <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                    Departing
                  </div>
                  <div style={{ fontSize: 13, color: N, fontWeight: 600 }}>{change.outgoing}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#ef4444' }}>{change.outgoing_date}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: 16 }}>→</div>

                {/* Incoming */}
                <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                    Incoming
                  </div>
                  <div style={{ fontSize: 13, color: change.incoming === 'TBD' ? '#94a3b8' : N, fontWeight: 600, fontStyle: change.incoming === 'TBD' ? 'italic' : 'normal' }}>
                    {change.incoming}
                  </div>
                  {change.incoming_date && (
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#22c55e' }}>{change.incoming_date}</div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8' }}>
                Requested by <span style={{ color: '#64748b' }}>{change.requested_by}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function ERSInternalPreview() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 220,
        background: N,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0 24px 0',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: T, fontWeight: 700, letterSpacing: '0.05em' }}>
            ContractFlow
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
            ERS Internal
          </div>
        </div>

        {/* Nav items */}
        <div style={{ padding: '12px 10px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Dashboard', active: false },
            { icon: '📋', label: 'Contracts', active: false },
            { icon: '🏠', label: 'Units', active: true },
            { icon: '🧹', label: 'Cleaning', active: false },
            { icon: '👥', label: 'Team', active: false },
            { icon: '📈', label: 'Analytics', active: false },
          ].map(({ icon, label, active }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                background: active ? 'rgba(0,191,166,0.12)' : 'transparent',
                color: active ? T : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.1s',
              }}
            >
              <span style={{ fontSize: 15 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* User footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 'auto' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            austin@eliasrangestays.ca
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, background: '#f8f9fb', minWidth: 0, display: 'flex', flexDirection: 'column' }}>

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
          flexShrink: 0,
        }}>
          ⚠ PREVIEW MODE — No live data · All content is hardcoded mock data for UI review
        </div>

        {/* ── Top Bar ── */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #e8ecf0',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <Link href="/dashboard" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            ← Dashboard
          </Link>
          <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Units & Cleaning Overview
          </div>
          <div style={{ flex: 1 }} />
          {/* Summary pills */}
          {[
            { label: '2 need cleaning', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
            { label: '1 overdue', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: '2 staff changes', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
          ].map(({ label, color, bg }) => (
            <span key={label} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: bg, color }}>
              {label}
            </span>
          ))}
        </div>

        {/* ── Page Content ── */}
        <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>

          {/* Page title */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
              ERS Internal
            </div>
            <div style={{ fontWeight: 700, fontSize: 26, color: N, letterSpacing: '-0.01em' }}>
              Units & Cleaning Management
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              CF-2024-0012 · Maxwell Floors · Couch Bay Staff Housing
            </div>
          </div>

          {/* ── Two-column layout on desktop, stack on mobile ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
            gap: 32,
            marginBottom: 32,
          }}>
            {/* Section A: Units Overview */}
            <div style={{ gridColumn: '1 / -1' }}>
              <UnitsOverview />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: 32,
          }}>
            {/* Section B: Cleaning Queue */}
            <div>
              <CleaningQueue />
            </div>

            {/* Section C: Staff Changes Feed */}
            <div>
              <StaffChangeFeed />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
