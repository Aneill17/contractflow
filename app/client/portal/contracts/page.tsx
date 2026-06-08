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
}

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const STAGE_LABELS: Record<number, string> = {
  0: 'Request', 1: 'Quote Sent', 2: 'Quote Approved', 3: 'Contract Sent', 4: 'Active', 5: 'Complete',
}

export default function ContractsListPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/client/contracts')
      .then(r => {
        if (r.status === 401) { window.location.href = '/client/portal/login'; return null }
        return r.json()
      })
      .then(data => { if (data) setContracts(data) })
      .finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    await fetch('/api/client/auth/logout', { method: 'POST' })
    window.location.href = '/client/portal/login'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: N, height: 56, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 4, position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginRight: 20 }}>ERS · Client Portal</div>
        {[
          { href: '/client/portal', label: 'Overview' },
          { href: '/client/portal/contracts', label: 'Contracts' },
          { href: '/client/portal/team', label: 'Team' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{ padding: '6px 14px', borderRadius: 7, color: href === '/client/portal/contracts' ? T : 'rgba(255,255,255,0.55)', fontWeight: href === '/client/portal/contracts' ? 600 : 400, fontSize: 13, textDecoration: 'none' }}>{label}</Link>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>Logout</button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>YOUR CONTRACTS</div>
          <div style={{ fontWeight: 700, fontSize: 26, color: N, letterSpacing: '-0.01em' }}>Contracts</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8' }}>Loading…</div>
        ) : contracts.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8' }}>No contracts yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contracts.map(c => (
              <Link
                key={c.id}
                href={`/client/portal/contracts/${c.id}`}
                style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '20px 24px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,191,166,0.4)'; ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(0,191,166,0.08)' }}
                onMouseLeave={e => { ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#e8ecf0'; ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: N, marginBottom: 4 }}>{c.reference}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{c.location} · {c.units} unit{c.units !== 1 ? 's' : ''}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#64748b' }}>
                    {fmt(c.start_date)} → {fmt(c.end_date)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block',
                    fontSize: 10,
                    fontFamily: 'IBM Plex Mono, monospace',
                    padding: '3px 10px',
                    borderRadius: 10,
                    background: c.stage >= 4 ? 'rgba(0,191,166,0.1)' : 'rgba(196,121,58,0.1)',
                    color: c.stage >= 4 ? T : '#C4793A',
                    marginBottom: 8,
                  }}>
                    {STAGE_LABELS[c.stage] || `Stage ${c.stage}`}
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8' }}>
                    View details →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
