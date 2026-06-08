'use client'

import { useState } from 'react'

// ─── Color constants ──────────────────────────────────────────────────────────
const N = '#0B2540'
const T = '#00BFA6'
const A = '#F59E0B'

// ─── Types ────────────────────────────────────────────────────────────────────
type Cleanliness = 'clean' | 'dirty' | 'cleaning_requested'
type Occupancy = 'occupied' | 'vacant'
type CleaningStatus = 'pending' | 'assigned' | 'completed'

interface Unit {
  id: string
  number: string
  occupants: string[]
  departingNote?: string
  occupancy: Occupancy
  cleanliness: Cleanliness
  overdue?: boolean
  overdueLabel?: string
  leaseEnd: string
}

interface ContractGroup {
  contractRef: string
  clientName: string
  location: string
  totalUnits: number
  units: Unit[]
}

interface CleaningRequest {
  id: string
  unitNumber: string
  unitAddress: string
  contractRef: string
  contractName: string
  requestedBy: string
  scheduledDate: string
  status: CleaningStatus
  overdue?: boolean
  notes?: string
}

interface StaffChange {
  id: string
  unitNumber: string
  unitAddress: string
  contractName: string
  outgoing: string
  outgoingDate: string
  incoming: string
  incomingDate?: string
  requestedBy: string
  timeAgo: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CONTRACT_GROUPS: ContractGroup[] = [
  {
    contractRef: 'CF-2024-0012',
    clientName: 'Maxwell Floors',
    location: 'Couch Bay',
    totalUnits: 21,
    units: [
      {
        id: 'mf-101',
        number: '101',
        occupants: ['Will Thompson', 'Marcus Lee'],
        occupancy: 'occupied',
        cleanliness: 'clean',
        leaseEnd: 'Sep 1 2026',
      },
      {
        id: 'mf-102',
        number: '102',
        occupants: ['Jake Reyes'],
        departingNote: '⚠ Departing Jul 1',
        occupancy: 'occupied',
        cleanliness: 'dirty',
        leaseEnd: 'Sep 1 2026',
      },
      {
        id: 'mf-103',
        number: '103',
        occupants: ['Priya Anand'],
        occupancy: 'occupied',
        cleanliness: 'clean',
        leaseEnd: 'Sep 1 2026',
      },
      {
        id: 'mf-104',
        number: '104',
        occupants: [],
        occupancy: 'vacant',
        cleanliness: 'cleaning_requested',
        overdue: true,
        overdueLabel: '3 days ago — OVERDUE',
        leaseEnd: 'Sep 1 2026',
      },
      {
        id: 'mf-105',
        number: '105',
        occupants: ['Derek Wang', 'Sam Foster'],
        occupancy: 'occupied',
        cleanliness: 'clean',
        leaseEnd: 'Sep 1 2026',
      },
    ],
  },
  {
    contractRef: 'CF-2024-0009',
    clientName: 'Green Infrastructure Partners',
    location: 'Campbell River',
    totalUnits: 13,
    units: [
      {
        id: 'gip-a1',
        number: 'A1',
        occupants: ['Mitch Horne', 'Ryan Tao'],
        occupancy: 'occupied',
        cleanliness: 'clean',
        leaseEnd: 'Jul 31 2026',
      },
      {
        id: 'gip-a2',
        number: 'A2',
        occupants: [],
        occupancy: 'vacant',
        cleanliness: 'dirty',
        leaseEnd: 'Jul 31 2026',
      },
      {
        id: 'gip-a3',
        number: 'A3',
        occupants: ['Kenji Park'],
        occupancy: 'occupied',
        cleanliness: 'clean',
        leaseEnd: 'Jul 31 2026',
      },
    ],
  },
]

const CLEANING_REQUESTS: CleaningRequest[] = [
  {
    id: 'cr-001',
    unitNumber: 'Unit 102',
    unitAddress: '1597 Kingsview Rd, Couch Bay',
    contractRef: 'CF-2024-0012',
    contractName: 'Maxwell Floors',
    requestedBy: 'kelly@maxwellfloors.com',
    scheduledDate: 'Jul 2, 2026',
    status: 'pending',
    notes: 'Deep clean before new tenant',
  },
  {
    id: 'cr-002',
    unitNumber: 'Unit 104',
    unitAddress: '1601 Kingsview Rd, Couch Bay',
    contractRef: 'CF-2024-0012',
    contractName: 'Maxwell Floors',
    requestedBy: 'kelly@maxwellfloors.com',
    scheduledDate: 'Jun 5, 2026',
    status: 'pending',
    overdue: true,
    notes: undefined,
  },
  {
    id: 'cr-003',
    unitNumber: 'Unit A2',
    unitAddress: '44 Riverside Dr, Campbell River',
    contractRef: 'CF-2024-0009',
    contractName: 'Green Infrastructure Partners',
    requestedBy: 'pm@greeninfra.ca',
    scheduledDate: 'Jun 15, 2026',
    status: 'assigned',
    notes: undefined,
  },
]

const STAFF_CHANGES: StaffChange[] = [
  {
    id: 'sc-001',
    unitNumber: 'Unit 102',
    unitAddress: '1597 Kingsview Rd, Couch Bay',
    contractName: 'Maxwell Floors',
    outgoing: 'Jake Reyes',
    outgoingDate: 'Jul 1, 2026',
    incoming: 'TBD',
    requestedBy: 'kelly@maxwellfloors.com',
    timeAgo: '2h ago',
  },
  {
    id: 'sc-002',
    unitNumber: 'Unit 305',
    unitAddress: '88 Meridian Way, Fort McMurray',
    contractName: 'Meridian Construction Group',
    outgoing: 'Sarah Kim',
    outgoingDate: 'Jun 20, 2026',
    incoming: 'Raj Patel',
    incomingDate: 'Jun 22, 2026',
    requestedBy: 'ops@meridiangroup.ca',
    timeAgo: 'Yesterday',
  },
]

// ─── Badge configs ────────────────────────────────────────────────────────────
const CLEAN_BADGE: Record<Cleanliness, { emoji: string; label: string; color: string; bg: string }> = {
  clean:             { emoji: '🟢', label: 'Clean',              color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  dirty:             { emoji: '🔴', label: 'Dirty',              color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  cleaning_requested:{ emoji: '🟡', label: 'Cleaning Requested', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}

const OCC_BADGE: Record<Occupancy, { label: string; color: string; bg: string; emoji: string }> = {
  occupied: { label: 'Occupied', color: T,         bg: 'rgba(0,191,166,0.1)',      emoji: '🟢' },
  vacant:   { label: 'Vacant',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',    emoji: '⚪' },
}

const STATUS_BADGE: Record<CleaningStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'   },
  assigned:  { label: 'Assigned',  color: '#6366f1', bg: 'rgba(99,102,241,0.1)'   },
  completed: { label: 'Completed', color: '#22c55e', bg: 'rgba(34,197,94,0.1)'    },
}

const lbl: React.CSSProperties = {
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 10, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600,
}

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700,
      padding: '3px 10px', borderRadius: 20,
      background: bg, color, border: border ?? `1px solid ${color}44`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ─── Summary Stat Card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12,
      padding: '18px 22px', flex: '1 1 160px',
      borderTop: `3px solid ${accent ?? T}`,
    }}>
      <div style={{ ...lbl, marginBottom: 8 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 28, color: accent ?? N, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

// ─── Units Table ──────────────────────────────────────────────────────────────
function UnitsTable({ group }: { group: ContractGroup }) {
  const [markedClean, setMarkedClean] = useState<string[]>([])

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Group header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T, fontWeight: 700, marginBottom: 2 }}>
            {group.contractRef}
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: N }}>{group.clientName}</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8' }}>
            {group.location} · {group.totalUnits} units total (showing {group.units.length})
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1.2fr 1.6fr 1.2fr 1.1fr',
          padding: '10px 20px', background: '#f8f9fb',
          borderBottom: '1px solid #e8ecf0', gap: 8,
        }}>
          {['Unit', 'Occupants', 'Status', 'Cleanliness', 'Lease End', 'Actions'].map(h => (
            <div key={h} style={lbl}>{h}</div>
          ))}
        </div>

        {group.units.map((unit, i) => {
          const cleanBadge = CLEAN_BADGE[unit.cleanliness]
          const occBadge = OCC_BADGE[unit.occupancy]
          const isMarkedClean = markedClean.includes(unit.id)
          const effectiveClean = isMarkedClean ? CLEAN_BADGE.clean : cleanBadge
          const needsAction = !isMarkedClean && unit.cleanliness !== 'clean'
          const rowBg = (unit.overdue && !isMarkedClean) ? 'rgba(239,68,68,0.03)' : 'transparent'

          return (
            <div
              key={unit.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1.2fr 1.6fr 1.2fr 1.1fr',
                padding: '14px 20px',
                borderBottom: i < group.units.length - 1 ? '1px solid #f1f4f8' : 'none',
                background: rowBg, gap: 8, alignItems: 'center',
                transition: 'background 0.2s',
              }}
            >
              {/* Unit */}
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: N, fontWeight: 700 }}>
                  Unit {unit.number}
                </div>
              </div>

              {/* Occupants */}
              <div>
                {unit.occupants.length === 0 ? (
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {unit.occupants.map((name, j) => (
                      <div key={j} style={{ fontSize: 12, color: '#334155' }}>{name}</div>
                    ))}
                    {unit.departingNote && (
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#f59e0b', fontWeight: 700, marginTop: 2 }}>
                        {unit.departingNote}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Occupancy status */}
              <div>
                <Badge
                  label={`${occBadge.emoji} ${occBadge.label}`}
                  color={occBadge.color}
                  bg={occBadge.bg}
                />
              </div>

              {/* Cleanliness */}
              <div>
                <Badge
                  label={`${effectiveClean.emoji} ${effectiveClean.label}`}
                  color={effectiveClean.color}
                  bg={effectiveClean.bg}
                />
                {unit.overdue && !isMarkedClean && (
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#ef4444', marginTop: 4, fontWeight: 800, letterSpacing: '0.08em' }}>
                    ⚠ {unit.overdueLabel}
                  </div>
                )}
              </div>

              {/* Lease end */}
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b' }}>
                  {unit.leaseEnd}
                </div>
              </div>

              {/* Actions */}
              <div>
                {needsAction ? (
                  <button
                    onClick={() => setMarkedClean(prev => [...prev, unit.id])}
                    style={{
                      background: T, color: '#fff', border: 'none',
                      padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                      fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 700,
                      whiteSpace: 'nowrap', transition: 'opacity 0.15s',
                    }}
                  >
                    Mark Clean ✓
                  </button>
                ) : isMarkedClean ? (
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

// ─── Cleaning Queue ────────────────────────────────────────────────────────────
function CleaningQueue() {
  const [completed, setCompleted] = useState<string[]>([])

  const pending = CLEANING_REQUESTS.filter(r => !completed.includes(r.id))

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
          Operations
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: N }}>Cleaning Queue</div>
          <span style={{ background: 'rgba(245,158,11,0.1)', color: A, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}>
            {pending.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CLEANING_REQUESTS.map(req => {
          const isDone = completed.includes(req.id)
          const badge = isDone ? STATUS_BADGE.completed : STATUS_BADGE[req.status]
          const isOverdue = req.overdue && !isDone

          return (
            <div key={req.id} style={{
              background: isDone ? '#f8f9fb' : '#fff',
              border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : '#e8ecf0'}`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
              transition: 'all 0.2s', opacity: isDone ? 0.65 : 1,
            }}>
              <div style={{ flex: '1 1 180px' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T, fontWeight: 700, marginBottom: 2 }}>
                  {req.unitNumber}
                </div>
                <div style={{ fontSize: 13, color: N, fontWeight: 600, marginBottom: 2 }}>{req.unitAddress}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b' }}>
                  {req.contractRef} · {req.contractName}
                </div>
              </div>

              <div style={{ flex: '1 1 150px' }}>
                <div style={{ ...lbl, marginBottom: 3 }}>Requested by</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                  {req.requestedBy}
                </div>
                <div style={{ ...lbl, marginBottom: 3 }}>Scheduled</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: isOverdue ? '#ef4444' : N, fontWeight: isOverdue ? 700 : 400 }}>
                  {req.scheduledDate}
                  {isOverdue && (
                    <span style={{ marginLeft: 6, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#ef4444', fontWeight: 800, background: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: 4 }}>
                      OVERDUE
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flex: '0 0 auto' }}>
                <Badge
                  label={isDone ? '✓ Completed' : badge.label}
                  color={badge.color}
                  bg={badge.bg}
                />
                {req.notes && (
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', maxWidth: 180, textAlign: 'right' }}>
                    &ldquo;{req.notes}&rdquo;
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

// ─── Staff Changes Feed ───────────────────────────────────────────────────────
function StaffChangeFeed() {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
          Notifications
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: N }}>Recent Staff Changes</div>
          <span style={{ background: 'rgba(0,191,166,0.1)', color: T, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}>
            {STAFF_CHANGES.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STAFF_CHANGES.map(change => (
          <div key={change.id} style={{
            background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(0,191,166,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>
              🔄
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T, fontWeight: 700 }}>
                  {change.unitNumber}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>· {change.contractName}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>
                  {change.timeAgo}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{change.unitAddress}</div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                    Departing
                  </div>
                  <div style={{ fontSize: 13, color: N, fontWeight: 600 }}>{change.outgoing}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#ef4444' }}>{change.outgoingDate}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: 16 }}>→</div>
                <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                    Incoming
                  </div>
                  <div style={{ fontSize: 13, color: change.incoming === 'TBD' ? '#94a3b8' : N, fontWeight: 600, fontStyle: change.incoming === 'TBD' ? 'italic' : 'normal' }}>
                    {change.incoming}
                  </div>
                  {change.incomingDate && (
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#22c55e' }}>{change.incomingDate}</div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8' }}>
                Requested by <span style={{ color: '#64748b' }}>{change.requestedBy}</span>
              </div>
            </div>
          </div>
        ))}

        {/* View All link */}
        <div style={{ textAlign: 'center', paddingTop: 4 }}>
          <button style={{
            background: 'none', border: `1px solid ${T}44`, borderRadius: 8,
            color: T, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700,
            padding: '8px 20px', cursor: 'pointer', letterSpacing: '0.05em',
          }}>
            View All Staff Changes →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ERSHousingPreview() {
  const today = 'Jun 8 2026'

  const totalUnits = 34
  const occupied = 29
  const vacant = 5
  const cleaningNeeded = 3

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* ── Sidebar ── */}
      <div style={{
        width: 220, background: N, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        padding: '0 0 24px 0',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: T, fontWeight: 700, letterSpacing: '0.05em' }}>
            ContractFlow
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
            ERS Internal
          </div>
        </div>

        <div style={{ padding: '12px 10px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Dashboard',  active: false },
            { icon: '📋', label: 'Contracts',  active: false },
            { icon: '🏠', label: 'Housing',    active: true  },
            { icon: '🧹', label: 'Cleaning',   active: false },
            { icon: '👥', label: 'Team',       active: false },
            { icon: '📈', label: 'Analytics',  active: false },
          ].map(({ icon, label, active }) => (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(0,191,166,0.12)' : 'transparent',
                color: active ? T : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: 13,
                fontWeight: active ? 600 : 400, transition: 'all 0.1s',
              }}
            >
              <span style={{ fontSize: 15 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>

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
          background: A, color: '#fff', textAlign: 'center',
          padding: '10px 20px', fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
          position: 'sticky', top: 0, zIndex: 200, flexShrink: 0,
        }}>
          ⚠ PREVIEW MODE — No live data · All content is hardcoded mock data for UI review
        </div>

        {/* ── Top Bar ── */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e8ecf0',
          padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8' }}>ERS Internal</div>
          <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Housing Management
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8' }}>
            Today: {today}
          </div>
        </div>

        {/* ── Page Content ── */}
        <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>

          {/* Page title */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
              ERS Internal
            </div>
            <div style={{ fontWeight: 700, fontSize: 26, color: N, letterSpacing: '-0.01em' }}>
              🏠 Housing Management
            </div>
          </div>

          {/* ── Summary stat cards ── */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
            <StatCard label="Total Units" value={totalUnits} accent={N} />
            <StatCard label="Occupied" value={occupied} sub={`${Math.round(occupied / totalUnits * 100)}% occupancy`} accent={T} />
            <StatCard label="Vacant" value={vacant} accent="#6366f1" />
            <StatCard label="Cleaning Needed" value={cleaningNeeded} sub="amber — action required" accent={A} />
          </div>

          {/* ── Units by Contract ── */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
              Units by Contract
            </div>
            {CONTRACT_GROUPS.map(group => (
              <UnitsTable key={group.contractRef} group={group} />
            ))}
          </div>

          {/* ── Bottom two-column: Cleaning Queue + Staff Changes ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: 32,
          }}>
            <CleaningQueue />
            <StaffChangeFeed />
          </div>

        </div>
      </div>
    </div>
  )
}
