'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A'

interface UnitRow {
  id: string
  contract_id: string | null
  address: string | null
  guest_name: string | null
  guest_contact: string | null
  lease_type: string | null
  lease_start: string | null
  lease_end: string | null
  landlord_name: string | null
  status: string
  // joined from contract
  contract?: {
    company_name?: string
    client_name?: string
    reference?: string
  }
}

const STATUS_COLORS: Record<string, string> = {
  active: T,
  inactive: '#94a3b8',
  vacant: '#94a3b8',
  occupied: T,
  maintenance: A,
  reserved: '#6366f1',
}

const lbl: React.CSSProperties = {
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#94a3b8',
  marginBottom: 4,
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitRow[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const h: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}
      // Fetch contract-units (units linked to contracts)
      const r = await fetch('/api/contract-units', { headers: h })
      if (r.ok) {
        const data: UnitRow[] = await r.json()
        // Fetch contract details for each unique contract_id
        const contractIds = Array.from(new Set(data.filter(u => u.contract_id).map(u => u.contract_id!)))
        const contractMap: Record<string, any> = {}
        if (contractIds.length) {
          const cr = await fetch(`/api/contracts?ids=${contractIds.join(',')}`, { headers: h }).catch(() => null)
          if (cr?.ok) {
            const contracts = await cr.json()
            ;(Array.isArray(contracts) ? contracts : contracts.data || []).forEach((c: any) => {
              contractMap[c.id] = c
            })
          }
        }
        setUnits(data.map(u => ({
          ...u,
          contract: u.contract_id ? contractMap[u.contract_id] : undefined,
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const active = units.filter(u => u.status === 'active').length
  const total = units.length

  return (
    <div style={{ padding: '32px 36px', background: '#f8f9fb', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: T, letterSpacing: '0.1em', marginBottom: 6 }}>UNIT REGISTRY</div>
        <div style={{ fontWeight: 700, fontSize: 26, color: N, letterSpacing: '-0.01em' }}>All Units</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          {total} total · {active} active
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8' }}>Loading…</div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 10, border: '1px solid #e8ecf0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏠</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8' }}>No units yet — add units via a contract</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(11,37,64,.05)' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.2fr 2fr 1.5fr 1fr',
            gap: 0,
            padding: '10px 20px',
            background: '#f8f9fb',
            borderBottom: '1px solid #e8ecf0',
          }}>
            {['Address', 'Client', 'Guest Name', 'Guest Contact', 'Lease Type', 'Lease Period', 'Landlord', 'Status'].map(h => (
              <div key={h} style={lbl}>{h}</div>
            ))}
          </div>

          {units.map((unit, i) => {
            const isActive = unit.status === 'active'
            const statusColor = STATUS_COLORS[unit.status] ?? '#94a3b8'
            const contractName = unit.contract?.client_name || unit.contract?.company_name || '—'
            const contractRef = unit.contract?.reference ? ` · ${unit.contract.reference}` : ''

            return (
              <div
                key={unit.id}
                onClick={() => unit.contract_id && router.push(`/contract/${unit.contract_id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.2fr 2fr 1.5fr 1fr',
                  gap: 0,
                  padding: '14px 20px',
                  borderBottom: i < units.length - 1 ? '1px solid #f1f4f8' : 'none',
                  cursor: unit.contract_id ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (unit.contract_id) (e.currentTarget as HTMLDivElement).style.background = `${T}06` }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '' }}
              >
                <div style={{ fontSize: 13, color: N, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                  {unit.address || '(no address)'}
                </div>
                <div style={{ fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                  <span style={{ fontWeight: 600 }}>{contractName}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: T }}>{contractRef}</span>
                </div>
                <div style={{ fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                  {unit.guest_name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                  {unit.guest_contact || '—'}
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#64748b', paddingRight: 8 }}>
                  {unit.lease_type || '—'}
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#64748b', paddingRight: 8 }}>
                  {unit.lease_start ? `${fmt(unit.lease_start)} → ${fmt(unit.lease_end)}` : '—'}
                </div>
                <div style={{ fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                  {unit.landlord_name || '—'}
                </div>
                <div>
                  <span style={{
                    fontSize: 10,
                    fontFamily: 'IBM Plex Mono',
                    padding: '3px 8px',
                    borderRadius: 10,
                    background: `${statusColor}18`,
                    color: statusColor,
                    border: `1px solid ${statusColor}44`,
                    whiteSpace: 'nowrap',
                  }}>
                    {isActive ? '● Active' : '○ ' + unit.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
