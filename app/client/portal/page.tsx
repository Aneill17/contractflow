'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  occupants?: Array<{ id: string; name: string; status: string; departure_date?: string }>
  units_data?: UnitRow[]
}

interface UnitRow {
  id: string
  address: string
  cleanliness: 'clean' | 'dirty' | 'cleaning_requested'
  occupancy_status: 'occupied' | 'vacant'
  status: string
}

interface Session {
  email: string
  company_name: string
  role: string
}

function getSession(): Session | null {
  // Read from cookie client-side by calling a me endpoint
  return null
}

const CLEANLINESS_BADGE = {
  clean: { emoji: '🟢', label: 'Clean', color: '#00BFA6', bg: 'rgba(0,191,166,0.1)' },
  dirty: { emoji: '🔴', label: 'Dirty', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  cleaning_requested: { emoji: '🟡', label: 'Requested', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export default function ClientPortalOverview() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionInfo, setSessionInfo] = useState<{ email: string; company_name: string; role: string } | null>(null)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    const res = await fetch('/api/client/contracts')
    if (res.status === 401) {
      window.location.href = '/client/portal/login'
      return
    }
    if (!res.ok) {
      setError('Failed to load data')
      setLoading(false)
      return
    }
    const data: Contract[] = await res.json()
    setContracts(data)
    setLoading(false)
  }

  useEffect(() => {
    // Get session info from a lightweight endpoint or cookie
    fetch('/api/client/contracts')
      .then(r => {
        if (r.status === 401) {
          window.location.href = '/client/portal/login'
        }
        return r.json()
      })
      .then(data => {
        if (Array.isArray(data)) setContracts(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Network error')
        setLoading(false)
      })

    // Try to get session info from cookie decode
    // We surface email from a simple /api/client/me endpoint
    fetch('/api/client/me')
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s) setSessionInfo(s) })
      .catch(() => {})
  }, [])

  const logout = async () => {
    await fetch('/api/client/auth/logout', { method: 'POST' })
    window.location.href = '/client/portal/login'
  }

  // Summary stats
  const now = new Date()
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const allOccupants = contracts.flatMap(c => c.occupants || [])
  const upcomingDepartures = allOccupants.filter(o =>
    o.status === 'departing' && o.departure_date && new Date(o.departure_date) <= in14Days
  )

  const totalUnits = contracts.reduce((s, c) => s + (c.units || 0), 0)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B2540', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Top nav */}
      <nav style={{
        background: N,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 4,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginRight: 20 }}>
          ERS · Client Portal
        </div>
        {[
          { href: '/client/portal', label: 'Overview' },
          { href: '/client/portal/contracts', label: 'Contracts' },
          { href: '/client/portal/team', label: 'Team' },
        ].map(({ href, label }) => {
          const active = typeof window !== 'undefined' && window.location.pathname === href
          return (
            <Link key={href} href={href} style={{
              padding: '6px 14px',
              borderRadius: 7,
              color: active ? T : 'rgba(255,255,255,0.55)',
              fontWeight: active ? 600 : 400,
              fontSize: 13,
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}>{label}</Link>
          )
        })}
        <div style={{ flex: 1 }} />
        {sessionInfo && (
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginRight: 16 }}>
            {sessionInfo.company_name} · {sessionInfo.email}
          </div>
        )}
        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.4)',
            padding: '6px 14px',
            borderRadius: 7,
            cursor: 'pointer',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 11,
          }}
        >
          Logout
        </button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
            Welcome back
          </div>
          <div style={{ fontWeight: 700, fontSize: 28, color: N, letterSpacing: '-0.02em' }}>
            {sessionInfo?.company_name || 'Client Portal'}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            {sessionInfo?.email}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(226,88,88,0.1)', borderRadius: 8, color: '#ef4444', marginBottom: 24, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Total Units', value: totalUnits, icon: '🏠', color: N },
            { label: 'Active Contracts', value: contracts.length, icon: '📋', color: T },
            { label: 'Upcoming Departures', value: upcomingDepartures.length, icon: '📅', color: upcomingDepartures.length > 0 ? '#f59e0b' : '#94a3b8' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff',
              borderRadius: 12,
              padding: '20px 22px',
              border: '1px solid #e8ecf0',
              boxShadow: '0 1px 4px rgba(11,37,64,0.05)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 26, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Contracts list */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: N }}>Contracts</div>
          <Link href="/client/portal/contracts" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {contracts.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8' }}>No contracts found.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contracts.map(c => {
              const occupied = (c.units_data || []).filter(u => u.occupancy_status === 'occupied').length
              const dirty = (c.units_data || []).filter(u => u.cleanliness === 'dirty' || u.cleanliness === 'cleaning_requested').length

              return (
                <Link
                  key={c.id}
                  href={`/client/portal/contracts/${c.id}`}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e8ecf0',
                    padding: '20px 24px',
                    textDecoration: 'none',
                    display: 'block',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,191,166,0.4)'
                    ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(0,191,166,0.1)'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#e8ecf0'
                    ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: N, marginBottom: 4 }}>{c.reference}</div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                        {c.location} · {c.units} unit{c.units !== 1 ? 's' : ''}
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b' }}>
                        {fmt(c.start_date)} → {fmt(c.end_date)}
                      </div>
                    </div>
                    {/* Mini status bar */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: 'rgba(0,191,166,0.1)', color: T, fontFamily: 'IBM Plex Mono, monospace' }}>
                        {c.units} units
                      </span>
                      {dirty > 0 && (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontFamily: 'IBM Plex Mono, monospace' }}>
                          🧹 {dirty} need cleaning
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
