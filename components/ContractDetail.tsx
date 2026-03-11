'use client'

import { useState, useRef } from 'react'
import { Contract, STAGE_LABELS, STAGE_COLORS, calcTotal, formatDate } from '@/lib/types'

const defaultTerms = `CORPORATE HOUSING AGREEMENT

This Housing Agreement is entered into by and between the Provider and the Client.

1. TERM OF OCCUPANCY
Units are available for the duration stated. Vacate by 11:00 AM on end date. Early termination: 30 days written notice.

2. PAYMENT TERMS
Full payment due by Payment Due Date. 15% late fee after 7 days. Accepted: EFT, Wire Transfer, certified cheque.

3. OCCUPANCY RULES
Units assigned to named occupants only. No subletting. Maximum occupancy per fire code.

4. CONDITION & MAINTENANCE
Units provided in clean, move-in condition. Damages beyond wear and tear charged to account. Maintenance within 48 hours.

5. UTILITIES & AMENITIES
All utilities included (heat, water, electricity, internet). Parking as specified. Laundry on-site.

6. LIABILITY
Provider not responsible for personal belongings. Renter's insurance advised.

7. GOVERNING LAW
Governed by laws of British Columbia. Disputes via arbitration in Vancouver, BC.`

interface Props {
  contract: Contract
  onUpdate: (id: string, patch: Partial<Contract>, auditMsg?: string) => Promise<void>
  onRefresh: () => Promise<void>
  showToast: (msg: string, type?: string) => void
}

export default function ContractDetail({ contract: c, onUpdate, onRefresh, showToast }: Props) {
  const [tab, setTab] = useState('overview')
  const [clientSig, setClientSig] = useState(c.client_sig || '')
  const [providerSig, setProviderSig] = useState(c.provider_sig || '')
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const occupants = (c as any).occupants || []
  const auditLogs = [...((c as any).audit_logs || [])].reverse()
  const total = calcTotal(c)

  const advance = async () => {
    if (c.stage < 8) {
      const next = c.stage + 1
      await onUpdate(c.id, { stage: next }, `Stage advanced to: ${STAGE_LABELS[next]}`)
      showToast(`Advanced to ${STAGE_LABELS[next]}`)
    }
  }

  const applyClientSig = async () => {
    await onUpdate(c.id, { client_sig: clientSig }, `Provider applied client signature: ${clientSig}`)
    showToast('Client signature applied')
  }

  const applyProviderSig = async () => {
    await onUpdate(c.id, { provider_sig: providerSig }, `Provider signed: ${providerSig}`)
    showToast('Provider signature applied')
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`/api/contracts/${c.id}/upload`, { method: 'POST', body: form })
    const data = await res.json()
    if (data.url) showToast(`Contract uploaded: ${file.name}`)
    else showToast('Upload failed', 'error')
    await onRefresh()
    setUploading(false)
  }

  const clientPortalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/client/${c.client_token}`
    : `/client/${c.client_token}`

  const copyPortalLink = () => {
    navigator.clipboard.writeText(clientPortalUrl)
    showToast('Client portal link copied')
  }

  return (
    <div style={{ padding: '28px 36px' }}>
      <style>{`
        .card { background: #13161D; border: 1px solid #ffffff0D; border-radius: 10px; }
        .card-accent { background: #13161D; border: 1px solid #C9A84C2A; border-radius: 10px; }
        .btn { border: none; border-radius: 7px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.07em; padding: 10px 20px; transition: all 0.18s; }
        .btn-gold { background: #C9A84C; color: #0C0E14; font-weight: 500; }
        .btn-gold:hover { background: #DDB85C; }
        .btn-ghost { background: transparent; color: #C9A84C; border: 1px solid #C9A84C44; }
        .btn-ghost:hover { background: #C9A84C11; border-color: #C9A84C; }
        .btn-red { background: #c0392b18; color: #e74c3c; border: 1px solid #e74c3c33; }
        .btn-sm { padding: 6px 14px; font-size: 11px; }
        .inp { background: #0C0E14; border: 1px solid #ffffff15; border-radius: 7px; padding: 9px 13px; color: #DDD5C8; font-size: 13px; font-family: 'IBM Plex Mono', monospace; outline: none; transition: border 0.2s; width: 100%; }
        .inp:focus { border-color: #C9A84C55; }
        .inp-sig { background: #0C0E14; border: 1px solid #4C7BC955; border-radius: 7px; padding: 10px 14px; color: #7BA7E2; font-size: 20px; font-family: 'Playfair Display', serif; font-style: italic; outline: none; width: 100%; transition: border 0.2s; }
        .inp-sig:focus { border-color: #4C7BC9; }
        .lbl { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #ffffff33; }
        .row-data { display: flex; justify-content: space-between; align-items: baseline; padding: 9px 0; border-bottom: 1px solid #ffffff07; gap: 12px; }
        .row-data:last-child { border-bottom: none; }
        .tab { padding: 8px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.18s; color: #ffffff33; }
        .tab.on { color: #C9A84C; border-bottom-color: #C9A84C; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .drop-zone { border: 2px dashed #C9A84C44; border-radius: 10px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .drop-zone:hover, .drop-zone.over { border-color: #C9A84C; background: #C9A84C08; }
        .audit-row { display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid #ffffff07; font-size: 12px; }
        .team-step { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 8px; margin-bottom: 10px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 13px; font-style: italic; color: #C9A84C88; margin-bottom: 12px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: '#C9A84C', marginBottom: 4 }}>{c.reference}</div>
          <div className="pf" style={{ fontSize: 26 }}>{c.client_name}</div>
          <div className="mono" style={{ fontSize: 11, color: '#ffffff44', marginTop: 2 }}>{c.contact_name} · {c.contact_email}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ background: `${STAGE_COLORS[c.stage]}18`, border: `1px solid ${STAGE_COLORS[c.stage]}44`, color: STAGE_COLORS[c.stage], padding: '6px 14px', borderRadius: 20, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
            {STAGE_LABELS[c.stage]}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={copyPortalLink}>⎘ Copy Client Link</button>
          <a href={clientPortalUrl} target="_blank" rel="noreferrer"><button className="btn btn-ghost btn-sm">↗ Client Portal</button></a>
          {c.stage < 8 && <button className="btn btn-gold btn-sm" onClick={advance}>Advance Stage →</button>}
        </div>
      </div>

      {/* Stage pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 22 }}>
        {Object.entries(STAGE_LABELS).map(([i, label]) => {
          const idx = parseInt(i)
          return (
            <div key={i} className="mono" style={{
              fontSize: 9, padding: '4px 10px', borderRadius: 3, letterSpacing: '0.08em',
              background: idx === c.stage ? `${STAGE_COLORS[idx]}22` : idx < c.stage ? '#4CAF9315' : '#ffffff06',
              border: `1px solid ${idx === c.stage ? STAGE_COLORS[idx] + '66' : idx < c.stage ? '#4CAF9333' : '#ffffff0A'}`,
              color: idx === c.stage ? STAGE_COLORS[idx] : idx < c.stage ? '#4CAF9388' : '#ffffff22',
            }}>
              {idx < c.stage ? '✓ ' : ''}{label}
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ffffff0D', marginBottom: 22 }}>
        {['overview','signing','contract','handoff','audit'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Overview' : t === 'signing' ? 'Signatures' : t === 'contract' ? 'Contract' : t === 'handoff' ? 'Team Handoff' : 'Audit Trail'}
          </div>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="grid2">
          <div>
            <div className="card-accent" style={{ padding: '20px 22px', marginBottom: 14 }}>
              <div className="section-title">Booking Details</div>
              <div className="row-data"><span className="lbl">Location</span><span style={{ fontSize: 13, textAlign: 'right' }}>{c.location}</span></div>
              <div className="row-data"><span className="lbl">Units</span><span style={{ fontSize: 13 }}>{c.units} units</span></div>
              <div className="row-data"><span className="lbl">Check-in</span><span style={{ fontSize: 13 }}>{formatDate(c.start_date)}</span></div>
              <div className="row-data"><span className="lbl">Check-out</span><span style={{ fontSize: 13 }}>{formatDate(c.end_date)}</span></div>
              {occupants.length > 0 && <div className="row-data"><span className="lbl">Occupants</span><span style={{ fontSize: 12, textAlign: 'right', maxWidth: '55%' }}>{occupants.map((o: any) => o.name).join(', ')}</span></div>}
            </div>
            {c.notes && <div className="card" style={{ padding: '14px 18px' }}>
              <div className="lbl" style={{ marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 12, color: '#ffffff66', lineHeight: 1.6 }}>{c.notes}</div>
            </div>}
          </div>
          <div>
            <div className="card" style={{ padding: '20px 22px', marginBottom: 14 }}>
              <div className="section-title">Financials</div>
              <div className="row-data"><span className="lbl">Rate / Unit</span><span style={{ fontSize: 13 }}>${c.price_per_unit.toLocaleString()} / mo</span></div>
              <div className="row-data"><span className="lbl">Units</span><span style={{ fontSize: 13 }}>{c.units}</span></div>
              <div className="row-data"><span className="lbl">Payment Due</span><span style={{ fontSize: 13 }}>{formatDate(c.payment_due)}</span></div>
              <div className="row-data"><span className="lbl">Method</span><span style={{ fontSize: 13 }}>{c.payment_method}</span></div>
              <div style={{ borderTop: '1px solid #C9A84C22', marginTop: 10, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="pf" style={{ fontSize: 14, color: '#C9A84C88' }}>Total</span>
                <span className="pf" style={{ fontSize: 26, color: '#C9A84C' }}>${total.toLocaleString()}</span>
              </div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div className="section-title">Signature Status</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['Client', c.client_sig, c.contact_name], ['Provider', c.provider_sig, 'Your team']].map(([label, sig, name]) => (
                  <div key={label as string} style={{ flex: 1, padding: '10px 12px', borderRadius: 7, background: sig ? '#4CAF9310' : '#ffffff06', border: `1px solid ${sig ? '#4CAF9333' : '#ffffff10'}` }}>
                    <div className="lbl">{label}</div>
                    <div style={{ fontSize: 12, marginTop: 4, color: sig ? '#4CAF93' : '#ffffff33' }}>{sig ? `✓ ${sig}` : 'Pending'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIGNING */}
      {tab === 'signing' && (
        <div>
          {/* Signature status cards */}
          <div className="grid2" style={{ marginBottom: 14 }}>
            {[
              { label: 'Client Signature', sub: `${c.contact_name} · ${c.client_name}`, sig: c.client_sig },
              { label: 'Provider Signature', sub: 'Authorized Representative', sig: c.provider_sig },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: 22, border: s.sig ? '1px solid #4CAF9333' : '1px solid #ffffff0D' }}>
                <div className="lbl" style={{ marginBottom: 4 }}>{s.label}</div>
                <div className="mono" style={{ fontSize: 11, color: '#ffffff33', marginBottom: 14 }}>{s.sub}</div>
                {s.sig ? (
                  <div style={{ borderTop: '1px solid #4CAF9333', paddingTop: 12 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 26, color: '#4CAF93' }}>{s.sig}</div>
                    <div className="mono" style={{ fontSize: 10, color: '#4CAF9366', marginTop: 6 }}>✓ Signed via DocuSeal</div>
                  </div>
                ) : (
                  <div className="mono" style={{ fontSize: 11, color: '#ffffff22' }}>Awaiting signature</div>
                )}
              </div>
            ))}
          </div>

          {/* DocuSeal send button */}
          {!(c as any).docuseal_submission_id && !c.client_sig && (
            <div className="card" style={{ padding: 22, marginBottom: 14 }}>
              <div className="section-title">Send for Signing via DocuSeal</div>
              <div style={{ fontSize: 13, color: '#ffffff55', marginBottom: 16, lineHeight: 1.7 }}>
                This will generate the contract document, automatically add signature fields for both parties, and send the client an email with a signing link. You'll be notified to countersign once they've completed their signature.
              </div>
              <button className="btn btn-gold" onClick={async () => {
                const res = await fetch('/api/docuseal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contract_id: c.id }),
                })
                const data = await res.json()
                if (data.success) {
                  showToast('DocuSeal signing request sent to client')
                  onRefresh()
                } else {
                  showToast('DocuSeal error — check console', 'error')
                  console.error(data)
                }
              }}>
                Send Contract for Signing →
              </button>
            </div>
          )}

          {/* DocuSeal sent confirmation */}
          {(c as any).docuseal_submission_id && !c.client_sig && (
            <div style={{ background: '#4C7BC915', border: '1px solid #4C7BC955', borderRadius: 8, padding: '14px 18px', color: '#7BA7E2', fontFamily: 'IBM Plex Mono', fontSize: 12, marginBottom: 14 }}>
              ✉ Signing request sent via DocuSeal. Waiting for client to sign. They will receive a reminder email automatically.
            </div>
          )}

          {/* Fully executed */}
          {c.client_sig && c.provider_sig && (
            <div style={{ background: '#4CAF9310', border: '1px solid #4CAF9333', borderRadius: 8, padding: '14px 18px', color: '#4CAF93', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
              ✓ Agreement fully executed by both parties via DocuSeal.
              {c.contract_file_url && (
                <div style={{ marginTop: 10 }}>
                  <a href={c.contract_file_url} target="_blank" rel="noreferrer">
                    <button className="btn btn-ghost btn-sm">↓ Download Signed Document</button>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTRACT */}
      {tab === 'contract' && (
        <div>
          <div className="card" style={{ padding: 22, marginBottom: 14 }}>
            <div className="section-title">Upload Contract Document</div>
            {c.contract_file_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#4CAF9310', border: '1px solid #4CAF9333', borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>Contract on file</div>
                  <a href={c.contract_file_url} target="_blank" rel="noreferrer" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4CAF93' }}>View document ↗</a>
                </div>
                <button className="btn btn-red btn-sm" onClick={() => onUpdate(c.id, { contract_file_url: null }, 'Contract document removed')}>Remove</button>
              </div>
            ) : (
              <div className={`drop-zone ${isDragOver ? 'over' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
                onClick={() => fileRef.current?.click()}>
                <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#C9A84C' }}>{uploading ? 'Uploading...' : 'Drop contract file or click to browse'}</div>
                <div className="lbl" style={{ marginTop: 6 }}>PDF, DOC, DOCX</div>
              </div>
            )}
          </div>
          <div className="card" style={{ padding: 22 }}>
            <div className="section-title">Standard Terms</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff44', lineHeight: 1.9, whiteSpace: 'pre-wrap', maxHeight: 340, overflowY: 'auto' }}>{defaultTerms}</div>
          </div>
        </div>
      )}

      {/* HANDOFF */}
      {tab === 'handoff' && (
        <div>
          {[
            { stage: 5, title: 'Operations Lead', person: 'Taylor Morrison', role: 'Ops Lead', icon: '⚙️', color: '#9B59B6', desc: 'Review signed contract, assign property manager, confirm unit availability.' },
            { stage: 6, title: 'Logistics Team', person: 'Devon Park', role: 'Logistics Mgr', icon: '🚚', color: '#E67E22', desc: 'Coordinate move-in kits, key handoff, parking, and unit inspection.' },
            { stage: 7, title: 'Guest Services', person: 'Amara Osei', role: 'Guest Services', icon: '🤝', color: '#27AE60', desc: 'Send welcome package, set up support channel, schedule check-in walkthrough.' },
          ].map(t => {
            const isDone = c.stage > t.stage
            const isActive = c.stage === t.stage
            const isPending = c.stage < t.stage
            return (
              <div key={t.stage} className="team-step" style={{
                background: isActive ? '#13161D' : isDone ? '#4CAF9309' : 'transparent',
                border: `1px solid ${isActive ? '#C9A84C22' : isDone ? '#4CAF9322' : '#ffffff08'}`,
                opacity: isPending ? 0.35 : 1,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${t.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14 }}>{t.title}</span>
                    {isDone && <span className="mono" style={{ fontSize: 10, color: '#4CAF93' }}>✓ Complete</span>}
                    {isActive && <span className="mono" style={{ fontSize: 10, color: t.color }}>● Active</span>}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: '#ffffff33', marginBottom: 2 }}>{t.person} · {t.role}</div>
                  <div style={{ fontSize: 12, color: '#ffffff55' }}>{t.desc}</div>
                </div>
                {isActive && <button className="btn btn-gold btn-sm" onClick={async () => { await onUpdate(c.id, { stage: t.stage + 1 }, `${t.title} marked complete`); showToast(`${t.title} complete`) }}>Mark Complete →</button>}
              </div>
            )
          })}
        </div>
      )}

      {/* AUDIT */}
      {tab === 'audit' && (
        <div className="card" style={{ padding: 22 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Full Audit Trail</div>
          {auditLogs.length === 0 && <div className="mono" style={{ fontSize: 11, color: '#ffffff33' }}>No audit logs yet</div>}
          {auditLogs.map((a: any, i: number) => (
            <div key={i} className="audit-row">
              <div className="mono" style={{ fontSize: 10, color: '#ffffff33', minWidth: 150 }}>{new Date(a.created_at).toLocaleString('en-CA')}</div>
              <div style={{ minWidth: 80, fontSize: 11, color: '#C9A84C88' }}>{a.actor}</div>
              <div style={{ fontSize: 12 }}>{a.action}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
