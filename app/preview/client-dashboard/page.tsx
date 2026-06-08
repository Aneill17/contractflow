'use client'

// ── Preview: Client Analytics Dashboard ───────────────────────
// Standalone demo with hardcoded mock data — no auth, no API calls
// Maxwell Floors · 21 units · $189/night hotel comparable

const N = '#0B2540'
const T = '#00BFA6'
const T2 = '#009793'
const AM = '#F59E0B'
const RD = '#ef4444'

const MOCK_COMPANY = 'Maxwell Floors'
const MOCK_EMAIL = 'operations@maxwellfloors.com'
const MOCK_HOTEL_RATE = 189
const MOCK_UNITS = 21
const MOCK_RATE_PER_UNIT = 3150  // $3,150/mo per unit
const MOCK_OCCUPIED = 18

// ── Mock Contracts ────────────────────────────────────────────
const MOCK_CONTRACTS = [
  {
    id: 'mock-1',
    reference: 'CF-2024-0142',
    location: 'Fort McMurray — Clearwater Suites',
    start_date: '2024-11-01',
    end_date: '2026-09-01',
    stage: 5,
    units: 21,
    price_per_unit: MOCK_RATE_PER_UNIT,
    hotel_comparable_rate: MOCK_HOTEL_RATE,
    units_data: Array.from({ length: 21 }, (_, i) => ({
      id: `unit-${i}`,
      address: `Unit ${i + 1}`,
      cleanliness: i < 18 ? 'clean' : 'dirty',
      occupancy_status: i < 18 ? 'occupied' : 'vacant',
      status: 'active',
    })),
    occupants: Array.from({ length: 18 }, (_, i) => ({
      id: `occ-${i}`,
      name: `Staff Member ${i + 1}`,
      status: i === 17 ? 'departing' : 'active',
      departure_date: i === 17 ? '2026-07-01' : undefined,
    })),
  },
]

// ── Monthly data (Nov 2024 → Jun 2026) ───────────────────────
const MONTHLY_DATA = (() => {
  const rows = []
  const start = new Date(2024, 10, 1)
  const end = new Date(2026, 5, 30)
  const unitVariations = [21, 20, 21, 20, 19, 21, 18, 20, 21, 21, 20, 19, 18, 20, 21, 19, 18, 20, 21]
  let i = 0
  let d = new Date(start)
  while (d <= end && i < unitVariations.length) {
    const units = unitVariations[i]
    const ersCost = units * MOCK_RATE_PER_UNIT
    const hotelCost = units * MOCK_HOTEL_RATE * 30
    rows.push({
      month: d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short' }),
      units,
      ersCost,
      hotelCost,
      savings: hotelCost - ersCost,
    })
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    i++
  }
  return rows
})()

const TOTAL_ERS = MONTHLY_DATA.reduce((s, r) => s + r.ersCost, 0)
const TOTAL_HOTEL = MONTHLY_DATA.reduce((s, r) => s + r.hotelCost, 0)
const TOTAL_SAVINGS = TOTAL_HOTEL - TOTAL_ERS

const MONTHLY_ERS = MOCK_UNITS * MOCK_RATE_PER_UNIT
const MONTHLY_HOTEL = MOCK_UNITS * MOCK_HOTEL_RATE * 30
const MONTHLY_SAVINGS = MONTHLY_HOTEL - MONTHLY_ERS
const SAVINGS_PCT = Math.round((MONTHLY_SAVINGS / MONTHLY_HOTEL) * 100)

function daysUntil(d: string) {
  return Math.max(0, Math.round((new Date(d).getTime() - Date.now()) / 86400000))
}

function progressPct(start: string, end: string) {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const n = Date.now()
  if (n <= s) return 0
  if (n >= e) return 100
  return Math.round(((n - s) / (e - s)) * 100)
}

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

// ── Component ─────────────────────────────────────────────────
export default function ClientDashboardPreview() {
  const c = MOCK_CONTRACTS[0]
  const daysLeft = daysUntil(c.end_date)
  const contractPct = progressPct(c.start_date, c.end_date)
  const occupancyPct = Math.round((MOCK_OCCUPIED / MOCK_UNITS) * 100)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Nunito Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=Nunito+Sans:wght@400;600;700&display=swap');

        .ers-preview * { box-sizing: border-box; }

        .ers-card {
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid rgba(11,37,64,0.06);
        }

        .ers-stat-card {
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid rgba(11,37,64,0.06);
          padding: 22px 24px;
        }

        .ers-progress-track {
          height: 6px;
          background: rgba(11,37,64,0.08);
          border-radius: 99px;
          overflow: hidden;
        }
        .ers-progress-fill {
          height: 100%;
          border-radius: 99px;
        }

        .ers-unit-tile {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          display: inline-block;
          margin: 2px;
        }

        .ers-quick-action {
          background: #ffffff;
          border-radius: 14px;
          padding: 22px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid rgba(11,37,64,0.06);
          cursor: pointer;
          text-decoration: none;
          display: block;
          text-align: center;
        }

        .ers-table-row:hover { background: rgba(0,191,166,0.04); }
        .ers-table-row:last-child td { border-bottom: none !important; }

        @media (max-width: 768px) {
          .ers-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ers-hero-nums { flex-direction: column !important; gap: 12px !important; }
          .ers-actions-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div className="ers-preview">

        {/* ── PREVIEW MODE BANNER ──────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `2px solid ${AM}`,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: AM }}>⚡ PREVIEW MODE</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            This is a standalone demo with hardcoded mock data — Maxwell Floors · 21 units · $189/night hotel comparable
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
            /preview/client-dashboard
          </div>
        </div>

        {/* ── Header / Nav ─────────────────────────────────────── */}
        <nav style={{
          background: N,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          gap: 4,
          boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
        }}>
          <div style={{ marginRight: 24, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#ffffff', letterSpacing: '0.01em', lineHeight: 1 }}>
              ELIAS RANGE STAYS
            </div>
            <div style={{ fontSize: 9, color: T, letterSpacing: '0.12em', fontWeight: 600 }}>
              Healthy Living · Stronger Communities
            </div>
          </div>

          {['Overview', 'Contracts', 'Team'].map(label => (
            <div key={label} style={{
              padding: '7px 16px',
              borderRadius: 8,
              color: label === 'Overview' ? T : 'rgba(255,255,255,0.55)',
              fontWeight: label === 'Overview' ? 700 : 500,
              fontSize: 13,
              background: label === 'Overview' ? 'rgba(0,191,166,0.12)' : 'transparent',
              fontFamily: "'Nunito Sans', sans-serif",
              cursor: 'default',
            }}>{label}</div>
          ))}

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg, ${T} 0%, #006b6b 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>MF</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{MOCK_COMPANY}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{MOCK_EMAIL}</div>
            </div>
          </div>
          <div style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.45)',
            padding: '7px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "'Nunito Sans', sans-serif",
            fontWeight: 600,
          }}>Logout</div>
        </nav>

        {/* ── Page content ─────────────────────────────────────── */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px 64px' }}>

          {/* Welcome line */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: N, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Welcome back, {MOCK_COMPANY}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
              {new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* ══ HERO SAVINGS BANNER ═════════════════════════════ */}
          <div style={{
            background: 'linear-gradient(135deg, #00304A 0%, #009793 100%)',
            borderRadius: 20,
            padding: '36px 40px',
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,48,74,0.28)',
          }}>
            <div style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 80, bottom: -80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,191,166,0.08)', pointerEvents: 'none' }} />

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 8, letterSpacing: '0.04em', fontWeight: 600 }}>
              💰 TOTAL SAVINGS WITH ERS
            </div>

            <div className="ers-hero-nums" style={{ display: 'flex', gap: 48, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 52, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  ${MONTHLY_SAVINGS.toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>saved this month</div>
              </div>
              <div style={{ width: 1, height: 64, background: 'rgba(255,255,255,0.12)', alignSelf: 'center', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 52, color: T, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  ${TOTAL_SAVINGS.toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>saved to date</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', alignSelf: 'center' }}>
                <div style={{ fontSize: 38, fontWeight: 800, color: T, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
                  {SAVINGS_PCT}%
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>below market rate</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                vs. hotel avg of <strong style={{ color: 'rgba(255,255,255,0.75)' }}>${MOCK_HOTEL_RATE}/night</strong>
              </div>
              <div style={{ fontSize: 13, color: T, fontWeight: 600, fontStyle: 'italic' }}>
                "That's {SAVINGS_PCT}% below market rate — money back into your project."
              </div>
            </div>
          </div>

          {/* ══ STATS ROW ════════════════════════════════════════ */}
          <div className="ers-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>

            <div className="ers-stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Units</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: N, lineHeight: 1, marginBottom: 4 }}>{MOCK_UNITS}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>{MOCK_OCCUPIED}/{MOCK_UNITS} occupied</div>
              <div className="ers-progress-track">
                <div className="ers-progress-fill" style={{ width: `${occupancyPct}%`, background: T }} />
              </div>
              <div style={{ fontSize: 11, color: T, marginTop: 6, fontWeight: 700 }}>{occupancyPct}% occupied</div>
            </div>

            <div className="ers-stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Monthly Spend</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: N, lineHeight: 1, marginBottom: 4 }}>
                ${MONTHLY_ERS.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>with ERS</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                vs. <span style={{ color: RD, fontWeight: 600, textDecoration: 'line-through' }}>${MONTHLY_HOTEL.toLocaleString()}</span> at hotel rates
              </div>
            </div>

            <div className="ers-stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Contract Status</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,191,166,0.1)', borderRadius: 20, padding: '4px 12px', marginBottom: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: T, display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T }}>Active</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Ends Sep 1, 2026</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: N }}>
                {daysLeft} <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>days left</span>
              </div>
            </div>

            <div className="ers-stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Staff Housed</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: N, lineHeight: 1, marginBottom: 4 }}>21</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>people housed</div>
              <div style={{ fontSize: 11, color: AM, fontWeight: 600 }}>⚠ 1 departure upcoming (Jul 1)</div>
            </div>
          </div>

          {/* ══ CONTRACT CARD ════════════════════════════════════ */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: N }}>Your Contracts</div>
            </div>
            <div style={{
              background: '#ffffff',
              borderRadius: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid rgba(11,37,64,0.06)',
              padding: '22px 26px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: N, marginBottom: 3 }}>
                    Fort McMurray — Clearwater Suites
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8' }}>CF-2024-0142</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{fmt(c.start_date)} → {fmt(c.end_date)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{daysLeft} days remaining</div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="ers-progress-track">
                  <div className="ers-progress-fill" style={{ width: `${contractPct}%`, background: `linear-gradient(90deg, ${N} 0%, ${T} 100%)` }} />
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{contractPct}% through contract</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>Units</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: N, fontFamily: 'Syne, sans-serif' }}>{MOCK_OCCUPIED}/{MOCK_UNITS}</div>
                  <div className="ers-progress-track" style={{ marginTop: 6 }}>
                    <div className="ers-progress-fill" style={{ width: `${occupancyPct}%`, background: T }} />
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>ERS Rate</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: N, fontFamily: 'Syne, sans-serif' }}>${MOCK_RATE_PER_UNIT.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>per unit/mo</div>
                </div>
                <div style={{ background: 'rgba(0,191,166,0.06)', borderRadius: 10, padding: '10px 12px', border: `1px solid rgba(0,191,166,0.15)` }}>
                  <div style={{ fontSize: 10, color: T2, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>Monthly Savings</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T, fontFamily: 'Syne, sans-serif' }}>+${MONTHLY_SAVINGS.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: T2, marginTop: 2 }}>vs. hotel rates</div>
                </div>
              </div>
            </div>
          </div>

          {/* ══ OCCUPANCY GRID ═══════════════════════════════════ */}
          <div className="ers-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: N, marginBottom: 6 }}>Occupancy Dashboard</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
              {MOCK_OCCUPIED} of {MOCK_UNITS} units occupied ({occupancyPct}%)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 16 }}>
              {Array.from({ length: MOCK_UNITS }).map((_, i) => {
                let color: string
                if (i < 17) color = T           // occupied
                else if (i === 17) color = AM    // departing soon
                else color = '#e2e8f0'           // vacant
                return (
                  <div
                    key={i}
                    className="ers-unit-tile"
                    title={`Unit ${i + 1}`}
                    style={{
                      background: color,
                      border: color === '#e2e8f0' ? '1px solid #cbd5e1' : 'none',
                    }}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { color: T, label: 'Occupied' },
                { color: '#e2e8f0', label: 'Vacant', border: '#cbd5e1' },
                { color: AM, label: 'Departing Soon' },
                { color: RD, label: 'Dirty / Needs Cleaning' },
              ].map(({ color, label, border }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 3,
                    background: color,
                    border: border ? `1px solid ${border}` : 'none',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══ FINANCIAL BREAKDOWN ══════════════════════════════ */}
          <div className="ers-card" style={{ padding: '24px 28px', marginBottom: 24, overflowX: 'auto' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: N, marginBottom: 20 }}>Financial Breakdown</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T}22` }}>
                  {['Month', 'Units', 'ERS Cost', 'Hotel Cost', 'Savings'].map(h => (
                    <th key={h} style={{
                      textAlign: h === 'Month' || h === 'Units' ? 'left' : 'right',
                      padding: '8px 12px',
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#94a3b8',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHLY_DATA.map((row, i) => (
                  <tr key={i} className="ers-table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 12px', color: '#334155', fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{row.month}</td>
                    <td style={{ padding: '9px 12px', color: '#334155' }}>{row.units}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: N, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>${row.ersCost.toLocaleString()}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, textDecoration: 'line-through' }}>${row.hotelCost.toLocaleString()}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: T, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>+${row.savings.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ background: `${N}06`, borderTop: `2px solid ${N}18` }}>
                  <td style={{ padding: '11px 12px', fontWeight: 800, color: N, fontFamily: 'Syne, sans-serif', fontSize: 13 }}>Total</td>
                  <td style={{ padding: '11px 12px', color: '#334155', fontWeight: 600 }}>—</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 800, color: N, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>${TOTAL_ERS.toLocaleString()}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, textDecoration: 'line-through' }}>${TOTAL_HOTEL.toLocaleString()}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 800, color: T, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>+${TOTAL_SAVINGS.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ══ QUICK ACTIONS ════════════════════════════════════ */}
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: N, marginBottom: 14 }}>Quick Actions</div>
            <div className="ers-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { icon: '🔄', label: 'Swap Staff Member', sub: 'Update who\'s in a unit' },
                { icon: '📅', label: 'Request Extension', sub: 'Extend your contract dates' },
                { icon: '🧹', label: 'Request Cleaning', sub: 'Schedule a unit clean' },
                { icon: '👥', label: 'Manage Team Access', sub: 'Add or remove portal users' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="ers-quick-action">
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: N, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
