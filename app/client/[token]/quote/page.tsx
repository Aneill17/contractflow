'use client'

import { useEffect, useState } from 'react'

export default function ClientQuotePage({ params }: { params: { token: string } }) {
  const [contract, setContract] = useState<any>(null)
  const [occupants, setOccupants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    fetch(`/api/client/${params.token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setLoading(false); return }
        setContract(data)
        setOccupants(data.occupants || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.token])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const approveQuote = async () => {
    setApproving(true)
    await fetch(`/api/client/${params.token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 2, audit_action: 'Quote approved by client' }),
    })
    setApproved(true)
    setApproving(false)
  }

  const printQuote = () => window.print()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: '#9CA3AF' }}>Loading quote...</div>
    </div>
  )

  if (!contract) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: '#9CA3AF' }}>Quote not found.</div>
    </div>
  )

  const months = Math.max(1, Math.round(
    (new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime())
    / (1000 * 60 * 60 * 24 * 30)
  ))
  const baseTotal = contract.units * contract.price_per_unit * months
  const lineItems: any[] = contract.quote_line_items || []
  const lineItemsTotal = lineItems.reduce((s: number, li: any) => s + (li.amount || 0), 0)
  const grandTotal = baseTotal + lineItemsTotal + (contract.damage_deposit || 0)
  const isQuoteSent = contract.stage >= 1
  const isApproved = contract.stage >= 2 || approved
  const ersDailyRate = contract.price_per_unit / 30

  const hasBenchmark = contract.current_housing_rate > 0
  const hasWorksite = !!contract.work_site_address

  let savingsPct = 0, totalSavings = 0
  if (hasBenchmark) {
    const theirRate = contract.current_housing_rate
    const savingsPerUnit = (theirRate - ersDailyRate) * 30 * months
    totalSavings = savingsPerUnit * contract.units
    savingsPct = Math.max(0, Math.round(((theirRate - ersDailyRate) / theirRate) * 100))
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  // What's included — build from inclusions or use defaults
  const inclusionLines = contract.inclusions
    ? contract.inclusions.split('\n').filter(Boolean)
    : [
        'All utilities included (heat, water, electricity, internet)',
        'Parking as specified in agreement',
        'Laundry facilities on-site',
        'Weekly common area cleaning',
        '24/7 support line',
        'Single monthly invoice — no hidden fees',
      ]

  const ERSValueTiers = [
    {
      icon: '📋',
      title: 'Fully Managed',
      desc: 'One point of contact. One invoice. No landlord chasing, no utility juggling.',
      color: '#4F87A0',
    },
    {
      icon: '⚡',
      title: '24/7 Support',
      desc: 'Something breaks at 2am? We handle it. Your team stays focused on work.',
      color: '#C9A84C',
    },
    {
      icon: '📍',
      title: 'Close to Site',
      desc: 'Units sourced specifically near your work location. Less commute, more rest.',
      color: '#3D8B5E',
    },
    {
      icon: '💼',
      title: 'Corporate Grade',
      desc: 'Fully furnished, move-in ready. Designed for working professionals.',
      color: '#9B59B6',
    },
    {
      icon: '💰',
      title: hasBenchmark ? `${savingsPct}% Less Than Hotels` : 'Predictable Cost',
      desc: hasBenchmark
        ? `Save $${totalSavings.toLocaleString()} vs your current setup over this contract.`
        : 'Fixed monthly rate — budget with confidence. No surprises.',
      color: '#2D5A3D',
    },
    {
      icon: '🤝',
      title: 'Flexible Terms',
      desc: 'Monthly billing, easy extensions, dedicated account management.',
      color: '#1B4353',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: "'Source Serif 4', Georgia, serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;600;700&family=Source+Serif+4:ital,wght@0,400;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .quote-page { box-shadow: none !important; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Sticky top nav ── */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#1B4353', padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <img src="/logo-v2.png" alt="Elias Range Stays" style={{ height: 36 }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginRight: 8 }}>
            {contract.reference}
          </div>
          <button onClick={copyLink} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
            {copied ? '✓ Copied!' : '⎘ Copy Link'}
          </button>
          <button onClick={printQuote} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
            ↓ Download PDF
          </button>
          {isQuoteSent && !isApproved && (
            <button onClick={approveQuote} disabled={approving} style={{ background: '#2D5A3D', border: 'none', color: 'white', padding: '7px 20px', borderRadius: 6, cursor: 'pointer', fontFamily: "'League Spartan', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
              {approving ? 'Approving...' : '✓ Approve Quote'}
            </button>
          )}
          {isApproved && (
            <div style={{ background: 'rgba(45,90,61,0.3)', border: '1px solid rgba(45,90,61,0.6)', color: '#6FCF97', padding: '7px 16px', borderRadius: 6, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
              ✓ Quote Approved
            </div>
          )}
        </div>
      </div>

      {/* ── Quote document ── */}
      <div className="quote-page" style={{ maxWidth: 820, margin: '40px auto', background: 'white', borderRadius: 16, boxShadow: '0 4px 60px rgba(0,0,0,0.10)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#1B4353', padding: '40px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <img src="/logo-v2.png" alt="Elias Range Stays" style={{ height: 36, marginBottom: 16, display: 'block' }} />
            <h1 style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 32, color: 'white', fontWeight: 700, margin: 0 }}>
              Housing Quote
            </h1>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#A8D1E7', letterSpacing: '0.12em', marginTop: 8 }}>
              {contract.reference}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Prepared for</div>
            <div style={{ fontFamily: "'League Spartan', sans-serif", color: 'white', fontSize: 16, fontWeight: 600 }}>{contract.client_name}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{contract.contact_name}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(168,209,231,0.7)', marginTop: 2 }}>{fmt(new Date().toISOString().split('T')[0])}</div>
            {hasWorksite && (
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(168,209,231,0.55)', marginTop: 8, maxWidth: 220 }}>
                📍 {contract.work_site_address.split(',').slice(0, 2).join(',').trim()}
              </div>
            )}
          </div>
        </div>

        {/* Gold accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #C9A84C, #4F87A0, #C9A84C)' }} />

        <div style={{ padding: '40px 48px' }}>

          {/* ── BENCHMARK COMPARISON ── */}
          {hasBenchmark && (() => {
            const theirRate = contract.current_housing_rate
            return (
              <div style={{ marginBottom: 36, background: 'linear-gradient(135deg, #0D1F15, #152B1E)', border: '2px solid rgba(45,90,61,0.4)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ background: '#1A3B26', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 13, color: '#6FCF97', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                    💰 Your Savings Breakdown
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(111,207,151,0.6)', letterSpacing: '0.1em' }}>
                    {contract.current_housing_location || 'vs current solution'}
                  </div>
                </div>
                <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
                  {/* Their cost */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
                      {contract.current_housing_location
                        ? contract.current_housing_location.split(',')[0]
                        : 'Current Cost'}
                    </div>
                    <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 42, color: '#E84855', fontWeight: 700, lineHeight: 1 }}>
                      ${theirRate}
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                      per room / night
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(232,72,85,0.7)', marginTop: 8 }}>
                      ${(theirRate * 30 * contract.units * months).toLocaleString()} over term
                    </div>
                  </div>

                  {/* VS badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{
                      background: 'rgba(45,90,61,0.3)', border: '2px solid #2D5A3D',
                      borderRadius: 12, padding: '12px 20px', textAlign: 'center',
                    }}>
                      <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 26, color: '#6FCF97', fontWeight: 700 }}>
                        {savingsPct}%
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(111,207,151,0.7)', letterSpacing: '0.1em', marginTop: 2 }}>LESS</div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#6FCF97', marginTop: 6, whiteSpace: 'nowrap' }}>
                        Save ${totalSavings.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
                  </div>

                  {/* ERS cost */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
                      Elias Range Stays
                    </div>
                    <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 42, color: '#6FCF97', fontWeight: 700, lineHeight: 1 }}>
                      ${ersDailyRate.toFixed(0)}
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                      per unit / night
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(111,207,151,0.7)', marginTop: 8 }}>
                      ${(ersDailyRate * 30 * contract.units * months).toLocaleString()} over term
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── BOOKING DETAILS ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>Booking Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
              {[
                ['Location', contract.location],
                ['Units', `${contract.units} unit${contract.units > 1 ? 's' : ''}`],
                ['Occupants', occupants.map((o: any) => o.name).join(', ') || 'To be confirmed'],
                ['Check-in', fmt(contract.start_date)],
                ['Check-out', fmt(contract.end_date)],
                ['Duration', `${months} month${months > 1 ? 's' : ''}`],
                ['Payment Method', contract.payment_method],
                ['Payment Schedule', contract.payment_schedule || 'Monthly'],
                ...(hasWorksite ? [['Work Site', contract.work_site_address.split(',').slice(0, 2).join(',').trim()]] : []),
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#1A1A1A' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── PRICING TABLE ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>Pricing Breakdown</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F7F7F5' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 400 }}>Description</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 400 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F0EDE8' }}>
                  <td style={{ padding: '14px 16px', fontFamily: "'Source Serif 4', serif", fontSize: 14, color: '#1A1A1A' }}>
                    Corporate Housing — {contract.units} unit{contract.units > 1 ? 's' : ''} × ${contract.price_per_unit.toLocaleString()}/mo × {months} month{months > 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, fontFamily: 'IBM Plex Mono, monospace', color: '#1A1A1A' }}>${baseTotal.toLocaleString()}</td>
                </tr>
                {lineItems.filter((li: any) => li.description && li.amount).map((li: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F0EDE8' }}>
                    <td style={{ padding: '14px 16px', fontFamily: "'Source Serif 4', serif", fontSize: 14, color: '#1A1A1A' }}>{li.description}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, fontFamily: 'IBM Plex Mono, monospace', color: '#1A1A1A' }}>${li.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {contract.damage_deposit > 0 && (
                  <tr style={{ borderBottom: '1px solid #F0EDE8' }}>
                    <td style={{ padding: '14px 16px', fontFamily: "'Source Serif 4', serif", fontSize: 14, color: '#1A1A1A' }}>Damage Deposit (refundable)</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, fontFamily: 'IBM Plex Mono, monospace', color: '#1A1A1A' }}>${contract.damage_deposit.toLocaleString()}</td>
                  </tr>
                )}
                <tr style={{ background: '#F7F7F5' }}>
                  <td style={{ padding: '16px', fontFamily: "'League Spartan', sans-serif", fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>Total</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontFamily: "'League Spartan', sans-serif", fontSize: 28, color: '#1B4353', fontWeight: 700 }}>${grandTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── WHAT YOU'RE GETTING — Value tier grid ── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>
              What You&apos;re Getting
            </div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontStyle: 'italic', fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              This is what&apos;s included in every Elias Range Stays contract — not just a room.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {ERSValueTiers.map((tier) => (
                <div key={tier.title} style={{
                  background: `${tier.color}08`,
                  border: `1px solid ${tier.color}33`,
                  borderRadius: 10,
                  padding: '18px 20px',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{tier.icon}</div>
                  <div style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 600, fontSize: 13, color: tier.color, marginBottom: 6, letterSpacing: '0.03em' }}>
                    {tier.title}
                  </div>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: '#6B7280', lineHeight: 1.65 }}>
                    {tier.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── INCLUSIONS / EXCLUSIONS ── */}
          {(contract.inclusions || contract.exclusions) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              {contract.inclusions && (
                <div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>What&apos;s Included</div>
                  <div style={{ background: '#F0FAF5', borderRadius: 8, padding: '16px 18px' }}>
                    {inclusionLines.map((line: string, i: number) => (
                      <div key={i} style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#2D5A3D', marginBottom: 6, display: 'flex', gap: 8 }}>
                        <span style={{ flexShrink: 0 }}>✓</span><span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {contract.exclusions && (
                <div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Not Included</div>
                  <div style={{ background: '#FEF9F0', borderRadius: 8, padding: '16px 18px' }}>
                    {contract.exclusions.split('\n').filter(Boolean).map((line: string, i: number) => (
                      <div key={i} style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#92400E', marginBottom: 6, display: 'flex', gap: 8 }}>
                        <span style={{ flexShrink: 0 }}>—</span><span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Default inclusions if none set */}
          {!contract.inclusions && !contract.exclusions && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Included in All Packages</div>
              <div style={{ background: '#F0FAF5', borderRadius: 8, padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
                {inclusionLines.map((line: string, i: number) => (
                  <div key={i} style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#2D5A3D', display: 'flex', gap: 8 }}>
                    <span style={{ flexShrink: 0 }}>✓</span><span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── QUOTE NOTES ── */}
          {contract.quote_notes && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Notes &amp; Special Terms</div>
              <div style={{ background: '#F7F7F5', borderRadius: 8, padding: '16px 18px', fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#555', lineHeight: 1.8 }}>
                {contract.quote_notes}
              </div>
            </div>
          )}

          {/* ── APPROVE CTA ── */}
          {isQuoteSent && !isApproved && (
            <div className="no-print" style={{
              background: 'linear-gradient(135deg, #0B2030 0%, #1B4353 100%)',
              border: '2px solid rgba(79,135,160,0.5)',
              borderRadius: 14, padding: '36px 40px', textAlign: 'center', marginBottom: 24,
            }}>
              <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 24, color: 'white', marginBottom: 10, fontWeight: 700 }}>
                Ready to confirm?
              </div>
              <p style={{ fontFamily: "'Source Serif 4', serif", fontStyle: 'italic', fontSize: 15, color: 'rgba(168,209,231,0.8)', marginBottom: 28, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 28px' }}>
                Approving this quote confirms the scope and pricing. Our team will then prepare your formal agreement for signing — delivered within 24 hours.
              </p>
              {hasBenchmark && (
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#6FCF97', marginBottom: 24 }}>
                  ✓ You&apos;re saving ${totalSavings.toLocaleString()} vs your current setup
                </div>
              )}
              <button
                onClick={approveQuote}
                disabled={approving}
                style={{
                  background: approving ? '#2D5A3D99' : '#2D5A3D',
                  border: '2px solid rgba(111,207,151,0.4)',
                  color: 'white',
                  padding: '16px 48px',
                  borderRadius: 10,
                  cursor: approving ? 'not-allowed' : 'pointer',
                  fontFamily: "'League Spartan', sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(45,90,61,0.4)',
                }}
              >
                {approving ? 'Approving...' : '✓ Approve This Quote'}
              </button>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 16, letterSpacing: '0.1em' }}>
                No payment required at this stage · Agreement follows separately
              </div>
            </div>
          )}

          {isApproved && (
            <div style={{ background: '#F0FAF5', border: '2px solid #2D5A3D', borderRadius: 12, padding: '24px 28px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ color: '#2D5A3D', fontFamily: "'League Spartan', sans-serif", fontSize: 16, fontWeight: 700 }}>
                ✓ Quote Approved
              </div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#4A7A5B', marginTop: 6 }}>
                Our team will have your formal agreement ready within 24 hours.
              </div>
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{ borderTop: '1px solid #F0EDE8', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9CA3AF' }}>
              This quote is valid for 30 days from the date issued.
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#4F87A0' }}>
              {contract.reference}
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 48 }} />
    </div>
  )
}
