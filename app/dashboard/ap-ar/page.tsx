'use client'

import { useEffect, useState } from 'react'
import { getAuthHeaders } from '@/lib/auth'

interface Contract {
  id: string
  reference: string
  client_name: string
  contact_email: string
  units: number
  price_per_unit: number
  start_date: string
  end_date: string
  stage: number
  quote_line_items?: { description: string; amount: number }[]
  damage_deposit?: number
}

interface Unit {
  id: string
  address: string
  city?: string
  monthly_cost?: number
  status: string
  lease_end?: string
  landlord_name?: string
  landlord_email?: string
}

interface Assignment {
  id: string
  contract_id: string
  unit_id?: string
  unit_address?: string
  occupant_name?: string
  monthly_cost?: number
  move_in?: string
  move_out?: string
}

const now = new Date()
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
const fmtMoney = (n: number) => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const calcMonths = (start: string, end: string) =>
  Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24 * 30)))

const daysUntil = (d?: string) => {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function APARPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'ar' | 'ap' | 'cashflow'>('overview')

  useEffect(() => {
    const load = async () => {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/ap-ar', { headers })
      if (r.ok) {
        const d = await r.json()
        setContracts(d.contracts || [])
        setUnits(d.units || [])
        setAssignments(d.assignments || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  // AR calculations (what clients owe ERS)
  const arData = contracts.map(c => {
    const months = calcMonths(c.start_date, c.end_date)
    const base = c.units * c.price_per_unit * months
    const extras = (c.quote_line_items || []).reduce((s, li) => s + (li.amount || 0), 0)
    const total = base + extras + (c.damage_deposit || 0)
    const monthlyRate = c.units * c.price_per_unit
    const remaining = daysUntil(c.end_date)
    const monthsRemaining = remaining ? Math.max(0, Math.ceil(remaining / 30)) : 0
    const remainingRevenue = monthlyRate * monthsRemaining
    return { ...c, total, monthlyRate, months, monthsRemaining, remainingRevenue }
  })

  // AP calculations (what ERS owes landlords)
  const apData = units.filter(u => u.monthly_cost && u.monthly_cost > 0)

  // Summary stats
  const totalMonthlyAR = arData.reduce((s, c) => s + c.monthlyRate, 0)
  const totalMonthlyAP = apData.reduce((s, u) => s + (u.monthly_cost || 0), 0)
  const netMonthly = totalMonthlyAR - totalMonthlyAP
  const totalContractValue = arData.reduce((s, c) => s + c.total, 0)
  const totalRemainingRevenue = arData.reduce((s, c) => s + c.remainingRevenue, 0)

  // Upcoming contract endings
  const expiringContracts = arData
    .filter(c => { const d = daysUntil(c.end_date); return d !== null && d >= 0 && d <= 90 })
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())

  const expiredContracts = arData.filter(c => { const d = daysUntil(c.end_date); return d !== null && d < 0 })

  const tab = (key: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        background: activeTab === key ? '#1B4353' : 'transparent',
        border: `1px solid ${activeTab === key ? '#4F87A066' : '#ffffff15'}`,
        color: activeTab === key ? '#4F87A0' : '#ffffff44',
        borderRadius: 6, padding: '7px 18px', cursor: 'pointer',
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.08em',
      }}
    >{label}</button>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0C0E14', color: '#ffffff33', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
      Loading financial data...
    </div>
  )

  return (
    <div style={{ padding: '32px', fontFamily: 'IBM Plex Mono, monospace', color: '#DDD5C8', background: '#0C0E14', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=IBM+Plex+Mono:wght@300;400;500&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#DDD5C8', marginBottom: 4 }}>AP / AR Dashboard</div>
        <div style={{ fontSize: 11, color: '#ffffff33' }}>Accounts payable, receivable & cash position</div>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'MONTHLY REVENUE', value: fmtMoney(totalMonthlyAR), color: '#4CAF93', sub: 'from clients' },
          { label: 'MONTHLY COST', value: fmtMoney(totalMonthlyAP), color: '#E84855', sub: 'to landlords' },
          { label: 'NET MONTHLY', value: fmtMoney(netMonthly), color: netMonthly >= 0 ? '#C9A84C' : '#E84855', sub: 'cash margin' },
          { label: 'TOTAL UNDER MGMT', value: fmtMoney(totalContractValue), color: '#4F87A0', sub: 'contract value' },
          { label: 'REMAINING REVENUE', value: fmtMoney(totalRemainingRevenue), color: '#9B59B6', sub: 'in active contracts' },
        ].map(s => (
          <div key={s.label} style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 9, color: '#ffffff33', letterSpacing: '0.12em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, color: s.color, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#ffffff22', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(expiringContracts.length > 0 || expiredContracts.length > 0) && (
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expiredContracts.map(c => (
            <div key={c.id} style={{ background: '#E8485511', border: '1px solid #E8485544', borderRadius: 8, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#E84855' }}>✗ {c.reference} — {c.client_name} — Contract ended {fmt(c.end_date)}</div>
              <div style={{ fontSize: 10, color: '#E8485588' }}>ACTION REQUIRED</div>
            </div>
          ))}
          {expiringContracts.map(c => {
            const d = daysUntil(c.end_date)!
            return (
              <div key={c.id} style={{ background: '#C9A84C11', border: '1px solid #C9A84C44', borderRadius: 8, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#C9A84C' }}>⚠ {c.reference} — {c.client_name} — Ends in {d} days ({fmt(c.end_date)})</div>
                <div style={{ fontSize: 10, color: '#C9A84C88' }}>Renewal opportunity: {fmtMoney(c.monthlyRate)}/mo</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tab('overview', 'Overview')}
        {tab('ar', 'Receivables (AR)')}
        {tab('ap', 'Payables (AP)')}
        {tab('cashflow', 'Cash Flow')}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* AR summary */}
          <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '20px' }}>
            <div style={{ fontSize: 11, color: '#4CAF93', letterSpacing: '0.1em', marginBottom: 16 }}>RECEIVABLES — What Clients Owe ERS</div>
            {arData.length === 0 ? (
              <div style={{ color: '#ffffff33', fontSize: 12 }}>No active contracts</div>
            ) : arData.map(c => (
              <div key={c.id} style={{ borderBottom: '1px solid #ffffff08', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 12 }}>{c.client_name}</div>
                  <div style={{ fontSize: 12, color: '#4CAF93' }}>{fmtMoney(c.monthlyRate)}/mo</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 10, color: '#ffffff33' }}>{c.reference} · {c.units} units · ends {fmt(c.end_date)}</div>
                  <div style={{ fontSize: 10, color: '#9B59B6' }}>{fmtMoney(c.remainingRevenue)} remaining</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
              <div style={{ fontSize: 11, color: '#ffffff44' }}>Total monthly</div>
              <div style={{ fontSize: 16, color: '#4CAF93', fontFamily: 'Playfair Display, serif' }}>{fmtMoney(totalMonthlyAR)}</div>
            </div>
          </div>

          {/* AP summary */}
          <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '20px' }}>
            <div style={{ fontSize: 11, color: '#E84855', letterSpacing: '0.1em', marginBottom: 16 }}>PAYABLES — What ERS Pays Landlords</div>
            {apData.length === 0 ? (
              <div style={{ color: '#ffffff33', fontSize: 12 }}>No units with lease costs yet — add units in the Unit Registry</div>
            ) : apData.map(u => {
              const expiryDays = daysUntil(u.lease_end)
              return (
                <div key={u.id} style={{ borderBottom: '1px solid #ffffff08', paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 12 }}>{u.address.split(',')[0]}</div>
                    <div style={{ fontSize: 12, color: '#E84855' }}>{fmtMoney(u.monthly_cost!)}/mo</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 10, color: '#ffffff33' }}>{u.city || ''} · {u.landlord_name || 'No landlord'}</div>
                    {expiryDays !== null && expiryDays <= 90 && expiryDays > 0 && (
                      <div style={{ fontSize: 10, color: '#C9A84C' }}>Lease in {expiryDays}d</div>
                    )}
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
              <div style={{ fontSize: 11, color: '#ffffff44' }}>Total monthly</div>
              <div style={{ fontSize: 16, color: '#E84855', fontFamily: 'Playfair Display, serif' }}>{fmtMoney(totalMonthlyAP)}</div>
            </div>
          </div>
        </div>
      )}

      {/* AR detail */}
      {activeTab === 'ar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: '#ffffff33', marginBottom: 4 }}>What clients owe ERS — per contract</div>
          {arData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#ffffff22', padding: 48, fontSize: 13 }}>No active contracts in AR pipeline</div>
          ) : arData.map(c => (
            <div key={c.id} style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 14 }}>{c.client_name}</div>
                    <div style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: '#4CAF9322', border: '1px solid #4CAF9344', color: '#4CAF93', letterSpacing: '0.08em' }}>ACTIVE</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#ffffff44' }}>{c.reference} · {c.contact_email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, color: '#4CAF93', fontFamily: 'Playfair Display, serif' }}>{fmtMoney(c.monthlyRate)}</div>
                  <div style={{ fontSize: 10, color: '#ffffff33' }}>per month</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  ['Units', c.units],
                  ['Rate/Unit', fmtMoney(c.price_per_unit) + '/mo'],
                  ['Contract Term', `${c.months} months`],
                  ['Total Value', fmtMoney(c.total)],
                  ['Start', fmt(c.start_date)],
                  ['End', fmt(c.end_date)],
                  ['Months Left', c.monthsRemaining],
                  ['Remaining Rev.', fmtMoney(c.remainingRevenue)],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <div style={{ fontSize: 9, color: '#ffffff33', letterSpacing: '0.1em', marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 12 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AP detail */}
      {activeTab === 'ap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: '#ffffff33', marginBottom: 4 }}>What ERS pays landlords — per unit</div>
          {apData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#ffffff22', padding: 48, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏘️</div>
              No units with lease costs yet — add units in the Unit Registry
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {apData.map(u => {
                  const expiryDays = daysUntil(u.lease_end)
                  const expiring = expiryDays !== null && expiryDays <= 60 && expiryDays > 0
                  const expired = expiryDays !== null && expiryDays <= 0
                  return (
                    <div key={u.id} style={{ background: '#13161D', border: `1px solid ${expired ? '#E8485533' : expiring ? '#C9A84C33' : '#ffffff0D'}`, borderRadius: 10, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, marginBottom: 4 }}>{u.address}</div>
                          <div style={{ fontSize: 11, color: '#ffffff44' }}>
                            {u.city && `${u.city} · `}
                            {u.landlord_name || 'No landlord on file'}
                            {u.landlord_email && ` · ${u.landlord_email}`}
                          </div>
                          {u.lease_end && (
                            <div style={{ fontSize: 10, color: expired ? '#E84855' : expiring ? '#C9A84C' : '#ffffff33', marginTop: 4 }}>
                              Lease ends: {fmt(u.lease_end)}{expiryDays !== null && expiryDays > 0 ? ` (${expiryDays} days)` : expired ? ' — EXPIRED' : ''}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 22, color: '#E84855', fontFamily: 'Playfair Display, serif' }}>{fmtMoney(u.monthly_cost!)}</div>
                          <div style={{ fontSize: 10, color: '#ffffff33' }}>per month</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, color: '#ffffff44' }}>Total monthly outgoing</div>
                <div style={{ fontSize: 20, color: '#E84855', fontFamily: 'Playfair Display, serif' }}>{fmtMoney(totalMonthlyAP)}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Cash flow */}
      {activeTab === 'cashflow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Monthly P&L bar */}
          <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '24px' }}>
            <div style={{ fontSize: 11, color: '#ffffff44', letterSpacing: '0.1em', marginBottom: 20 }}>MONTHLY CASH POSITION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, color: '#4CAF93', letterSpacing: '0.12em', marginBottom: 8 }}>REVENUE IN</div>
                <div style={{ fontSize: 32, color: '#4CAF93', fontFamily: 'Playfair Display, serif' }}>{fmtMoney(totalMonthlyAR)}</div>
                <div style={{ fontSize: 10, color: '#ffffff33', marginTop: 4 }}>from {arData.length} active contracts</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#E84855', letterSpacing: '0.12em', marginBottom: 8 }}>COST OUT</div>
                <div style={{ fontSize: 32, color: '#E84855', fontFamily: 'Playfair Display, serif' }}>{fmtMoney(totalMonthlyAP)}</div>
                <div style={{ fontSize: 10, color: '#ffffff33', marginTop: 4 }}>to {apData.length} landlords</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#C9A84C', letterSpacing: '0.12em', marginBottom: 8 }}>NET MARGIN</div>
                <div style={{ fontSize: 32, color: netMonthly >= 0 ? '#C9A84C' : '#E84855', fontFamily: 'Playfair Display, serif' }}>{fmtMoney(netMonthly)}</div>
                <div style={{ fontSize: 10, color: '#ffffff33', marginTop: 4 }}>
                  {totalMonthlyAR > 0 ? Math.round((netMonthly / totalMonthlyAR) * 100) : 0}% margin
                </div>
              </div>
            </div>
            {/* Visual bar */}
            {totalMonthlyAR > 0 && (
              <div>
                <div style={{ height: 8, background: '#ffffff0A', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (totalMonthlyAP / totalMonthlyAR) * 100)}%`, background: 'linear-gradient(90deg, #E84855, #E84855aa)', borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: 10, color: '#ffffff33' }}>
                  Cost is {Math.round((totalMonthlyAP / totalMonthlyAR) * 100)}% of revenue
                </div>
              </div>
            )}
          </div>

          {/* Per-contract breakdown */}
          <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '20px' }}>
            <div style={{ fontSize: 11, color: '#ffffff44', letterSpacing: '0.1em', marginBottom: 16 }}>CONTRACT FINANCIALS</div>
            {arData.length === 0 ? (
              <div style={{ color: '#ffffff33', fontSize: 12 }}>No active contracts</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Contract', 'Client', 'Units', 'Monthly', 'Total Value', 'Remaining', 'End Date'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, color: '#ffffff33', letterSpacing: '0.1em', fontWeight: 400, borderBottom: '1px solid #ffffff08' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {arData.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #ffffff05' }}>
                      <td style={{ padding: '10px 10px', color: '#C9A84C' }}>{c.reference}</td>
                      <td style={{ padding: '10px 10px' }}>{c.client_name}</td>
                      <td style={{ padding: '10px 10px', color: '#ffffff66' }}>{c.units}</td>
                      <td style={{ padding: '10px 10px', color: '#4CAF93' }}>{fmtMoney(c.monthlyRate)}</td>
                      <td style={{ padding: '10px 10px' }}>{fmtMoney(c.total)}</td>
                      <td style={{ padding: '10px 10px', color: '#9B59B6' }}>{fmtMoney(c.remainingRevenue)}</td>
                      <td style={{ padding: '10px 10px', color: daysUntil(c.end_date)! <= 30 ? '#E84855' : daysUntil(c.end_date)! <= 90 ? '#C9A84C' : '#ffffff66' }}>{fmt(c.end_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <div style={{ height: 48 }} />
    </div>
  )
}
