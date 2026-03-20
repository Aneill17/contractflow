'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { STAGE_LABELS } from '@/lib/types'

// ERS stage colours
const ERS_STAGE_COLORS: Record<number, string> = {
  0: '#94a3b8',
  1: '#C4793A',
  2: '#C4793A',
  3: '#C4793A',
  4: '#00BFA6',
  5: '#0B2540',
}

interface KpiData {
  totalPortfolioValue: number
  monthlyRecurring: number
  activeContractsCount: number
  totalContractsCount: number
  occupancyRate: number
  stageBreakdown: { stage: number; label: string; count: number; value: number }[]
  unitStatusBreakdown: { vacant: number; occupied: number; maintenance: number; reserved: number; total: number }
  topClients: { client_name: string; units: number; value: number; stage: number }[]
}

const fmt = (n: number) =>
  n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n).toLocaleString()}`

const fmtFull = (n: number) =>
  `$${Math.round(n).toLocaleString('en-CA')}`

export default function KpiPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/kpi', { headers })
      if (!r.ok) throw new Error('Failed to load KPI data')
      const data = await r.json()
      setKpi(data)
    } catch (e: any) {
      setError(e.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const UNIT_STATUS = [
    { key: 'vacant',      label: 'Vacant',      color: '#00BFA6' },
    { key: 'occupied',    label: 'Occupied',     color: '#0B2540' },
    { key: 'maintenance', label: 'Maintenance',  color: '#e74c3c' },
    { key: 'reserved',    label: 'Reserved',     color: '#C4793A' },
  ]

  const maxStageValue = kpi ? Math.max(...kpi.stageBreakdown.map(s => s.value), 1) : 1

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fb',
      color: '#334155',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: 36,
    }}>
      <style>{`
        .kpi-card {
          background: #ffffff;
          border: 1px solid #e8ecf0;
          border-radius: 10px;
          padding: 22px 24px;
          box-shadow: 0 1px 4px rgba(11,37,64,0.05);
        }
        .kpi-lbl {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 6px;
        }
        .kpi-section-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0B2540;
          margin-bottom: 18px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(0,191,166,0.2);
        }
        .kpi-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 9px;
          border-radius: 12px;
          letter-spacing: 0.04em;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
              fontSize: 13, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 0,
              fontWeight: 500,
            }}
          >
            ← Dashboard
          </button>
          <div style={{ color: '#e8ecf0', fontSize: 14 }}>|</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0B2540', letterSpacing: '-0.02em' }}>KPI Overview</div>
        </div>
        <button
          onClick={load}
          style={{
            background: '#00BFA6', border: 'none', borderRadius: 8, padding: '9px 18px',
            color: '#ffffff', fontSize: 12, fontFamily: "'Segoe UI', system-ui, sans-serif",
            cursor: 'pointer', fontWeight: 600,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8', fontSize: 13 }}>Loading KPI data...</div>
      )}
      {error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#e74c3c', fontSize: 13 }}>{error}</div>
      )}

      {kpi && !loading && (
        <>
          {/* Top stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div className="kpi-card" style={{ borderLeft: '3px solid #00BFA6' }}>
              <div className="kpi-lbl">Total Portfolio Value</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#00BFA6', letterSpacing: '-0.02em' }}>{fmt(kpi.totalPortfolioValue)}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{kpi.totalContractsCount} contracts total</div>
            </div>
            <div className="kpi-card" style={{ borderLeft: '3px solid #0B2540' }}>
              <div className="kpi-lbl">Monthly Recurring</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#0B2540', letterSpacing: '-0.02em' }}>{fmt(kpi.monthlyRecurring)}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>from active contracts</div>
            </div>
            <div className="kpi-card" style={{ borderLeft: '3px solid #C4793A' }}>
              <div className="kpi-lbl">Active Contracts</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#C4793A', letterSpacing: '-0.02em' }}>{kpi.activeContractsCount}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>signed or sent</div>
            </div>
            <div className="kpi-card" style={{ borderLeft: `3px solid ${kpi.occupancyRate >= 80 ? '#00BFA6' : kpi.occupancyRate >= 50 ? '#C4793A' : '#e74c3c'}` }}>
              <div className="kpi-lbl">Occupancy Rate</div>
              <div style={{
                fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
                color: kpi.occupancyRate >= 80 ? '#00BFA6' : kpi.occupancyRate >= 50 ? '#C4793A' : '#e74c3c',
              }}>
                {kpi.occupancyRate}%
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{kpi.unitStatusBreakdown.total} units tracked</div>
            </div>
          </div>

          {/* Stage breakdown + Unit status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="kpi-card">
              <div className="kpi-section-title">Pipeline by Stage</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {kpi.stageBreakdown.map(s => {
                  const col = ERS_STAGE_COLORS[s.stage] ?? '#94a3b8'
                  return (
                    <div key={s.stage}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                        <span style={{ color: col, fontWeight: 600 }}>{s.label}</span>
                        <span style={{ color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
                          {s.count} · {fmt(s.value)}
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#f1f4f8', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.round((s.value / maxStageValue) * 100)}%`,
                          background: col,
                          borderRadius: 3,
                          transition: 'width 0.4s ease',
                          minWidth: s.count > 0 ? 4 : 0,
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-section-title">Unit Status</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {UNIT_STATUS.map(({ key, label, color }) => {
                  const count = kpi.unitStatusBreakdown[key as keyof typeof kpi.unitStatusBreakdown] as number
                  const pct = kpi.unitStatusBreakdown.total > 0
                    ? Math.round((count / kpi.unitStatusBreakdown.total) * 100) : 0
                  return (
                    <div key={key} style={{
                      background: '#f8f9fb',
                      border: '1px solid #e8ecf0',
                      borderRadius: 8,
                      padding: '14px 16px',
                      borderLeft: `3px solid ${color}`,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, color }}>{count}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{pct}% of portfolio</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top clients */}
          <div className="kpi-card">
            <div className="kpi-section-title">Top 5 Clients by Value</div>
            {kpi.topClients.length === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8', padding: '12px 0' }}>No contract data yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8ecf0' }}>
                    {['Client', 'Units', 'Value', 'Stage'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '0 0 10px',
                        fontSize: 10, fontWeight: 700, color: '#94a3b8',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kpi.topClients.map((c, i) => {
                    const col = ERS_STAGE_COLORS[c.stage] ?? '#94a3b8'
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                        <td style={{ padding: '11px 0', color: '#0B2540', fontWeight: 600 }}>{c.client_name}</td>
                        <td style={{ padding: '11px 0', color: '#94a3b8' }}>{c.units}</td>
                        <td style={{ padding: '11px 0', color: '#00BFA6', fontWeight: 700 }}>{fmtFull(c.value)}</td>
                        <td style={{ padding: '11px 0' }}>
                          <span className="kpi-badge" style={{
                            background: `${col}18`,
                            border: `1px solid ${col}44`,
                            color: col,
                          }}>
                            {STAGE_LABELS[c.stage] || `Stage ${c.stage}`}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
