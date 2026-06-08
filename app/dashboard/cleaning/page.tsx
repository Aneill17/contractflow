'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A'

interface CleaningRequest {
  id: string
  unit_id: string
  contract_id: string
  requested_by_email: string
  requested_at: string
  scheduled_date: string | null
  status: 'pending' | 'assigned' | 'completed'
  notes: string | null
  completed_at: string | null
  completed_by: string | null
  // joined
  unit_address?: string
  contract_reference?: string
  contract_location?: string
}

const STATUS_COLORS = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending' },
  assigned: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'Assigned' },
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Completed' },
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const lbl: React.CSSProperties = {
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#94a3b8',
  marginBottom: 4,
}

export default function CleaningPage() {
  const [requests, setRequests] = useState<CleaningRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'completed'>('pending')
  const [marking, setMarking] = useState('')

  const load = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const h: Record<string, string> = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}

    const res = await fetch('/api/cleaning-requests', { headers: h })
    if (res.ok) {
      const data = await res.json()
      setRequests(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const markComplete = async (req: CleaningRequest) => {
    setMarking(req.id)
    const { data: { session } } = await supabase.auth.getSession()
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }
    const res = await fetch(`/api/cleaning-requests/${req.id}/complete`, { method: 'POST', headers: h })
    if (res.ok) load()
    else alert('Failed to mark complete')
    setMarking('')
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)
  const pending = requests.filter(r => r.status === 'pending').length
  const assigned = requests.filter(r => r.status === 'assigned').length

  return (
    <div style={{ padding: '32px 36px', background: '#f8f9fb', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T, letterSpacing: '0.1em', marginBottom: 6 }}>
          OPERATIONS
        </div>
        <div style={{ fontWeight: 700, fontSize: 26, color: N, letterSpacing: '-0.01em' }}>Cleaning Queue</div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          {pending} pending · {assigned} assigned
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['pending', 'assigned', 'all', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: filter === f ? T : '#e2e8f0',
              background: filter === f ? 'rgba(0,191,166,0.1)' : '#fff',
              color: filter === f ? T : '#64748b',
              cursor: 'pointer',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11,
              fontWeight: filter === f ? 700 : 400,
              textTransform: 'capitalize',
            }}
          >
            {f}
            {f === 'pending' && pending > 0 && (
              <span style={{ marginLeft: 6, background: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: 8, fontSize: 10 }}>{pending}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8' }}>
            {filter === 'pending' ? 'No pending cleaning requests.' : `No ${filter} requests.`}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1.5fr 1.2fr 1.5fr 1.5fr 1.2fr',
            padding: '10px 20px',
            background: '#f8f9fb',
            borderBottom: '1px solid #e8ecf0',
          }}>
            {['Unit', 'Contract', 'Requested By', 'Date Needed', 'Status', 'Notes', 'Action'].map(h => (
              <div key={h} style={lbl}>{h}</div>
            ))}
          </div>

          {filtered.map((req, i) => {
            const badge = STATUS_COLORS[req.status]
            const isOverdue = req.scheduled_date && req.status !== 'completed' && new Date(req.scheduled_date) < new Date()
            return (
              <div
                key={req.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1.5fr 1.2fr 1.5fr 1.5fr 1.2fr',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #f1f4f8' : 'none',
                  background: isOverdue ? 'rgba(239,68,68,0.03)' : 'transparent',
                }}
              >
                <div style={{ fontSize: 13, color: N, fontWeight: 500, paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {req.unit_address || req.unit_id.slice(0, 8)}
                </div>
                <div style={{ paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T }}>{req.contract_reference || '—'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{req.contract_location}</div>
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b', paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {req.requested_by_email}
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: isOverdue ? '#ef4444' : '#334155', fontWeight: isOverdue ? 600 : 400 }}>
                  {fmt(req.scheduled_date)}
                  {isOverdue && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 2 }}>OVERDUE</div>}
                </div>
                <div>
                  <span style={{
                    fontSize: 10,
                    fontFamily: 'IBM Plex Mono, monospace',
                    padding: '3px 8px',
                    borderRadius: 10,
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.color}44`,
                  }}>
                    {badge.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {req.notes || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}
                </div>
                <div>
                  {req.status !== 'completed' && (
                    <button
                      onClick={() => markComplete(req)}
                      disabled={marking === req.id}
                      style={{
                        background: T,
                        color: '#fff',
                        border: 'none',
                        padding: '5px 12px',
                        borderRadius: 6,
                        cursor: marking === req.id ? 'not-allowed' : 'pointer',
                        fontFamily: 'IBM Plex Mono, monospace',
                        fontSize: 10,
                        opacity: marking === req.id ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {marking === req.id ? '…' : 'Mark Clean ✓'}
                    </button>
                  )}
                  {req.status === 'completed' && (
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#22c55e' }}>
                      ✓ {fmt(req.completed_at)}
                      {req.completed_by && <div style={{ color: '#94a3b8', marginTop: 2 }}>{req.completed_by}</div>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
