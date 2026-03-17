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
      <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#9CA3AF' }}>Loading quote...</div>
    </div>
  )

  if (!contract) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#9CA3AF' }}>Quote not found.</div>
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

      {/* Top nav bar */}
      <div className="no-print" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#1B4353',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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

      {/* Quote document */}
      <div className="quote-page" style={{ maxWidth: 780, margin: '40px auto', background: 'white', borderRadius: 16, boxShadow: '0 4px 60px rgba(0,0,0,0.10)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#1B4353', padding: '40px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <img src="/logo-v2.png" alt="Elias Range Stays" style={{ height: 36, marginBottom: 16, display: 'block' }} />
            <h1 style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 32, color: 'white', fontWeight: 700, marginBottom: 6, margin: 0 }}>
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
          </div>
        </div>

        <div style={{ padding: '40px 48px' }}>

          {/* Benchmark comparison */}
          {contract.current_housing_rate > 0 && (() => {
            const ersDailyRate = contract.price_per_unit / 30
            const theirRate = contract.current_housing_rate
            const savingsPerUnit = (theirRate - ersDailyRate) * 30 * months
            const totalSavings = savingsPerUnit * contract.units
            const savingsPct = Math.round(((theirRate - ersDailyRate) / theirRate) * 100)
            return (
              <div style={{ marginBottom: 36, background: '#F0FAF5', border: '2px solid rgba(45,90,61,0.2)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ background: '#2D5A3D', padding: '14px 24px' }}>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#A8DFC0', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Your Savings Comparison</div>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                      {contract.current_housing_location ? contract.current_housing_location.split(',')[0] : 'Current Solution'}
                    </div>
                    <div style={{ fontSize: 28, color: '#DC2626', fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}>
                      ${theirRate}<span style={{ fontSize: 14, color: '#9CA3AF' }}>/night</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>per room</div>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>vs</div>
                    <div style={{ background: 'rgba(45,90,61,0.1)', border: '2px solid #2D5A3D', borderRadius: 8, padding: '8px 16px' }}>
                      <div style={{ fontSize: 22, color: '#2D5A3D', fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}>
                        {savingsPct}% less
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#2D5A3D', marginTop: 4 }}>
                        Save ${totalSavings.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Elias Range Stays</div>
                    <div style={{ fontSize: 28, color: '#2D5A3D', fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}>
                      ${ersDailyRate.toFixed(0)}<span style={{ fontSize: 14, color: '#9CA3AF' }}>/night</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>per unit</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Booking details */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>Booking Details</div>
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
                  <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#1A1A1A' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing table */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>Pricing Breakdown</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F7F7F5' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 400 }}>Description</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 400 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F0EDE8' }}>
                  <td style={{ padding: '14px 16px', fontFamily: "'Source Serif 4', serif", fontSize: 14, color: '#1A1A1A' }}>
                    Corporate Housing — {contract.units} unit{contract.units > 1 ? 's' : ''} × ${contract.price_per_unit.toLocaleString()}/mo × {months} months
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
                  <td style={{ padding: '16px', textAlign: 'right', fontFamily: "'League Spartan', sans-serif", fontSize: 24, color: '#1B4353', fontWeight: 700 }}>${grandTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Inclusions / Exclusions */}
          {(contract.inclusions || contract.exclusions) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              {contract.inclusions && (
                <div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>What&apos;s Included</div>
                  <div style={{ background: '#F0FAF5', borderRadius: 8, padding: '16px 18px' }}>
                    {contract.inclusions.split('\n').filter(Boolean).map((line: string, i: number) => (
                      <div key={i} style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#2D5A3D', marginBottom: 6, display: 'flex', gap: 8 }}>
                        <span>✓</span><span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {contract.exclusions && (
                <div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Not Included</div>
                  <div style={{ background: '#FEF9F0', borderRadius: 8, padding: '16px 18px' }}>
                    {contract.exclusions.split('\n').filter(Boolean).map((line: string, i: number) => (
                      <div key={i} style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#92400E', marginBottom: 6, display: 'flex', gap: 8 }}>
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
              <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Notes &amp; Special Terms</div>
              <div style={{ background: '#F7F7F5', borderRadius: 8, padding: '16px 18px', fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#555', lineHeight: 1.8 }}>
                {contract.quote_notes}
              </div>
            </div>
          )}

          {/* Approve CTA */}
          {isQuoteSent && !isApproved && (
            <div className="no-print" style={{ background: '#EBF4F8', border: '2px solid #4F87A0', borderRadius: 12, padding: '28px 32px', textAlign: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 20, color: '#1B4353', marginBottom: 8, fontWeight: 700 }}>
                Ready to proceed?
              </h3>
              <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 1.7 }}>
                Click below to approve this quote. Our team will then prepare your formal agreement for signing.
              </p>
              <button
                onClick={approveQuote}
                disabled={approving}
                style={{
                  background: '#1B4353',
                  border: 'none',
                  color: 'white',
                  padding: '14px 36px',
                  borderRadius: 8,
                  cursor: approving ? 'not-allowed' : 'pointer',
                  fontFamily: "'League Spartan', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {approving ? 'Approving...' : '✓ Approve This Quote'}
              </button>
            </div>
          )}

          {isApproved && (
            <div style={{ background: '#F0FAF5', border: '2px solid #2D5A3D', borderRadius: 12, padding: '20px 28px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ color: '#2D5A3D', fontFamily: "'League Spartan', sans-serif", fontSize: 14, fontWeight: 600 }}>
                ✓ Quote approved — our team will be in touch shortly with your agreement.
              </div>
            </div>
          )}

          {/* Footer */}
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
