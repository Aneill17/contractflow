'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/auth'

const N = '#0B2540'
const T = '#00BFA6'
const T2 = '#009793'
const A = '#F59E0B'

// ── Types ─────────────────────────────────────────────────────
interface Referral {
  id: string
  referring_name: string
  client_user_email: string
  client_company_name: string
  referee_name: string
  referee_email: string
  referee_company: string
  referee_need?: string
  personal_note?: string
  referral_code: string
  status: 'pending' | 'contacted' | 'converted' | 'dead'
  sent_at: string
  contacted_at?: string
  converted_at?: string
  notes?: string
  contacts?: { id: string; name: string; company: string; status: string; email: string } | null
  contracts?: { id: string; reference: string; client_name: string } | null
}

const STATUS_META = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  contacted: { label: 'Contacted', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  converted: { label: 'Converted', color: '#00BFA6', bg: 'rgba(0,191,166,0.12)'  },
  dead:      { label: 'No Fit',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status as keyof typeof STATUS_META] || STATUS_META.pending
  return (
    <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  )
}

export default function InternalReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/referrals', { headers })
      if (res.ok) setReferrals(await res.json())
      else setError('Failed to load referrals')
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    const headers = await getAuthHeaders()
    await fetch('/api/referrals', {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    await load()
    setUpdatingId(null)
  }

  // ── Stats ──────────────────────────────────────────────────
  const total = referrals.length
  const pending = referrals.filter(r => r.status === 'pending').length
  const contacted = referrals.filter(r => r.status === 'contacted').length
  const converted = referrals.filter(r => r.status === 'converted').length

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Nunito Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=Nunito+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        .stat-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid rgba(11,37,64,0.06); padding: 22px 24px; }
        .ref-row:hover { background: #f8fafc; }
        .ref-row-expanded { background: rgba(0,191,166,0.03); }
        select { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; font-size: 12px; cursor: pointer; font-family: 'Nunito Sans', sans-serif; color: #334155; outline: none; }
        select:focus { border-color: ${T}; }
      `}</style>

      {/* Content — this page lives inside the main layout but has its own page header */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: N, letterSpacing: '-0.02em' }}>
            Referral Tracker
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            All client-sent referrals — track status, follow up, and convert to contracts
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '12px 18px', color: '#ef4444', marginBottom: 20, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Referrals', value: total, color: N },
            { label: 'Pending Follow-up', value: pending, color: A },
            { label: 'Contacted', value: contacted, color: '#3B82F6' },
            { label: 'Converted to Clients', value: converted, color: T },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color, lineHeight: 1 }}>{loading ? '—' : value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Loading referrals…
          </div>
        ) : referrals.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🤝</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: N, marginBottom: 6 }}>No referrals yet</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Referrals sent by clients will appear here.</div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Referred By', 'Referee', 'Sent', 'Status', 'Contract', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => {
                  const isExpanded = expandedId === r.id
                  return (
                    <>
                      <tr
                        key={r.id}
                        className={`ref-row${isExpanded ? ' ref-row-expanded' : ''}`}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        {/* Referred By */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: N }}>{r.referring_name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{r.client_company_name}</div>
                          <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>{r.client_user_email}</div>
                        </td>

                        {/* Referee */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: N }}>{r.referee_name}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.referee_company}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{r.referee_email}</div>
                        </td>

                        {/* Sent */}
                        <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                          {fmtDate(r.sent_at)}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={r.status} />
                        </td>

                        {/* Contract */}
                        <td style={{ padding: '14px 16px' }}>
                          {r.contracts ? (
                            <a
                              href={`/?contract=${r.contracts.id}`}
                              style={{ fontSize: 12, color: T, fontFamily: 'monospace', textDecoration: 'none', fontWeight: 600 }}
                              onClick={e => e.stopPropagation()}
                            >
                              {r.contracts.reference}
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select
                              value={r.status}
                              onChange={e => updateStatus(r.id, e.target.value)}
                              disabled={updatingId === r.id}
                              style={{ minWidth: 110 }}
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="converted">Converted</option>
                              <option value="dead">No Fit</option>
                            </select>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExpanded && (
                        <tr key={`${r.id}-expanded`}>
                          <td colSpan={6} style={{ padding: '0 16px 20px', background: 'rgba(0,191,166,0.03)', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, paddingTop: 16 }}>
                              {r.referee_need && (
                                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px' }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Housing Need</div>
                                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{r.referee_need}</div>
                                </div>
                              )}
                              {r.personal_note && (
                                <div style={{ background: '#fffbf0', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '14px 16px' }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: A, textTransform: 'uppercase', marginBottom: 6 }}>Personal Note</div>
                                  <div style={{ fontSize: 13, color: '#334155', fontStyle: 'italic', lineHeight: 1.6 }}>"{r.personal_note}"</div>
                                </div>
                              )}
                              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Referral Code</div>
                                <div style={{ fontSize: 13, color: N, fontFamily: 'monospace', fontWeight: 600 }}>{r.referral_code}</div>
                                {r.contacts && (
                                  <div style={{ marginTop: 10 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>CRM Contact</div>
                                    <a href={`/dashboard/contacts`} style={{ fontSize: 12, color: T, textDecoration: 'none', fontWeight: 600 }}>
                                      {r.contacts.name} →
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                            {r.notes && (
                              <div style={{ marginTop: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                                Internal notes: {r.notes}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
