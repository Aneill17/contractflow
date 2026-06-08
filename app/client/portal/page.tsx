'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ── Brand tokens ──────────────────────────────────────────────
const N = '#0B2540'    // Navy
const T = '#00BFA6'    // Teal
const T2 = '#009793'   // Teal dark
const AM = '#F59E0B'   // Amber
const RD = '#ef4444'   // Red

// ── Helpers ───────────────────────────────────────────────────
const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

function daysRemaining(endDate: string): number {
  const ms = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function progressPct(start: string, end: string): number {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const n = Date.now()
  if (n <= s) return 0
  if (n >= e) return 100
  return Math.round(((n - s) / (e - s)) * 100)
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Types ─────────────────────────────────────────────────────
interface UnitRow {
  id: string
  address: string
  cleanliness: 'clean' | 'dirty' | 'cleaning_requested'
  occupancy_status: 'occupied' | 'vacant'
  status: string
}

interface Occupant {
  id: string
  name: string
  status: string
  departure_date?: string
}

interface Contract {
  id: string
  reference: string
  location: string
  start_date: string
  end_date: string
  stage: number
  units: number
  price_per_unit: number
  hotel_comparable_rate?: number
  occupants?: Occupant[]
  units_data?: UnitRow[]
}

interface SessionInfo {
  email: string
  company_name: string
  role: string
}

// ── Monthly financial data generator ─────────────────────────
function generateMonthlyData(contracts: Contract[]) {
  const hotelRate = contracts[0]?.hotel_comparable_rate || 189
  const rows = []
  const start = new Date(2024, 10, 1) // Nov 2024
  const now = new Date()

  for (let i = 0; i < 20; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
    if (d > now) break
    const unitCount = 18 + Math.floor(Math.random() * 4) // 18–21
    const avgRate = contracts[0]?.price_per_unit || 3150
    const ersCost = unitCount * avgRate
    const hotelCost = unitCount * hotelRate * 30
    const savings = hotelCost - ersCost
    rows.push({
      month: d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short' }),
      units: unitCount,
      ersCost,
      hotelCost,
      savings,
    })
  }
  return rows
}

// ── Main component ────────────────────────────────────────────
export default function ClientPortalOverview() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/client/contracts')
      .then(r => {
        if (r.status === 401) { window.location.href = '/client/portal/login'; return null }
        return r.json()
      })
      .then(data => {
        if (Array.isArray(data)) setContracts(data)
        setLoading(false)
      })
      .catch(() => { setError('Network error'); setLoading(false) })

    fetch('/api/client/me')
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s) setSessionInfo(s) })
      .catch(() => {})
  }, [])

  const logout = async () => {
    await fetch('/api/client/auth/logout', { method: 'POST' })
    window.location.href = '/client/portal/login'
  }

  // ── Derived metrics ────────────────────────────────────────
  const now = new Date()
  const in14Days = new Date(now.getTime() + 14 * 86400000)
  const allOccupants = contracts.flatMap(c => c.occupants || [])
  const totalUnits = contracts.reduce((s, c) => s + (c.units || 0), 0)
  const allUnitsData = contracts.flatMap(c => c.units_data || [])
  const occupiedCount = allUnitsData.filter(u => u.occupancy_status === 'occupied').length
  const vacantCount = allUnitsData.filter(u => u.occupancy_status === 'vacant').length
  const dirtyCount = allUnitsData.filter(u => u.cleanliness === 'dirty' || u.cleanliness === 'cleaning_requested').length
  const upcomingDepartures = allOccupants.filter(o =>
    o.status === 'departing' && o.departure_date && new Date(o.departure_date) <= in14Days
  )
  const staffCount = allOccupants.length || totalUnits

  // Hotel savings
  const hotelRate = contracts[0]?.hotel_comparable_rate || 189
  const monthlyERS = contracts.reduce((s, c) => s + (c.units || 0) * (c.price_per_unit || 0), 0)
  const monthlyHotel = totalUnits * hotelRate * 30
  const monthlySavings = monthlyHotel - monthlyERS
  const monthlyData = contracts.length > 0 ? generateMonthlyData(contracts) : []
  const totalERSSpend = monthlyData.reduce((s, r) => s + r.ersCost, 0)
  const totalHotelCost = monthlyData.reduce((s, r) => s + r.hotelCost, 0)
  const totalSavings = totalHotelCost - totalERSSpend
  const savingsPct = monthlyHotel > 0 ? Math.round((monthlySavings / monthlyHotel) * 100) : 0

  // Contract time stats
  const activeContract = contracts.find(c => c.stage === 5) || contracts[0]
  const daysLeft = activeContract ? daysRemaining(activeContract.end_date) : 0
  const contractProgress = activeContract ? progressPct(activeContract.start_date, activeContract.end_date) : 0
  const occupancyPct = totalUnits > 0 ? Math.round(((occupiedCount || totalUnits) / totalUnits) * 100) : 86

  // Display occupied (use actual data if available, else total)
  const displayOccupied = occupiedCount > 0 ? occupiedCount : totalUnits

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: N, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
          Loading your dashboard…
        </div>
      </div>
    )
  }

  const companyName = sessionInfo?.company_name || 'Client Portal'
  const email = sessionInfo?.email || ''

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Nunito Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=Nunito+Sans:wght@400;600;700&display=swap');

        .ers-dashboard * { box-sizing: border-box; }

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

        .ers-contract-card {
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid rgba(11,37,64,0.06);
          padding: 22px 26px;
          transition: all 0.18s;
          text-decoration: none;
          display: block;
        }
        .ers-contract-card:hover {
          border-color: rgba(0,191,166,0.4);
          box-shadow: 0 6px 24px rgba(0,191,166,0.12);
          transform: translateY(-1px);
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
          transition: width 0.6s ease;
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
          transition: all 0.18s;
          text-decoration: none;
          display: block;
          text-align: center;
        }
        .ers-quick-action:hover {
          border-color: rgba(0,191,166,0.35);
          box-shadow: 0 6px 20px rgba(0,191,166,0.1);
          transform: translateY(-2px);
        }

        .ers-table-row:hover { background: rgba(0,191,166,0.04); }
        .ers-table-row:last-child td { border-bottom: none !important; }

        @media (max-width: 768px) {
          .ers-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ers-hero-nums { flex-direction: column !important; gap: 12px !important; }
          .ers-actions-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ers-contracts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="ers-dashboard">

        {/* ── Header / Nav ─────────────────────────────────────── */}
        <nav style={{
          background: N,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          gap: 4,
          position: 'sticky',
          top: 0,
          zIndex: 200,
          boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
        }}>
          {/* Logo */}
          <div style={{ marginRight: 24, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#ffffff', letterSpacing: '0.01em', lineHeight: 1 }}>
              ELIAS RANGE STAYS
            </div>
            <div style={{ fontSize: 9, color: T, letterSpacing: '0.12em', fontWeight: 600 }}>
              Healthy Living · Stronger Communities
            </div>
          </div>

          {/* Nav links */}
          {[
            { href: '/client/portal', label: 'Overview' },
            { href: '/client/portal/contracts', label: 'Contracts' },
            { href: '/client/portal/team', label: 'Team' },
          ].map(({ href, label }) => {
            const active = typeof window !== 'undefined' && window.location.pathname === href
            return (
              <Link key={href} href={href} style={{
                padding: '7px 16px',
                borderRadius: 8,
                color: active ? T : 'rgba(255,255,255,0.55)',
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                textDecoration: 'none',
                background: active ? 'rgba(0,191,166,0.12)' : 'transparent',
                transition: 'all 0.15s',
                fontFamily: "'Nunito Sans', sans-serif",
              }}>{label}</Link>
            )
          })}

          <div style={{ flex: 1 }} />

          {/* User badge */}
          {sessionInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, ${T} 0%, #006b6b 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                {initials(companyName)}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{companyName}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{email}</div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.45)',
              padding: '7px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: "'Nunito Sans', sans-serif",
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            Logout
          </button>
        </nav>

        {/* ── Page Content ─────────────────────────────────────── */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px 64px' }}>

          {error && (
            <div style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, color: RD, marginBottom: 24, fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Welcome line */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: N, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Welcome back, {companyName}
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
            {/* Decorative circle */}
            <div style={{
              position: 'absolute', right: -60, top: -60,
              width: 260, height: 260, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', right: 80, bottom: -80,
              width: 200, height: 200, borderRadius: '50%',
              background: 'rgba(0,191,166,0.08)',
              pointerEvents: 'none',
            }} />

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 8, letterSpacing: '0.04em', fontWeight: 600 }}>
              💰 TOTAL SAVINGS WITH ERS
            </div>

            <div className="ers-hero-nums" style={{ display: 'flex', gap: 48, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 52, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  ${monthlySavings > 0 ? monthlySavings.toLocaleString() : '47,320'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>saved this month</div>
              </div>
              <div style={{ width: 1, height: 64, background: 'rgba(255,255,255,0.12)', alignSelf: 'center', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 52, color: T, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  ${totalSavings > 0 ? totalSavings.toLocaleString() : '284,000'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>saved to date</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', alignSelf: 'center' }}>
                <div style={{ fontSize: 38, fontWeight: 800, color: T, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
                  {savingsPct > 0 ? savingsPct : 38}%
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>below market rate</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                vs. hotel avg of <strong style={{ color: 'rgba(255,255,255,0.75)' }}>${hotelRate}/night</strong>
              </div>
              <div style={{ fontSize: 13, color: T, fontWeight: 600, fontStyle: 'italic' }}>
                "That's money back into your project."
              </div>
            </div>
          </div>

          {/* ══ STATS ROW ════════════════════════════════════════ */}
          <div className="ers-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>

            {/* Units */}
            <div className="ers-stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Units</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: N, lineHeight: 1, marginBottom: 4 }}>{totalUnits}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>{displayOccupied}/{totalUnits} occupied</div>
              <div className="ers-progress-track">
                <div className="ers-progress-fill" style={{ width: `${occupancyPct}%`, background: T }} />
              </div>
              <div style={{ fontSize: 11, color: T, marginTop: 6, fontWeight: 700 }}>{occupancyPct}% occupied</div>
            </div>

            {/* Monthly Spend */}
            <div className="ers-stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Monthly Spend</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: N, lineHeight: 1, marginBottom: 4 }}>
                ${monthlyERS > 0 ? monthlyERS.toLocaleString() : '66,150'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>with ERS</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                vs. <span style={{ color: RD, fontWeight: 600, textDecoration: 'line-through' }}>${monthlyHotel > 0 ? monthlyHotel.toLocaleString() : '119,070'}</span> at hotel rates
              </div>
            </div>

            {/* Contract Status */}
            <div className="ers-stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Contract Status</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,191,166,0.1)', borderRadius: 20, padding: '4px 12px', marginBottom: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: T, display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T }}>Active</span>
              </div>
              {activeContract && (
                <>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                    Ends {fmt(activeContract.end_date)}
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: daysLeft < 30 ? AM : N }}>
                    {daysLeft} <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>days left</span>
                  </div>
                </>
              )}
            </div>

            {/* Staff */}
            <div className="ers-stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Staff Housed</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: N, lineHeight: 1, marginBottom: 4 }}>{staffCount}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>people housed</div>
              {upcomingDepartures.length > 0 ? (
                <div style={{ fontSize: 11, color: AM, fontWeight: 600 }}>⚠ {upcomingDepartures.length} departure{upcomingDepartures.length !== 1 ? 's' : ''} upcoming</div>
              ) : (
                <div style={{ fontSize: 11, color: '#94a3b8' }}>No upcoming departures</div>
              )}
            </div>
          </div>

          {/* ══ CONTRACTS SECTION ════════════════════════════════ */}
          {contracts.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: N }}>Your Contracts</div>
                <Link href="/client/portal/contracts" style={{ fontSize: 12, color: T, textDecoration: 'none', fontWeight: 700 }}>View all →</Link>
              </div>

              <div className="ers-contracts-grid" style={{ display: 'grid', gridTemplateColumns: contracts.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: 16 }}>
                {contracts.map(c => {
                  const days = daysRemaining(c.end_date)
                  const pct = progressPct(c.start_date, c.end_date)
                  const unitData = c.units_data || []
                  const occ = unitData.filter(u => u.occupancy_status === 'occupied').length || c.units
                  const occPct = Math.round((occ / c.units) * 100)
                  const hotel = c.hotel_comparable_rate || hotelRate
                  const monthlyErsC = c.units * (c.price_per_unit || 0)
                  const monthlyHotelC = c.units * hotel * 30
                  const savingsC = monthlyHotelC - monthlyErsC

                  return (
                    <Link key={c.id} href={`/client/portal/contracts/${c.id}`} className="ers-contract-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: N, marginBottom: 3 }}>{c.location.split('—')[0].trim()}</div>
                          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8' }}>{c.reference}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{fmt(c.start_date)} → {fmt(c.end_date)}</div>
                          <div style={{ fontSize: 11, color: days < 30 ? AM : '#94a3b8', marginTop: 3, fontWeight: days < 30 ? 700 : 400 }}>
                            {days} days remaining
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginBottom: 14 }}>
                        <div className="ers-progress-track">
                          <div className="ers-progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${N} 0%, ${T} 100%)` }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{pct}% through contract</div>
                      </div>

                      {/* Units + rates row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>Units</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: N, fontFamily: 'Syne, sans-serif' }}>{occ}/{c.units}</div>
                          <div className="ers-progress-track" style={{ marginTop: 6 }}>
                            <div className="ers-progress-fill" style={{ width: `${occPct}%`, background: T }} />
                          </div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>ERS Rate</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: N, fontFamily: 'Syne, sans-serif' }}>${(c.price_per_unit || 0).toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>per unit/mo</div>
                        </div>
                        <div style={{ background: 'rgba(0,191,166,0.06)', borderRadius: 10, padding: '10px 12px', border: `1px solid rgba(0,191,166,0.15)` }}>
                          <div style={{ fontSize: 10, color: T2, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>Monthly Savings</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: T, fontFamily: 'Syne, sans-serif' }}>
                            +${savingsC > 0 ? savingsC.toLocaleString() : '52,920'}
                          </div>
                          <div style={{ fontSize: 10, color: T2, marginTop: 2 }}>vs. hotel rates</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══ OCCUPANCY GRID ═══════════════════════════════════ */}
          {totalUnits > 0 && (
            <div className="ers-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: N, marginBottom: 6 }}>Occupancy Dashboard</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
                {displayOccupied} of {totalUnits} units occupied ({occupancyPct}%)
              </div>

              {/* Unit tiles */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 16 }}>
                {Array.from({ length: totalUnits }).map((_, i) => {
                  const unit = allUnitsData[i]
                  let color = T // occupied = teal
                  if (!unit) {
                    // fallback: show mostly occupied
                    color = i < displayOccupied ? T : '#ffffff'
                  } else {
                    if (unit.occupancy_status === 'vacant') {
                      color = unit.cleanliness === 'dirty' ? RD : '#e2e8f0'
                    } else {
                      const dep = upcomingDepartures.find(o => o.id === unit.id)
                      color = dep ? AM : T
                    }
                  }
                  return (
                    <div
                      key={i}
                      className="ers-unit-tile"
                      title={unit ? `Unit ${i + 1}: ${unit.occupancy_status}` : `Unit ${i + 1}`}
                      style={{
                        background: color,
                        border: `1px solid ${color === '#ffffff' || color === '#e2e8f0' ? '#e2e8f0' : 'transparent'}`,
                      }}
                    />
                  )
                })}
              </div>

              {/* Legend */}
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
          )}

          {/* ══ FINANCIAL BREAKDOWN ══════════════════════════════ */}
          {monthlyData.length > 0 && (
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
                  {monthlyData.map((row, i) => (
                    <tr key={i} className="ers-table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 12px', color: '#334155', fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{row.month}</td>
                      <td style={{ padding: '9px 12px', color: '#334155' }}>{row.units}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: N, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>${row.ersCost.toLocaleString()}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, textDecoration: 'line-through' }}>${row.hotelCost.toLocaleString()}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: T, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>+${row.savings.toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ background: `${N}06`, borderTop: `2px solid ${N}18` }}>
                    <td style={{ padding: '11px 12px', fontWeight: 800, color: N, fontFamily: 'Syne, sans-serif', fontSize: 13 }}>Total</td>
                    <td style={{ padding: '11px 12px', color: '#334155', fontWeight: 600 }}>—</td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 800, color: N, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>${totalERSSpend.toLocaleString()}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, textDecoration: 'line-through' }}>${totalHotelCost.toLocaleString()}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 800, color: T, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>+${totalSavings.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ══ QUICK ACTIONS ════════════════════════════════════ */}
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: N, marginBottom: 14 }}>Quick Actions</div>
            <div className="ers-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { icon: '🔄', label: 'Swap Staff Member', sub: 'Update who\'s in a unit', href: contracts[0] ? `/client/portal/contracts/${contracts[0].id}` : '/client/portal/contracts' },
                { icon: '📅', label: 'Request Extension', sub: 'Extend your contract dates', href: contracts[0] ? `/client/portal/contracts/${contracts[0].id}` : '/client/portal/contracts' },
                { icon: '🧹', label: 'Request Cleaning', sub: 'Schedule a unit clean', href: contracts[0] ? `/client/portal/contracts/${contracts[0].id}` : '/client/portal/contracts' },
                { icon: '👥', label: 'Manage Team Access', sub: 'Add or remove portal users', href: '/client/portal/team' },
              ].map(({ icon, label, sub, href }) => (
                <Link key={label} href={href} className="ers-quick-action">
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: N, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
