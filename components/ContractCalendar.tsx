'use client'

import { useState, useEffect } from 'react'
import { Contract, ContractUnit } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A'
const PURPLE = '#6366f1'
const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DN = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default function ContractCalendar({ contract: c }: { contract: Contract }) {
  const [units, setUnits] = useState<ContractUnit[]>([])
  const start = new Date(c.start_date), end = new Date(c.end_date)
  const [ym, setYm] = useState({ y: start.getFullYear(), m: start.getMonth() })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const h: Record<string, string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      fetch(`/api/contract-units?contract_id=${c.id}`, { headers: h })
        .then(r => r.ok ? r.json() : [])
        .then(setUnits)
    })
  }, [c.id])

  const nav = (d: -1 | 1) => setYm(p => {
    let m = p.m + d, y = p.y
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    return { y, m }
  })

  const jumpToEnd = () => setYm({ y: end.getFullYear(), m: end.getMonth() })

  const { y, m } = ym
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  // Build lease ranges from unit_leases (existing) AND from unit-level lease fields (new)
  const leaseRanges: Array<{ s: Date; e: Date; label: string; color: string; type: string }> = []
  units.forEach(u => {
    // unit_leases from the leases table
    ;(u.unit_leases || []).forEach(l => {
      if (l.lease_start && l.lease_end) {
        leaseRanges.push({
          s: new Date(l.lease_start),
          e: new Date(l.lease_end),
          label: `${u.address || 'Unit'} (${l.lease_type})`,
          color: l.lease_type === 'landlord' ? PURPLE : A,
          type: l.lease_type,
        })
      }
    })
    // unit-level lease fields (landlord lease info from migration 010)
    if (u.lease_start && u.lease_end) {
      leaseRanges.push({
        s: new Date(u.lease_start),
        e: new Date(u.lease_end),
        label: `${u.address || 'Unit'} (landlord)`,
        color: PURPLE,
        type: 'landlord',
      })
    }
  })

  const dayInfo = (day: number) => {
    const d = new Date(y, m, day)
    const isStart = d.toDateString() === start.toDateString()
    const isEnd = d.toDateString() === end.toDateString()
    const inContract = d >= start && d <= end
    const leases = leaseRanges.filter(l => d >= l.s && d <= l.e)
    const isToday = d.toDateString() === new Date().toDateString()
    return { isStart, isEnd, inContract, leases, isToday }
  }

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Build unit lease summaries (combine unit_leases and unit-level fields, deduplicate)
  const unitSummaries: Array<{ address: string; windows: Array<{ start: string; end: string; type: string }> }> = []
  units.forEach(u => {
    const windows: Array<{ start: string; end: string; type: string }> = []
    // unit-level lease
    if (u.lease_start && u.lease_end) {
      windows.push({ start: u.lease_start, end: u.lease_end, type: u.lease_type || 'month-to-month' })
    }
    // unit_leases records
    ;(u.unit_leases || []).forEach(l => {
      if (l.lease_start && l.lease_end) {
        windows.push({ start: l.lease_start, end: l.lease_end, lease_type: l.lease_type })
      }
    })
    if (windows.length > 0) {
      unitSummaries.push({ address: u.address || '(no address)', windows })
    }
  })

  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: 22 }}>
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: N, fontSize: 15 }}>{MN[m]} {y}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => nav(-1)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', cursor: 'pointer', color: N }}>‹</button>
          <button
            onClick={() => setYm({ y: start.getFullYear(), m: start.getMonth() })}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'IBM Plex Mono', color: T }}
          >
            Contract Start
          </button>
          <button
            onClick={jumpToEnd}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'IBM Plex Mono', color: A }}
          >
            Jump to End
          </button>
          <button onClick={() => nav(1)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#fff', cursor: 'pointer', color: N }}>›</button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {DN.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontFamily: 'IBM Plex Mono', color: '#94a3b8', padding: '4px 0' }}>{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const { isStart, isEnd, inContract, leases, isToday } = dayInfo(day)
          const isEdge = isStart || isEnd
          const landlordLease = leases.find(l => l.lease_type === 'landlord')
          const clientLease = leases.find(l => l.lease_type === 'client')
          return (
            <div
              key={i}
              title={isStart ? `Start: ${c.start_date}` : isEnd ? `End: ${c.end_date}` : leases[0]?.label}
              style={{
                aspectRatio: '1',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: isEdge ? 800 : isToday ? 700 : 400,
                position: 'relative',
                cursor: leases.length || isEdge ? 'help' : 'default',
                background: isEdge ? T : leases.length ? leases[0].color + '33' : inContract ? `${T}18` : '#f8f9fb',
                color: isEdge ? '#fff' : inContract ? '#0B6654' : '#374151',
                border: isToday ? `2px solid ${T}` : '1px solid transparent',
              }}
            >
              {day}
              {/* Lease dots */}
              {!isEdge && (landlordLease || clientLease) && (
                <div style={{ position: 'absolute', bottom: 2, right: 2, display: 'flex', gap: 1 }}>
                  {landlordLease && <div style={{ width: 4, height: 4, borderRadius: '50%', background: PURPLE }} />}
                  {clientLease && <div style={{ width: 4, height: 4, borderRadius: '50%', background: A }} />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Color legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        {[
          { color: `${T}33`, border: `1px solid ${T}55`, label: 'Contract period' },
          { color: T, border: 'none', label: 'Start / End' },
          { color: `${PURPLE}66`, border: 'none', label: 'Landlord lease' },
          { color: `${A}66`, border: 'none', label: 'Client lease' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: l.border }} />
            <span style={{ fontFamily: 'IBM Plex Mono' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Key dates */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        {[{ label: 'Start', val: c.start_date, color: T }, { label: 'End', val: c.end_date, color: A }].map(({ label, val, color }) => (
          <div key={label} style={{ padding: '8px 14px', background: `${color}10`, borderRadius: 8, fontSize: 12 }}>
            <span style={{ color, fontWeight: 600 }}>{label}:</span>{' '}
            <span style={{ color: N }}>{fmtDate(val)}</span>
          </div>
        ))}
        {units.length > 0 && (
          <div style={{ padding: '8px 14px', background: `${A}10`, borderRadius: 8, fontSize: 12 }}>
            <span style={{ color: A, fontWeight: 600 }}>Units:</span>{' '}
            <span style={{ color: N }}>{units.length} tracked</span>
          </div>
        )}
      </div>

      {/* Unit lease summary */}
      {unitSummaries.length > 0 && (
        <div style={{ marginTop: 18, borderTop: '1px solid #e8ecf0', paddingTop: 16 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Unit Lease Windows
          </div>
          {unitSummaries.map((u, ui) => (
            <div key={ui} style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: N, fontWeight: 600, marginBottom: 4 }}>
                🏠 {u.address}
              </div>
              {u.windows.map((w, wi) => (
                <div key={wi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, paddingLeft: 12 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: w.lease_type === 'landlord' ? PURPLE : w.lease_type === 'client' ? A : T,
                  }} />
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#334155' }}>
                    {fmtDate(w.start)} → {fmtDate(w.end)}
                  </span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>
                    {w.lease_type}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
