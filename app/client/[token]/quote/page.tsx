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
        // API returns the contract directly (with occupants embedded)
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
    // Use token-based API — no auth required on client-facing routes
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
    <div style={{ minHeight: '100vh', background: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#999' }}>Loading quote...</div>
    </div>
  )

  if (!contract) return (
    <div style={{ minHeight: '100vh', background: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#999' }}>Quote not found.</div>
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

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EF', fontFamily: 'Georgia, serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .quote-page { box-shadow: none !important; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Top action bar - no print */}
      <div className="no-print" style={{ background: '#1a1a1a', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#C9A84C', letterSpacing: '0.1em' }}>
          {contract.reference} — Corporate Housing Quote
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyLink} style={{ background: 'transparent', border: '1px solid #ffffff22', color: '#ffffff88', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
            {copied ? '✓ Copied!' : '⎘ Copy Link'}
          </button>
          <button onClick={printQuote} style={{ background: 'transparent', border: '1px solid #C9A84C44', color: '#C9A84C', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
            ↓ Download PDF
          </button>
          {isQuoteSent && !isApproved && (
            <button onClick={approveQuote} disabled={approving} style={{ background: '#C9A84C', border: 'none', color: '#1a1a1a', padding: '7px 20px', borderRadius: 6, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600 }}>
              {approving ? 'Approving...' : '✓ Approve Quote'}
            </button>
          )}
          {isApproved && (
            <div style={{ background: '#4CAF9322', border: '1px solid #4CAF9355', color: '#4CAF93', padding: '7px 16px', borderRadius: 6, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
              ✓ Quote Approved
            </div>
          )}
        </div>
      </div>

      {/* Quote document */}
      <div className="quote-page" style={{ maxWidth: 780, margin: '40px auto', background: 'white', borderRadius: 16, boxShadow: '0 4px 60px rgba(0,0,0,0.10)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#1a1a1a', padding: '40px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: 'white', fontWeight: 400, marginBottom: 6 }}>
              Housing Quote
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#C9A84C', letterSpacing: '0.12em' }}>
              {contract.reference}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#ffffff44', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Prepared for</div>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>{contract.client_name}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#ffffff55', marginTop: 2 }}>{contract.contact_name}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#C9A84C88', marginTop: 2 }}>{fmt(new Date().toISOString().split('T')[0])}</div>
          </div>
        </div>

        <div style={{ padding: '40px 48px' }}>

          {/* Benchmark comparison — only if client provided current rate */}
          {contract.current_housing_rate > 0 && (() => {
            const months = Math.max(1, Math.round(
              (new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime())
              / (1000 * 60 * 60 * 24 * 30)
            ))
            const ersDailyRate = contract.price_per_unit / 30
            const theirRate = contract.current_housing_rate
            const savingsPerUnit = (theirRate - ersDailyRate) * 30 * months
            const totalSavings = savingsPerUnit * contract.units
            const savingsPct = Math.round(((theirRate - ersDailyRate) / theirRate) * 100)
            return (
              <div style={{ marginBottom: 36, background: '#f0faf5', border: '2px solid #4CAF9333', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ background: '#2d6a4f', padding: '14px 24px' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#a8dfbf', letterSpacing: '0.14em' }}>YOUR SAVINGS COMPARISON</div>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                  {/* Current */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                      {contract.current_housing_location ? contract.current_housing_location.split(',')[0] : 'Current Solution'}
                    </div>
                    <div style={{ fontSize: 28, color: '#e74c3c', fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                      ${theirRate}<span style={{ fontSize: 14, color: '#999' }}>/night</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>per room</div>
                  </div>
                  {/* vs */}
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>vs</div>
                    <div style={{ background: '#4CAF9322', border: '2px solid #4CAF93', borderRadius: 8, padding: '8px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, color: '#2d6a4f', fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {savingsPct}% less
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#4CAF93', marginTop: 4 }}>
                        Save ${totalSavings.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {/* ERS */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Elias Range Stays</div>
                    <div style={{ fontSize: 28, color: '#2d6a4f', fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                      ${ersDailyRate.toFixed(0)}<span style={{ fontSize: 14, color: '#999' }}>/night</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>per unit</div>
                  </div>
                </div>
                <div style={{ padding: '0 24px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    ['Single Invoice', 'One invoice per month — all units consolidated', '✓', '#4CAF93'],
                    ['24/7 Support', 'Dedicated support line for your team on-site', '✓', '#4CAF93'],
                    ['Healthcare Focused', 'Properties selected near hospitals & work sites', '✓', '#4CAF93'],
                  ].map(([title, desc, icon, color]) => (
                    <div key={title as string} style={{ background: 'white', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 16, color: color as string, marginBottom: 4 }}>{icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 11, color: '#777', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Booking details */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>Booking Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
              {[
                ['Location', contract.location],
                ['Units', `${contract.units} units`],
                ['Occupants', occupants.map((o: any) => o.name).join(', ') || 'To be confirmed'],
                ['Check-in', fmt(contract.start_date)],
                ['Check-out', fmt(contract.end_date)],
                ['Duration', `${months} month${months > 1 ? 's' : ''}`],
                ['Payment Method', contract.payment_method],
                ['Payment Schedule', contract.payment_schedule || 'Monthly'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 13, color: '#1a1a1a' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing table */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>Pricing Breakdown</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f7f4' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 400 }}>Description</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 400 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f0ebe4' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>
                    Corporate Housing — {contract.units} unit{contract.units > 1 ? 's' : ''} × ${contract.price_per_unit.toLocaleString()}/mo × {months} months
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, fontFamily: 'IBM Plex Mono, monospace' }}>${baseTotal.toLocaleString()}</td>
                </tr>
                {lineItems.filter((li: any) => li.description && li.amount).map((li: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0ebe4' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>{li.description}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, fontFamily: 'IBM Plex Mono, monospace' }}>${li.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {contract.damage_deposit > 0 && (
                  <tr style={{ borderBottom: '1px solid #f0ebe4' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>Damage Deposit (refundable)</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, fontFamily: 'IBM Plex Mono, monospace' }}>${contract.damage_deposit.toLocaleString()}</td>
                  </tr>
                )}
                <tr style={{ background: '#f9f7f4' }}>
                  <td style={{ padding: '16px', fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600 }}>Total</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#C9A84C', fontWeight: 600 }}>${grandTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Inclusions / Exclusions */}
          {(contract.inclusions || contract.exclusions) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              {contract.inclusions && (
                <div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>What's Included</div>
                  <div style={{ background: '#f0faf5', borderRadius: 8, padding: '16px 18px' }}>
                    {contract.inclusions.split('\n').filter(Boolean).map((line: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: '#2d6a4f', marginBottom: 6, display: 'flex', gap: 8 }}>
                        <span>✓</span><span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {contract.exclusions && (
                <div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Not Included</div>
                  <div style={{ background: '#fdf6f0', borderRadius: 8, padding: '16px 18px' }}>
                    {contract.exclusions.split('\n').filter(Boolean).map((line: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: '#7a4a2a', marginBottom: 6, display: 'flex', gap: 8 }}>
                        <span>—</span><span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Special notes */}
          {contract.quote_notes && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Notes & Special Terms</div>
              <div style={{ background: '#f9f7f4', borderRadius: 8, padding: '16px 18px', fontSize: 13, color: '#555', lineHeight: 1.8 }}>
                {contract.quote_notes}
              </div>
            </div>
          )}

          {/* Approve CTA */}
          {isQuoteSent && !isApproved && (
            <div className="no-print" style={{ background: '#fff8e8', border: '2px solid #C9A84C', borderRadius: 12, padding: '24px 28px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 8 }}>Ready to proceed?</div>
              <div style={{ fontSize: 13, color: '#777', marginBottom: 18 }}>Click below to approve this quote. Our team will then prepare your formal agreement for signing.</div>
              <button onClick={approveQuote} disabled={approving} style={{ background: '#C9A84C', border: 'none', color: 'white', padding: '14px 36px', borderRadius: 8, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>
                {approving ? 'Approving...' : '✓ Approve This Quote'}
              </button>
            </div>
          )}

          {isApproved && (
            <div style={{ background: '#f0faf5', border: '2px solid #4CAF93', borderRadius: 12, padding: '20px 28px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ color: '#2d6a4f', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>✓ Quote approved — our team will be in touch shortly with your agreement.</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #f0ebe4', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#bbb' }}>
              This quote is valid for 30 days from the date issued.
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#C9A84C' }}>
              {contract.reference}
            </div>
          </div>

        </div>
      </div>

      <div style={{ height: 48 }} />
    </div>
  )
}

