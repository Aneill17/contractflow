'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Contract, calcTotal, formatDate } from '@/lib/types'

const defaultTerms = `CORPORATE HOUSING AGREEMENT

This Housing Agreement is entered into by and between the Provider and the Client identified in the Booking Summary.

1. TERM OF OCCUPANCY
The Provider agrees to make available the specified units for the duration stated. Units are to be vacated by 11:00 AM on the end date. Early termination requires 30 days written notice.

2. PAYMENT TERMS
Full payment is due by the Payment Due Date. A 15% late fee applies after 7 days. Accepted methods: EFT, Wire Transfer, certified cheque.

3. OCCUPANCY RULES
Units are assigned to named occupants only. Subletting is strictly prohibited. Maximum occupancy per unit is enforced per local fire code.

4. CONDITION & MAINTENANCE
Occupants accept units in clean, move-in condition. Damages beyond normal wear and tear will be charged to the corporate account. Maintenance requests addressed within 48 hours.

5. UTILITIES & AMENITIES
All utilities (heat, water, electricity, internet) are included. Parking included as specified. Laundry available on-site.

6. LIABILITY
Provider is not responsible for personal belongings. Occupants are advised to maintain personal renter's insurance.

7. GOVERNING LAW
This Agreement is governed by the laws of British Columbia, Canada. Disputes resolved through arbitration in Vancouver, BC.`

export default function ClientPortalPage() {
  const { token } = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sig, setSig] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchContract = async () => {
    const res = await fetch(`/api/client/${token}`)
    if (!res.ok) { setNotFound(true); setLoading(false); return }
    const data = await res.json()
    setContract(data)
    setSig(data.client_sig || '')
    setLoading(false)
  }

  useEffect(() => { fetchContract() }, [token])

  const patch = async (body: object, msg?: string) => {
    setSaving(true)
    await fetch(`/api/client/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, audit_action: msg }),
    })
    await fetchContract()
    setSaving(false)
  }

  const approveQuote = async () => {
    await patch({ stage: Math.max(contract!.stage, 2) }, `Client approved quote${note ? `: "${note}"` : ''}`)
    showToast('Quote approved — confirmation details sent to your email')
  }

  const signContract = async () => {
    await patch({ client_sig: sig, stage: Math.max(contract!.stage, 4) }, `Client signed contract: ${sig}`)
    showToast('Contract signed successfully')
  }

  if (loading) return (
    <div style={{ background: '#F7F4EF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#999' }}>
      Loading your contract...
    </div>
  )

  if (notFound) return (
    <div style={{ background: '#F7F4EF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
      <div>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 20, marginBottom: 8 }}>Contract not found</div>
        <div style={{ fontSize: 13, color: '#999' }}>This link may have expired or been revoked.</div>
      </div>
    </div>
  )

  if (!contract) return null

  const total = calcTotal(contract)
  const occupants = (contract as any).occupants || []
  const step = contract.stage <= 1 ? 'quote' : contract.client_sig ? 'complete' : 'contract'

  return (
    <div style={{ background: '#F7F4EF', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#1a1a1a' }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        .cp-card { background: white; border-radius: 12px; box-shadow: 0 2px 24px rgba(0,0,0,0.07); padding: 32px; margin-bottom: 20px; }
        .cp-row { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-bottom: 1px solid #f0ebe4; font-size: 14px; gap: 12px; }
        .cp-row:last-child { border-bottom: none; }
        .cp-lbl { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #999; flex-shrink: 0; }
        .cp-btn { border: none; border-radius: 8px; padding: 12px 28px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.07em; transition: all 0.18s; }
        .cp-btn-gold { background: #C9A84C; color: white; font-weight: 500; }
        .cp-btn-gold:hover { background: #B8973B; }
        .cp-btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }
        .cp-btn-outline { background: transparent; border: 1px solid #C9A84C55; color: #C9A84C; }
        .cp-btn-outline:hover { background: #C9A84C11; }
        .cp-sig { background: #f9f7f4; border: 1px solid #C9A84C44; border-radius: 8px; padding: 12px 16px; font-family: 'Playfair Display', serif; font-style: italic; font-size: 22px; color: #2c5282; width: 100%; outline: none; transition: border 0.2s; }
        .cp-sig:focus { border-color: #C9A84C; }
        .cp-inp { background: #f9f7f4; border: 1px solid #e0d9d0; border-radius: 8px; padding: 10px 14px; font-size: 13px; width: 100%; outline: none; font-family: Georgia, serif; resize: vertical; min-height: 72px; }
        .toast-bar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1a1a1a; color: #4CAF93; padding: 12px 24px; border-radius: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; animation: fadeIn 0.3s; z-index: 999; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>

      {toast && <div className="toast-bar">✓ {toast}</div>}

      {/* Header */}
      <div style={{ background: '#1a1a1a', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#DDD5C8' }}>Contract<span style={{ color: '#C9A84C' }}>Flow</span></div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#ffffff33', letterSpacing: '0.15em', marginTop: 1 }}>CLIENT PORTAL</div>
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#ffffff44' }}>{contract.reference}</div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '36px 20px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 400, marginBottom: 4 }}>
            Hello, {contract.contact_name.split(' ')[0]}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#999' }}>{contract.client_name} · {contract.reference}</div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', borderBottom: '2px solid #ece7df', marginBottom: 28 }}>
          {[['quote','1. Quote Review'], ['contract','2. Sign Contract'], ['complete','3. Complete']].map(([k, l]) => (
            <div key={k} style={{ padding: '8px 20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.08em', borderBottom: step === k ? '2px solid #C9A84C' : '2px solid transparent', marginBottom: -2, color: step === k ? '#C9A84C' : '#999' }}>{l}</div>
          ))}
        </div>

        {/* QUOTE */}
        {step === 'quote' && (
          <>
            <div className="cp-card">
              <div className="cp-lbl" style={{ marginBottom: 16 }}>Your Housing Quote</div>
              <div className="cp-row"><span className="cp-lbl">Location</span><span>{contract.location}</span></div>
              <div className="cp-row"><span className="cp-lbl">Units</span><span>{contract.units} units</span></div>
              {occupants.length > 0 && <div className="cp-row"><span className="cp-lbl">Occupants</span><span style={{ textAlign: 'right' }}>{occupants.map((o: any) => o.name).join(', ')}</span></div>}
              <div className="cp-row"><span className="cp-lbl">Check-in</span><span>{formatDate(contract.start_date)}</span></div>
              <div className="cp-row"><span className="cp-lbl">Check-out</span><span>{formatDate(contract.end_date)}</span></div>
              <div className="cp-row"><span className="cp-lbl">Rate / Unit</span><span>${contract.price_per_unit.toLocaleString()} / mo</span></div>
              <div style={{ borderTop: '2px solid #C9A84C22', marginTop: 12, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", color: '#C9A84C88', fontSize: 15 }}>Total</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#C9A84C' }}>${total.toLocaleString()}</span>
              </div>
              {contract.notes && <div style={{ marginTop: 14, padding: '10px 14px', background: '#f9f7f4', borderRadius: 8, fontSize: 12, color: '#777' }}>{contract.notes}</div>}
            </div>
            <div className="cp-card">
              <div className="cp-lbl" style={{ marginBottom: 10 }}>Questions or adjustments?</div>
              <textarea className="cp-inp" placeholder="Any requests or changes before approving..." value={note} onChange={e => setNote(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
                <button className="cp-btn cp-btn-outline" disabled={saving} onClick={() => { patch({}, `Client requested changes: ${note || 'no details'}`); showToast('Change request sent to your account manager') }}>Request Changes</button>
                <button className="cp-btn cp-btn-gold" disabled={saving} onClick={approveQuote}>Approve Quote ✓</button>
              </div>
            </div>
          </>
        )}

        {/* CONTRACT */}
        {step === 'contract' && (
          <>
            <div className="cp-card">
              <div style={{ background: '#f0faf5', border: '1px solid #4CAF9333', borderRadius: 8, padding: '12px 16px', color: '#2d8a60', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, marginBottom: 20 }}>
                ✓ Quote approved. Payment details have been sent to {contract.contact_email}.
              </div>
              <div className="cp-lbl" style={{ marginBottom: 12 }}>Contract Terms</div>
              <div style={{ background: '#f9f7f4', borderRadius: 8, padding: '16px 18px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#777', lineHeight: 1.9, maxHeight: 260, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {contract.contract_file_url ? `Custom contract on file: ${contract.contract_file_url}\n\nPlease download and review the attached document.` : defaultTerms}
              </div>
            </div>
            <div className="cp-card">
              <div className="cp-lbl" style={{ marginBottom: 4 }}>Your Signature</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#999', marginBottom: 14 }}>{contract.contact_name} · {contract.client_name}</div>
              {!contract.client_sig ? (
                <>
                  <input className="cp-sig" placeholder="Type your full legal name..." value={sig} onChange={e => setSig(e.target.value)} />
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#bbb', margin: '8px 0 16px' }}>By signing, you agree to all terms above. This constitutes a legally binding e-signature.</div>
                  <button className="cp-btn cp-btn-gold" disabled={sig.length < 3 || saving} onClick={signContract} style={{ width: '100%' }}>Sign Contract →</button>
                </>
              ) : (
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 28, color: '#2c5282', borderBottom: '1px solid #4C7BC933', paddingBottom: 8 }}>{contract.client_sig}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#4CAF93', marginTop: 8 }}>✓ Signed — awaiting provider countersignature</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* COMPLETE */}
        {step === 'complete' && (
          <div className="cp-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#2d8a60', marginBottom: 8 }}>You're all set</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#999', marginBottom: 28 }}>
              Contract {contract.reference} is confirmed. Your team will receive check-in details ahead of {formatDate(contract.start_date)}.
            </div>
            <div style={{ background: '#f9f7f4', borderRadius: 10, padding: 20, textAlign: 'left', marginBottom: 24 }}>
              <div className="cp-row"><span className="cp-lbl">Location</span><span>{contract.location}</span></div>
              <div className="cp-row"><span className="cp-lbl">Check-in</span><span>{formatDate(contract.start_date)}</span></div>
              <div className="cp-row"><span className="cp-lbl">Occupants</span><span>{occupants.map((o: any) => o.name).join(', ')}</span></div>
              <div className="cp-row"><span className="cp-lbl">Reference</span><span style={{ fontFamily: 'monospace' }}>{contract.reference}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
