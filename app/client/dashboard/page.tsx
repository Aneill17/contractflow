'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Tab = 'overview' | 'contracts' | 'quotes' | 'ap'

interface ClientData {
  account: {
    company_name: string
    contact_name: string
    contact_email: string
  }
  contracts: Array<{
    id: string
    reference: string
    client_name: string
    contact_email: string
    start_date: string
    end_date: string
    stage: number
    status?: string
    units: number
    price_per_unit: number
    location: string
  }>
  stats: {
    totalUnits: number
    activeUnits: number
    activeContracts: number
    pendingQuotes: number
    totalMonthlyCost: number
  }
}

const STAGE_LABELS: Record<number, string> = {
  0: 'Request', 1: 'Quote Sent', 2: 'Contract', 3: 'Contract Sent', 4: 'Signed', 5: 'Complete'
}

export default function ClientDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedContract, setSelectedContract] = useState<string | null>(null)
  const [contractUnits, setContractUnits] = useState<any[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/client/login'
        return
      }
      const res = await fetch('/api/client-portal/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        setError('Failed to load dashboard data.')
        setLoading(false)
        return
      }
      setData(await res.json())
      setLoading(false)
    }
    load()
  }, [])

  const loadContractUnits = async (contractId: string) => {
    setLoadingUnits(true)
    setSelectedContract(contractId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch(`/api/units?contract_id=${contractId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) setContractUnits(await res.json())
    setLoadingUnits(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/client/login'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B2540', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading dashboard…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B2540', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#e25858', marginBottom: 12 }}>{error || 'No client account found.'}</div>
          <button onClick={signOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  const NAV_ITEMS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '◈' },
    { key: 'contracts', label: 'Contracts', icon: '📋' },
    { key: 'quotes', label: 'Quotes', icon: '✦' },
    { key: 'ap', label: 'Accounts Payable', icon: '💳' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: 220,
        background: '#0B2540',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#00BFA6', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
            Elias Range Stays
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Client Portal</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.account.company_name}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setSelectedContract(null) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                marginBottom: 4,
                borderRadius: 8,
                border: 'none',
                background: tab === item.key ? 'rgba(0,191,166,0.15)' : 'transparent',
                color: tab === item.key ? '#00BFA6' : 'rgba(255,255,255,0.5)',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: tab === item.key ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Refer link + sign out */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/client/refer" style={{ display: 'block', padding: '9px 12px', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono', fontSize: 10, textDecoration: 'none', marginBottom: 6, letterSpacing: '0.05em' }}>
            ✦ Refer & Earn
          </Link>
          <button onClick={signOut} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontFamily: 'IBM Plex Mono', fontSize: 10, cursor: 'pointer', textAlign: 'left', letterSpacing: '0.05em' }}>
            ↩ Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, padding: '32px 40px', maxWidth: 'calc(100vw - 220px)' }}>
        {/* Overview */}
        {tab === 'overview' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00BFA6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
                Welcome back
              </div>
              <div style={{ fontWeight: 700, fontSize: 26, color: '#0B2540' }}>
                {data.account.company_name}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                {data.account.contact_name} · {data.account.contact_email}
              </div>
            </div>

            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Units', value: data.stats.totalUnits, color: '#0B2540', icon: '🏠' },
                { label: 'Active Contracts', value: data.stats.activeContracts, color: '#00BFA6', icon: '📋' },
                { label: 'Pending Quotes', value: data.stats.pendingQuotes, color: '#C4793A', icon: '✦' },
                { label: 'Monthly Cost', value: `$${data.stats.totalMonthlyCost.toLocaleString()}`, color: '#1B4353', icon: '💳' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '20px 22px',
                  border: '1px solid #e8ecf0',
                  boxShadow: '0 1px 4px rgba(11,37,64,0.05)',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, fontWeight: 700, color: stat.color, marginBottom: 4 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent contracts */}
            {data.contracts.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0B2540', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid rgba(0,191,166,0.18)' }}>
                  Recent Contracts
                </div>
                {data.contracts.slice(0, 3).map(contract => (
                  <div key={contract.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f4f8' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0B2540' }}>{contract.reference}</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{contract.location}</div>
                    </div>
                    <div style={{
                      fontSize: 10,
                      fontFamily: 'IBM Plex Mono',
                      padding: '3px 10px',
                      borderRadius: 10,
                      background: contract.stage >= 4 ? 'rgba(0,191,166,0.1)' : 'rgba(196,121,58,0.1)',
                      color: contract.stage >= 4 ? '#00BFA6' : '#C4793A',
                    }}>
                      {STAGE_LABELS[contract.stage]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contracts */}
        {tab === 'contracts' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, color: '#0B2540', marginBottom: 24 }}>Your Contracts</div>
            {selectedContract ? (
              <div>
                <button
                  onClick={() => { setSelectedContract(null); setContractUnits([]) }}
                  style={{ background: 'transparent', border: '1px solid #e8ecf0', color: '#0B2540', padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 11, marginBottom: 20 }}
                >
                  ← Back
                </button>
                {(() => {
                  const contract = data.contracts.find(c => c.id === selectedContract)!
                  const monthlyCost = (contract.units || 0) * (contract.price_per_unit || 0) * 30
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                      <div>
                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '24px', marginBottom: 16 }}>
                          <div style={{ fontWeight: 700, fontSize: 18, color: '#0B2540', marginBottom: 4 }}>{contract.reference}</div>
                          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>{contract.location}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Start Date</div>
                              <div style={{ fontSize: 13, color: '#334155' }}>{contract.start_date ? new Date(contract.start_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</div>
                            </div>
                            <div>
                              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>End Date</div>
                              <div style={{ fontSize: 13, color: '#334155' }}>{contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: 14, color: '#0B2540', marginBottom: 12 }}>Units ({contractUnits.length})</div>
                        {loadingUnits && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8' }}>Loading units…</div>}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                          {contractUnits.map((unit: any) => (
                            <div key={unit.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8ecf0', padding: '16px' }}>
                              {unit.unit_photos?.find((p: any) => p.is_primary) && (
                                <img src={unit.unit_photos.find((p: any) => p.is_primary).url} alt="unit" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 7, marginBottom: 10 }} />
                              )}
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#0B2540', marginBottom: 4 }}>{unit.address || '(no address)'}</div>
                              {unit.guest_name && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#334155', marginBottom: 2 }}>👤 {unit.guest_name}</div>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', padding: '2px 8px', borderRadius: 8, background: unit.status === 'active' ? 'rgba(0,191,166,0.1)' : 'rgba(148,163,184,0.1)', color: unit.status === 'active' ? '#00BFA6' : '#94a3b8' }}>
                                  {unit.status}
                                </div>
                                {contract.price_per_unit > 0 && (
                                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#C4793A' }}>
                                    ${(contract.price_per_unit * 30).toLocaleString()}/mo
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AP sidebar */}
                      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(196,121,58,0.2)', padding: '20px', height: 'fit-content', position: 'sticky', top: 0 }}>
                        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                          Monthly AP
                        </div>
                        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, fontWeight: 700, color: '#C4793A', marginBottom: 4 }}>
                          ${monthlyCost.toLocaleString()}
                        </div>
                        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8' }}>
                          {contract.units} units × ${contract.price_per_unit?.toLocaleString()} × 30 days
                        </div>
                        {contractUnits.length > 0 && (
                          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f4f8' }}>
                            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Active Units
                            </div>
                            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#00BFA6', fontWeight: 600 }}>
                              {contractUnits.filter((u: any) => u.status === 'active').length} / {contractUnits.length}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.contracts.length === 0 && (
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8' }}>No contracts found.</div>
                  </div>
                )}
                {data.contracts.map(contract => (
                  <div
                    key={contract.id}
                    onClick={() => loadContractUnits(contract.id)}
                    style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '20px 24px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,191,166,0.4)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,191,166,0.1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8ecf0'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16, color: '#0B2540', marginBottom: 4 }}>{contract.reference}</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8' }}>
                        {contract.location} · {contract.units} units
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {contract.start_date ? new Date(contract.start_date).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' }) : ''} →{' '}
                        {contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' }) : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', padding: '3px 10px', borderRadius: 10, background: contract.stage >= 4 ? 'rgba(0,191,166,0.1)' : 'rgba(196,121,58,0.1)', color: contract.stage >= 4 ? '#00BFA6' : '#C4793A', marginBottom: 8, display: 'inline-block' }}>
                        {STAGE_LABELS[contract.stage]}
                      </div>
                      {contract.price_per_unit > 0 && (
                        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#C4793A', fontWeight: 600 }}>
                          ${(contract.units * contract.price_per_unit * 30).toLocaleString()}/mo
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quotes */}
        {tab === 'quotes' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, color: '#0B2540', marginBottom: 24 }}>Quotes</div>
            {data.contracts.filter(c => c.stage <= 2).length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8' }}>No pending quotes.</div>
              </div>
            ) : (
              data.contracts.filter(c => c.stage <= 2).map(contract => (
                <div key={contract.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', padding: '20px 24px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#0B2540', marginBottom: 4 }}>{contract.reference}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
                    {contract.units} units · {contract.location}
                  </div>
                  <div style={{ display: 'inline-block', fontSize: 10, fontFamily: 'IBM Plex Mono', padding: '3px 10px', borderRadius: 10, background: 'rgba(196,121,58,0.1)', color: '#C4793A' }}>
                    {STAGE_LABELS[contract.stage]}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Accounts Payable */}
        {tab === 'ap' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, color: '#0B2540', marginBottom: 24 }}>Accounts Payable</div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(196,121,58,0.2)', padding: '24px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Total Monthly Cost
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 36, fontWeight: 700, color: '#C4793A' }}>
                ${data.stats.totalMonthlyCost.toLocaleString()}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Across {data.stats.activeContracts} active contract{data.stats.activeContracts !== 1 ? 's' : ''}
              </div>
            </div>
            {data.contracts.filter(c => c.price_per_unit > 0).map(contract => (
              <div key={contract.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8ecf0', padding: '16px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0B2540' }}>{contract.reference}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {contract.units} units × ${contract.price_per_unit?.toLocaleString()}/unit/day
                  </div>
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, fontWeight: 700, color: '#C4793A' }}>
                  ${(contract.units * contract.price_per_unit * 30).toLocaleString()}/mo
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
