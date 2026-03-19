'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/types'

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

  const cardStyle: React.CSSProperties = {
    background: '#13161D',
    border: '1px solid #ffffff0D',
    borderRadius: 10,
    padding: '20px 24px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: '#ffffff33',
    letterSpacing: '0.12em',
    fontFamily: 'IBM Plex Mono, monospace',
    marginBottom: 6,
  }

  const UNIT_STATUS = [
    { key: 'vacant', label: 'Vacant', color: '#4CAF93' },
    { key: 'occupied', label: 'Occupied', color: '#C9A84C' },
    { key: 'maintenance', label: 'Maintenance', color: '#E84855' },
    { key: 'reserved', label: 'Reserved', color: '#4F87A0' },
  ]

  const maxStageValue = kpi ? Math.max(...kpi.stageBreakdown.map(s => s.value), 1) : 1

  return (
    <div style={{ minHeight: '100vh', background: '#0C0E14', color: '#DDD5C8', fontFamily: 'IBM Plex Mono, monospace', padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{ background: 'none', border: 'none', color: '#ffffff44', cursor: 'pointer', fontSize: 13, fontFamily: 'IBM Plex Mono, monospace', padding: 0 }}
          >
            ← Dashboard
          </button>
          <div style={{ color: '#ffffff22', fontSize: 12 }}>|</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#DDD5C8', letterSpacing: '-0.02em' }}>KPI Overview</div>
        </div>
        <button
          onClick={load}
          style={{
            background: '#C9A84C', border: 'none', borderRadius: 6, padding: '8px 16px',
            color: '#0C0E14', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace',
            cursor: 'pointer', fontWeight: 700, letterSpacing: '0.04em',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 80, color: '#ffffff33', fontSize: 12 }}>Loading KPI data...</div>
      )}
      {error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#E84855', fontSize: 12 }}>{error}</div>
      )}

      {kpi && !loading && (
        <>
          {/* Top stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={cardStyle}>
              <div style={labelStyle}>TOTAL PORTFOLIO VALUE</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#C9A84C', letterSpacing: '-0.02em' }}>{fmt(kpi.totalPortfolioValue)}</div>
              <div style={{ fontSize: 10, color: '#ffffff33', marginTop: 4 }}>{kpi.totalContractsCount} contracts total</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>MONTHLY RECURRING</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#4CAF93', letterSpacing: '-0.02em' }}>{fmt(kpi.monthlyRecurring)}</div>
              <div style={{ fontSize: 10, color: '#ffffff33', marginTop: 4 }}>from active contracts</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>ACTIVE CONTRACTS</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#4C7BC9', letterSpacing: '-0.02em' }}>{kpi.activeContractsCount}</div>
              <div style={{ fontSize: 10, color: '#ffffff33', marginTop: 4 }}>signed or sent</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>OCCUPANCY RATE</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: kpi.occupancyRate >= 80 ? '#4CAF93' : kpi.occupancyRate >= 50 ? '#C9A84C' : '#E84855', letterSpacing: '-0.02em' }}>{kpi.occupancyRate}%</div>
              <div style={{ fontSize: 10, color: '#ffffff33', marginTop: 4 }}>{kpi.unitStatusBreakdown.total} units tracked</div>
            </div>
          </div>

          {/* Stage breakdown + Unit status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Stage breakdown */}
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 18, letterSpacing: '0.04em' }}>PIPELINE BY STAGE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {kpi.stageBreakdown.map(s => (
                  <div key={s.stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10 }}>
                      <span style={{ color: STAGE_COLORS[s.stage] || '#888888' }}>{s.label}</span>
                      <span style={{ color: '#ffffff44' }}>{s.count} · {fmt(s.value)}</span>
                    </div>
                    <div style={{ height: 6, background: '#ffffff08', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((s.value / maxStageValue) * 100)}%`,
                        background: STAGE_COLORS[s.stage] || '#888888',
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                        minWidth: s.count > 0 ? 4 : 0,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unit status grid */}
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 18, letterSpacing: '0.04em' }}>UNIT STATUS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {UNIT_STATUS.map(({ key, label, color }) => {
                  const count = kpi.unitStatusBreakdown[key as keyof typeof kpi.unitStatusBreakdown] as number
                  const pct = kpi.unitStatusBreakdown.total > 0
                    ? Math.round((count / kpi.unitStatusBreakdown.total) * 100)
                    : 0
                  return (
                    <div key={key} style={{ background: '#0C0E14', border: '1px solid #ffffff08', borderRadius: 8, padding: '14px 16px' }}>
                      <div style={{ fontSize: 9, color: '#ffffff33', letterSpacing: '0.1em', marginBottom: 8 }}>{label.toUpperCase()}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
                      <div style={{ fontSize: 10, color: '#ffffff33', marginTop: 4 }}>{pct}% of portfolio</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top clients */}
          <div style={cardStyle}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 18, letterSpacing: '0.04em' }}>TOP 5 CLIENTS BY VALUE</div>
            {kpi.topClients.length === 0 ? (
              <div style={{ fontSize: 11, color: '#ffffff33', padding: '12px 0' }}>No contract data yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ffffff0D' }}>
                    {['CLIENT', 'UNITS', 'VALUE', 'STAGE'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0 0 10px', fontSize: 9, color: '#ffffff33', letterSpacing: '0.1em', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kpi.topClients.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #ffffff06' }}>
                      <td style={{ padding: '10px 0', color: '#DDD5C8', fontWeight: 600 }}>{c.client_name}</td>
                      <td style={{ padding: '10px 0', color: '#ffffff66' }}>{c.units}</td>
                      <td style={{ padding: '10px 0', color: '#C9A84C', fontWeight: 600 }}>{fmtFull(c.value)}</td>
                      <td style={{ padding: '10px 0' }}>
                        <span style={{
                          background: (STAGE_COLORS[c.stage] || '#888888') + '22',
                          color: STAGE_COLORS[c.stage] || '#888888',
                          borderRadius: 4, padding: '2px 8px', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                        }}>
                          {STAGE_LABELS[c.stage] || `Stage ${c.stage}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
