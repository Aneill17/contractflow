'use client'

import { useState, useEffect, useRef } from 'react'
import React from 'react'
import dynamic from 'next/dynamic'
import { Contract, STAGE_LABELS, STAGE_COLORS, calcTotal, calcMonths, formatDate } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/components/UserRoleContext'
import ContractUnitsTab from '@/components/ContractUnitsTab'

// Lazy-load PDF button — browser only
const ContractPDFButton = dynamic(() => import('./ContractPDFButton'), {
  ssr: false,
  loading: () => null,
})

const getAuthHeader = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

interface Props {
  contract: Contract
  onUpdate: (id: string, patch: Partial<Contract>, auditMsg?: string) => Promise<void>
  onRefresh: () => Promise<void>
  showToast: (msg: string, type?: string) => void
}

// ── Contract text renderer (markdown-like → styled HTML) ─────
function renderContractMarkdown(text: string): JSX.Element {
  const docStyle: React.CSSProperties = {
    background: '#FAFAF8',
    color: '#1a1a1a',
    fontFamily: 'Georgia, serif',
    fontSize: 13,
    lineHeight: 1.8,
    padding: '40px 44px',
    borderRadius: 10,
    maxWidth: 760,
    overflowY: 'auto' as const,
    maxHeight: 640,
    border: '1px solid #e8e2d9',
  }
  const headingStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 9,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    color: '#1B4353',
    margin: '22px 0 8px',
    paddingBottom: 4,
    borderBottom: '1px solid #1B435333',
  }
  const h1Style: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: 22,
    fontWeight: 400,
    color: '#1a1a1a',
    borderBottom: '2px solid #C4793A',
    paddingBottom: 10,
    marginBottom: 20,
    marginTop: 0,
  }
  const paraStyle: React.CSSProperties = {
    margin: '4px 0',
    color: '#2a2a2a',
  }

  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let tableBuffer: string[] = []
  let inTable = false

  const flushTable = (key: string) => {
    if (!tableBuffer.length) return
    const rows = tableBuffer.map(r => r.split('|').map(c => c.trim()).filter(c => c !== ''))
    const isHeader = (row: string[]) => row.every(c => /^[-:]+$/.test(c))
    const dataRows = rows.filter(r => !isHeader(r))
    elements.push(
      <table key={key} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, margin: '12px 0' }}>
        {dataRows.map((row, ri) => (
          <tr key={ri} style={{ borderBottom: '1px solid #e8e2d9', background: ri === 0 ? '#f5f0e8' : ri % 2 === 0 ? '#fafaf8' : '#fff' }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: '7px 10px', fontFamily: ri === 0 ? "'IBM Plex Mono', monospace" : 'Georgia, serif', fontSize: ri === 0 ? 10 : 12, fontWeight: ri === 0 ? 600 : 400, color: ri === 0 ? '#1B4353' : '#1a1a1a', borderRight: ci < row.length - 1 ? '1px solid #e8e2d9' : 'none' }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </table>
    )
    tableBuffer = []
    inTable = false
  }

  const renderInline = (line: string, key: string | number): JSX.Element => {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    if (parts.length === 1) return <span key={key}>{line}</span>
    return (
      <span key={key}>
        {parts.map((p, i) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={i} style={{ color: '#1a1a1a' }}>{p.slice(2, -2)}</strong>
            : <span key={i}>{p}</span>
        )}
      </span>
    )
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('|')) {
      if (!inTable) { inTable = true; tableBuffer = [] }
      tableBuffer.push(trimmed)
      return
    } else if (inTable) {
      flushTable(`tbl-${i}`)
    }

    if (!trimmed) {
      elements.push(<div key={i} style={{ height: 6 }} />)
      return
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={i} style={h1Style}>{trimmed.slice(2)}</h1>)
      return
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<div key={i} style={headingStyle}>{trimmed.slice(3)}</div>)
      return
    }
    if (/^---+$/.test(trimmed)) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #e8e2d9', margin: '12px 0' }} />)
      return
    }
    if (/signature|signed by|__+/i.test(trimmed)) {
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, margin: '6px 0' }}>
          <p style={{ ...paraStyle, marginBottom: 0 }}>{renderInline(trimmed, `il-${i}`)}</p>
          <div style={{ flex: 1, borderBottom: '1px solid #555', minWidth: 120, maxWidth: 220, marginBottom: 2 }} />
        </div>
      )
      return
    }
    elements.push(<p key={i} style={paraStyle}>{renderInline(trimmed, `il-${i}`)}</p>)
  })

  if (inTable) flushTable('tbl-end')

  return <div style={docStyle}>{elements}</div>
}

// ── TAB: Request Review ──────────────────────────────────────
function RequestTab({ contract: c }: { contract: Contract }) {
  const occupants = (c as any).occupants || []
  return (
    <div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Booking Request</div>
        <div style={styles.grid2}>
          {[
            ['Company', c.client_name],
            ['Contact', c.contact_name],
            ['Email', c.contact_email],
            ['Phone', c.contact_phone || '—'],
            ['Location', c.location],
            ['Units Requested', `${c.units} unit${c.units > 1 ? 's' : ''}`],
            ['Check-in', formatDate(c.start_date)],
            ['Check-out', formatDate(c.end_date)],
            ['Duration', `${calcMonths(c)} months`],
            ['Payment Method', c.payment_method],
          ].map(([l, v]) => (
            <div key={l} style={{ marginBottom: 14 }}>
              <div style={styles.lbl}>{l}</div>
              <div style={{ fontSize: 14, color: '#334155' }}>{v}</div>
            </div>
          ))}
        </div>
        {occupants.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e8ecf0' }}>
            <div style={styles.lbl}>Occupants</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {occupants.map((o: any, i: number) => (
                <div key={i} style={{ background: 'rgba(0,191,166,0.08)', border: '1px solid rgba(0,191,166,0.25)', borderRadius: 6, padding: '5px 12px', fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#0B2540' }}>
                  {o.name}
                </div>
              ))}
            </div>
          </div>
        )}
        {c.notes && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e8ecf0' }}>
            <div style={styles.lbl}>Notes from Client</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginTop: 6 }}>{c.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TAB: Quote Builder ──────────────────────────────────────
function QuoteTab({ contract: c, onUpdate, onRefresh, showToast }: Props) {
  const occupants = (c as any).occupants || []
  const months = calcMonths(c)
  const [activeUnitsCount, setActiveUnitsCount] = useState<number | null>(null)
  const [totalUnitsCount, setTotalUnitsCount] = useState<number | null>(null)

  useEffect(() => {
    const loadUnitStats = async () => {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/units?contract_id=${c.id}`, { headers })
      if (res.ok) {
        const units: any[] = await res.json()
        setTotalUnitsCount(units.length)
        setActiveUnitsCount(units.filter((u: any) => u.status === 'active').length)
      }
    }
    loadUnitStats()
  }, [c.id])
  const [pricePerUnit, setPricePerUnit] = useState(c.price_per_unit || 0)
  const [damageDeposit, setDamageDeposit] = useState(c.damage_deposit || 0)
  const [paymentSchedule, setPaymentSchedule] = useState(c.payment_schedule || 'Monthly')
  const [inclusions, setInclusions] = useState(c.inclusions || 'All utilities (heat, water, electricity, internet)\nParking as specified\nLaundry facilities on-site\nProperty maintenance')
  const [exclusions, setExclusions] = useState(c.exclusions || "Personal renter's insurance\nPersonal grocery/food expenses")
  const [quoteNotes, setQuoteNotes] = useState(c.quote_notes || '')
  const [lineItems, setLineItems] = useState<{ description: string; amount: number }[]>(c.quote_line_items || [])
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingPdf, setSendingPdf] = useState(false)
  const isQuoteSent = c.stage >= 1

  const downloadQuote = () => {
    window.open(`/api/contracts/${c.id}/quote-pdf`, '_blank')
  }

  const sendQuotePdf = async (sendToClient = true) => {
    setSendingPdf(true)
    const authHeader = await getAuthHeader()
    const res = await fetch(`/api/contracts/${c.id}/quote-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ send_to_client: sendToClient }),
    })
    if (res.ok) {
      showToast(sendToClient ? `Quote sent to ${c.contact_email}` : 'Quote sent to your email')
    } else {
      showToast('Failed to send quote PDF', 'error')
    }
    setSendingPdf(false)
  }

  const baseTotal = c.units * pricePerUnit * months
  const lineItemsTotal = lineItems.reduce((s, li) => s + (li.amount || 0), 0)
  const grandTotal = baseTotal + lineItemsTotal + damageDeposit

  const addLineItem = () => setLineItems(li => [...li, { description: '', amount: 0 }])
  const removeLineItem = (i: number) => setLineItems(li => li.filter((_, idx) => idx !== i))
  const updateLineItem = (i: number, field: string, val: any) =>
    setLineItems(li => li.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const saveQuote = async () => {
    setSaving(true)
    await onUpdate(c.id, {
      price_per_unit: pricePerUnit, damage_deposit: damageDeposit,
      payment_schedule: paymentSchedule, inclusions, exclusions,
      quote_notes: quoteNotes, quote_line_items: lineItems,
    } as any, 'Quote details saved')
    showToast('Quote saved')
    setSaving(false)
  }

  const sendQuote = async () => {
    if (!pricePerUnit) { showToast('Set a price per unit first', 'error'); return }
    setSending(true)
    const authHeader = await getAuthHeader()
    const res = await fetch(`/api/contracts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        price_per_unit: pricePerUnit, damage_deposit: damageDeposit,
        payment_schedule: paymentSchedule, inclusions, exclusions,
        quote_notes: quoteNotes, quote_line_items: lineItems,
        stage: 1, actor: 'Team', audit_action: 'Quote sent to client',
      }),
    })
    if (res.ok) {
      showToast('Quote sent to client — email delivered')
      await onRefresh()
    } else {
      showToast('Failed to send quote', 'error')
    }
    setSending(false)
  }

  return (
    <div>
      {isQuoteSent && (
        <div style={{ background: 'rgba(196,121,58,0.08)', border: '1px solid rgba(196,121,58,0.25)', borderRadius: 8, padding: '12px 18px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#C4793A' }}>
            {c.stage === 1 ? '⏳ Quote sent — awaiting client approval' : '✓ Quote approved by client'}
          </div>
          {c.stage === 1 && (
            <button style={styles.btnGhost} onClick={async () => {
              const authHeader = await getAuthHeader()
              const res = await fetch(`/api/contracts/${c.id}/remind`, { method: 'POST', headers: { ...authHeader } })
              if (res.ok) showToast('Reminder sent to client')
              else showToast('Failed to send reminder', 'error')
            }}>✉ Send Reminder</button>
          )}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Pricing</div>
        <div style={styles.grid3}>
          <div>
            <div style={styles.lbl}>Price / Unit / Month ($)</div>
            <input style={styles.inpGold} type="number" min="0" value={pricePerUnit || ''} placeholder="0"
              onChange={e => setPricePerUnit(Number(e.target.value))} />
          </div>
          <div>
            <div style={styles.lbl}>Units</div>
            <input style={{ ...styles.inpGold, opacity: 0.5 }} type="number" value={c.units} disabled />
          </div>
          <div>
            <div style={styles.lbl}>Duration</div>
            <input style={{ ...styles.inpGold, opacity: 0.5 }} type="text" value={`${months} months`} disabled />
          </div>
          <div>
            <div style={styles.lbl}>Damage Deposit ($)</div>
            <input style={styles.inpGold} type="number" min="0" value={damageDeposit || ''} placeholder="0"
              onChange={e => setDamageDeposit(Number(e.target.value))} />
          </div>
          <div>
            <div style={styles.lbl}>Payment Schedule</div>
            <select style={styles.inp} value={paymentSchedule} onChange={e => setPaymentSchedule(e.target.value)}>
              <option>Monthly</option>
              <option>Bi-weekly</option>
              <option>Upfront (full term)</option>
              <option>First & last month upfront</option>
              <option>Custom</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={styles.lbl}>Additional Line Items</div>
          {lineItems.map((li, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <input style={{ ...styles.inp, flex: 2 }} placeholder="Description (e.g. Parking fee)" value={li.description}
                onChange={e => updateLineItem(i, 'description', e.target.value)} />
              <input style={{ ...styles.inpGold, flex: 1, fontSize: 13 }} type="number" placeholder="$" value={li.amount || ''}
                onChange={e => updateLineItem(i, 'amount', Number(e.target.value))} />
              <button onClick={() => removeLineItem(i)} style={{ background: 'none', border: 'none', color: '#e74c3c99', cursor: 'pointer', fontSize: 16, padding: '0 6px' }}>✕</button>
            </div>
          ))}
          <button style={{ ...styles.btnGhost, marginTop: 10, fontSize: 11, padding: '6px 14px' }} onClick={addLineItem}>+ Add Line Item</button>
        </div>
      </div>

      {/* Total */}
      <div style={{ ...styles.card, padding: '18px 22px', background: '#f8f9fb', borderLeft: '3px solid #C4793A' }}>
        <div style={styles.sectionTitle}>Quote Total</div>
        {[
          [`Base rent (${c.units} units × $${pricePerUnit.toLocaleString()} × ${months} mo)`, baseTotal],
          ...lineItems.filter(li => li.description && li.amount).map(li => [li.description, li.amount]),
          ...(damageDeposit > 0 ? [['Damage deposit (refundable)', damageDeposit]] : []),
        ].map(([label, amount], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #e8ecf0', fontSize: 13 }}>
            <span style={{ color: '#94a3b8' }}>{label as string}</span>
            <span style={{ color: '#334155', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>${(amount as number).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '2px solid rgba(196,121,58,0.2)', marginTop: 4 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Quote Value</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 26, color: '#C4793A', fontWeight: 700 }}>${grandTotal.toLocaleString()}</span>
        </div>
        {/* Billing auto-adjustment indicator */}
        {totalUnitsCount !== null && totalUnitsCount > 0 && (
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 8,
            background: activeUnitsCount === totalUnitsCount ? 'rgba(0,191,166,0.06)' : 'rgba(196,121,58,0.06)',
            border: `1px solid ${activeUnitsCount === totalUnitsCount ? 'rgba(0,191,166,0.2)' : 'rgba(196,121,58,0.2)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: activeUnitsCount === totalUnitsCount ? '#00BFA6' : '#C4793A' }}>
                {activeUnitsCount} of {totalUnitsCount} units active — billing adjusted
              </div>
              {pricePerUnit > 0 && activeUnitsCount !== null && (
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#334155', fontWeight: 600 }}>
                  ${((activeUnitsCount ?? 0) * pricePerUnit * 30).toLocaleString()} / mo
                </div>
              )}
            </div>
            {activeUnitsCount !== totalUnitsCount && pricePerUnit > 0 && activeUnitsCount !== null && (
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                Full rate: ${(totalUnitsCount * pricePerUnit * 30).toLocaleString()} / mo · Adjusted: ${(activeUnitsCount * pricePerUnit * 30).toLocaleString()} / mo
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terms */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Terms & Details</div>
        <div style={styles.grid2}>
          <div>
            <div style={styles.lbl}>What's Included</div>
            <textarea style={styles.textarea} value={inclusions} onChange={e => setInclusions(e.target.value)} />
          </div>
          <div>
            <div style={styles.lbl}>What's Not Included</div>
            <textarea style={styles.textarea} value={exclusions} onChange={e => setExclusions(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={styles.lbl}>Special Notes / Terms</div>
          <textarea style={{ ...styles.textarea, minHeight: 70 }} value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} placeholder="Any special conditions or notes..." />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button style={styles.btnGhost} onClick={saveQuote} disabled={saving}>{saving ? 'Saving...' : 'Save Draft'}</button>
        <button style={styles.btnGhost} onClick={downloadQuote} title="Preview quote in browser — print or save as PDF from there">
          ⬇ Download Quote
        </button>
        <button style={{ ...styles.btnGhost, borderColor: 'rgba(0,191,166,0.4)', color: '#00BFA6' }} onClick={() => sendQuotePdf(false)} disabled={sendingPdf}>
          {sendingPdf ? 'Sending...' : '✉ Send to Me'}
        </button>
        <button style={{ ...styles.btnGhost, borderColor: 'rgba(0,191,166,0.4)', color: '#00BFA6' }} onClick={() => sendQuotePdf(true)} disabled={sendingPdf || !pricePerUnit}>
          {sendingPdf ? 'Sending...' : '✉ Email Quote to Client'}
        </button>
        <button style={styles.btnPrimary} onClick={sendQuote} disabled={sending || !pricePerUnit}>
          {sending ? 'Sending...' : isQuoteSent ? 'Resend Quote →' : 'Send Quote to Client →'}
        </button>
      </div>
    </div>
  )
}

// ── Signature Status Panel ─────────────────────────────────
function SignatureStatusPanel({ contract: c, onRefresh, showToast, onUpdate }: { contract: Contract, onRefresh: () => Promise<void>, showToast: (m: string, t?: string) => void, onUpdate: (id: string, patch: Partial<Contract>, msg?: string) => Promise<void> }) {
  const [syncing, setSyncing] = useState(false)

  const landlordSigned = !!c.provider_sig
  const tenantSigned = !!c.client_sig
  const bothSigned = landlordSigned && tenantSigned

  const syncStatus = async (silent = false) => {
    if (syncing) return
    setSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch(`/api/contracts/${c.id}/sync-signatures`, { method: 'POST', headers })
      const data = await res.json()
      if (res.ok) {
        const changed = (data.landlord?.signed && !landlordSigned) || (data.tenant?.signed && !tenantSigned)
        if (changed || !silent) {
          if (!silent) showToast('Signature status updated')
          await onRefresh()
        }
      }
    } catch { if (!silent) showToast('Sync failed', 'error') }
    setSyncing(false)
  }

  useEffect(() => {
    if (bothSigned) return
    const interval = setInterval(() => syncStatus(true), 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothSigned, c.id])

  const markOperational = async () => {
    await onUpdate(c.id, { stage: 5 }, 'Contract marked as Operational — housing active')
    showToast('Marked as Operational')
  }

  const markComplete = async () => {
    await onUpdate(c.id, { stage: 6 }, 'Contract marked as Complete')
    showToast('Marked as Complete')
  }

  return (
    <div style={{ ...styles.card, padding: '18px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={styles.sectionTitle}>Signatures</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!bothSigned && (
            <button style={{ ...styles.btnGhost, fontSize: 11, padding: '5px 12px' }} onClick={() => syncStatus(false)} disabled={syncing}>
              {syncing ? '↻ Checking...' : '↻ Refresh'}
            </button>
          )}
          {bothSigned && c.stage === 4 && (
            <button style={{ ...styles.btnPrimary, fontSize: 11, padding: '5px 16px' }} onClick={markOperational}>
              ✓ Mark as Operational
            </button>
          )}
          {c.stage === 5 && (
            <button style={{ ...styles.btnPrimary, fontSize: 11, padding: '5px 16px' }} onClick={markComplete}>
              ✓ Mark as Complete
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        {[
          { label: 'Landlord', name: 'Austin Neill', signed: landlordSigned },
          { label: 'Tenant', name: c.contact_name, signed: tenantSigned },
        ].map(({ label, name, signed }) => (
          <div key={label} style={{
            flex: 1, padding: '14px 16px', borderRadius: 8,
            background: signed ? 'rgba(0,191,166,0.06)' : '#f8f9fb',
            border: `1px solid ${signed ? 'rgba(0,191,166,0.3)' : '#e8ecf0'}`,
          }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: '#0B2540', fontWeight: 500, marginBottom: 6 }}>{name}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: signed ? '#00BFA6' : '#C4793A' }}>
              {signed ? '✓ Signed' : '⏳ Awaiting signature'}
            </div>
          </div>
        ))}
      </div>

      {bothSigned && (
        <div style={{ background: 'rgba(0,191,166,0.06)', border: '1px solid rgba(0,191,166,0.25)', borderRadius: 7, padding: '10px 14px', color: '#00BFA6', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
          ✓ Fully executed — both parties have signed.
          {(c as any).contract_file_url && (
            <a href={(c as any).contract_file_url} target="_blank" rel="noreferrer" style={{ color: '#00BFA6', marginLeft: 16 }}>↓ Download signed PDF</a>
          )}
        </div>
      )}
      {!tenantSigned && landlordSigned && (
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
          Signing email sent to {c.contact_email} — auto-refreshing every 30s. Ask client to check spam.
        </div>
      )}
    </div>
  )
}

// ── TAB: Contract ──────────────────────────────────────────
function ContractTab({ contract: c, onUpdate, onRefresh, showToast }: Props) {
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [contractText, setContractText] = useState(c.generated_contract || '')
  const [saving, setSaving] = useState(false)
  const isQuoteApproved = c.stage >= 2
  const isSent = !!c.docuseal_submission_id

  const generateContract = async () => {
    setGenerating(true)
    showToast('Generating contract with AI...')
    try {
      const authHeader = await getAuthHeader()
      const res = await fetch(`/api/contracts/${c.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ contract_id: c.id }),
      })
      const data = await res.json()
      if (data.success) {
        setContractText(data.contract)
        showToast('Contract generated — review below')
        await onRefresh()
      } else {
        showToast('Generation failed', 'error')
        console.error(data)
      }
    } catch (e) {
      showToast('Generation failed', 'error')
    }
    setGenerating(false)
  }

  const saveEdits = async () => {
    setSaving(true)
    const authHeader = await getAuthHeader()
    await fetch(`/api/contracts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ generated_contract: contractText, actor: 'Team', audit_action: 'Contract text edited manually' }),
    })
    setEditing(false)
    showToast('Contract saved')
    setSaving(false)
    await onRefresh()
  }

  const sendForSigning = async () => {
    setSending(true)
    try {
      const authHeader = await getAuthHeader()
      if (contractText !== c.generated_contract) {
        await fetch(`/api/contracts/${c.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ generated_contract: contractText }),
        })
      }
      const res = await fetch('/api/docuseal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ contract_id: c.id }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Contract sent to client for signing via DocuSeal')
        await onRefresh()
      } else {
        showToast('DocuSeal error — check logs', 'error')
        console.error(data)
      }
    } catch (e) {
      showToast('Error sending contract', 'error')
    }
    setSending(false)
  }

  if (c.stage < 1) {
    return (
      <div style={{ ...styles.card, textAlign: 'center', padding: '48px 28px' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8' }}>
          Send the quote first before generating a contract.
        </div>
      </div>
    )
  }

  return (
    <div>
      {!c.generated_contract && (
        <div style={{ ...styles.cardAccent, textAlign: 'center', padding: '40px 28px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: '#0B2540', marginBottom: 8 }}>Ready to Generate Contract</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24, lineHeight: 1.8 }}>
            Quote approved. Click below to auto-fill your lease template with all booking & quote details.
          </div>
          <button style={styles.btnPrimary} onClick={generateContract} disabled={generating}>
            {generating ? '⚙ Generating...' : '✦ Generate Contract with AI →'}
          </button>
        </div>
      )}

      {contractText && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={styles.sectionTitle}>Contract — Internal Review</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!isSent && !editing && (
                <button style={{ ...styles.btnGhost, fontSize: 11, padding: '6px 14px' }} onClick={() => setEditing(true)}>✎ Edit</button>
              )}
              {!isSent && !editing && c.generated_contract && (
                <button style={{ ...styles.btnGhost, fontSize: 11, padding: '6px 14px' }} onClick={generateContract} disabled={generating}>
                  {generating ? 'Regenerating...' : '↺ Regenerate'}
                </button>
              )}
              {editing && (
                <>
                  <button style={{ ...styles.btnGhost, fontSize: 11, padding: '6px 14px' }} onClick={() => { setEditing(false); setContractText(c.generated_contract || '') }}>Cancel</button>
                  <button style={{ ...styles.btnPrimary, fontSize: 11, padding: '6px 14px' }} onClick={saveEdits} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </>
              )}
            </div>
          </div>

          {!isSent && (
            <div style={{ background: 'rgba(0,191,166,0.06)', border: '1px solid rgba(0,191,166,0.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#00BFA6' }}>
              Review the contract carefully. Edit if needed, then click "Send for Signing" below.
            </div>
          )}

          {editing ? (
            <textarea
              value={contractText}
              onChange={e => setContractText(e.target.value)}
              style={{ background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 8, padding: '24px 28px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#334155', lineHeight: 2, width: '100%', minHeight: 600, outline: 'none', resize: 'vertical' }}
            />
          ) : (
            renderContractMarkdown(contractText)
          )}

          {!editing && contractText && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <ContractPDFButton
                contractText={contractText}
                reference={c.reference}
                contactName={c.contact_name}
                clientName={c.client_name}
                btnStyle={{ ...styles.btnGhost, fontSize: 11, padding: '6px 14px', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>
      )}

      {contractText && !isSent && (
        <div style={{ ...styles.card, padding: '20px 22px' }}>
          <div style={styles.sectionTitle}>Send for Signature</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, lineHeight: 1.8 }}>
            The contract will be sent to <strong style={{ color: '#334155' }}>{c.contact_email}</strong> via DocuSeal with signature fields embedded.
            The client signs first, then you receive a link to countersign.
          </div>
          <button style={styles.btnPrimary} onClick={sendForSigning} disabled={sending || editing}>
            {sending ? 'Sending to DocuSeal...' : '✓ Approve & Send Contract for Signing →'}
          </button>
        </div>
      )}

      {isSent && (
        <SignatureStatusPanel contract={c} onRefresh={onRefresh} showToast={showToast} onUpdate={onUpdate} />
      )}
    </div>
  )
}

// ── TAB: Units ────────────────────────────────────────────
interface ContractUnit {
  id: string
  contract_id: string
  address: string
  wifi_ssid?: string
  wifi_password?: string
  guest_name?: string
  guest_contact?: string
  status: 'active' | 'inactive'
  created_at: string
  unit_photos?: { id: string; url: string; is_primary: boolean }[]
}

function UnitsTab({ contract: c, showToast }: { contract: Contract; showToast: (msg: string, t?: string) => void }) {
  const [units, setUnits] = useState<ContractUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<ContractUnit | null>(null)
  const [form, setForm] = useState({ address: '', wifi_ssid: '', wifi_password: '', guest_name: '', guest_contact: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const headers = await getAuthHeader()
    const res = await fetch(`/api/units?contract_id=${c.id}`, { headers })
    if (res.ok) {
      const data = await res.json()
      setUnits(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [c.id])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const headers = await getAuthHeader()
    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, contract_id: c.id }),
    })
    if (res.ok) {
      setForm({ address: '', wifi_ssid: '', wifi_password: '', guest_name: '', guest_contact: '' })
      setShowAdd(false)
      showToast('Unit added')
      load()
    } else {
      showToast('Error adding unit', 'error')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 20, fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8' }}>Loading units…</div>

  if (selectedUnit) {
    return <UnitDetail unit={selectedUnit} contractId={c.id} onBack={() => { setSelectedUnit(null); load() }} showToast={showToast} />
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: '#0B2540' }}>
          Units ({units.length})
        </div>
        <button style={styles.btnPrimary} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Add Unit'}
        </button>
      </div>

      {showAdd && (
        <div style={{ ...styles.card, marginBottom: 16, background: '#f8fbff', border: '1px solid rgba(0,191,166,0.3)' }}>
          <div style={styles.sectionTitle}>New Unit</div>
          <form onSubmit={handleAdd}>
            <div style={styles.grid2}>
              <div>
                <div style={styles.lbl}>Address *</div>
                <input style={styles.inp} required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City, BC" />
              </div>
              <div>
                <div style={styles.lbl}>Guest Name</div>
                <input style={styles.inp} value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} placeholder="Occupant name" />
              </div>
              <div>
                <div style={styles.lbl}>Guest Contact</div>
                <input style={styles.inp} value={form.guest_contact} onChange={e => setForm(f => ({ ...f, guest_contact: e.target.value }))} placeholder="Phone or email" />
              </div>
              <div>
                <div style={styles.lbl}>Wi-Fi SSID</div>
                <input style={styles.inp} value={form.wifi_ssid} onChange={e => setForm(f => ({ ...f, wifi_ssid: e.target.value }))} placeholder="Network name" />
              </div>
              <div>
                <div style={styles.lbl}>Wi-Fi Password</div>
                <input style={styles.inp} value={form.wifi_password} onChange={e => setForm(f => ({ ...f, wifi_password: e.target.value }))} placeholder="Password" />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" style={styles.btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Add Unit'}</button>
            </div>
          </form>
        </div>
      )}

      {units.length === 0 && !showAdd && (
        <div style={{ ...styles.card, textAlign: 'center', padding: 40 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>No units assigned to this contract yet.</div>
          <button style={styles.btnPrimary} onClick={() => setShowAdd(true)}>+ Add First Unit</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {units.map(unit => (
          <div
            key={unit.id}
            onClick={() => setSelectedUnit(unit)}
            style={{
              ...styles.card,
              cursor: 'pointer',
              marginBottom: 0,
              transition: 'box-shadow 0.18s, border-color 0.18s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,191,166,0.12)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,191,166,0.4)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(11,37,64,0.05)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e8ecf0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: '#0B2540', flex: 1, marginRight: 8 }}>
                {unit.address || '(no address)'}
              </div>
              <div style={{
                fontSize: 10,
                fontFamily: 'IBM Plex Mono',
                padding: '3px 8px',
                borderRadius: 10,
                background: unit.status === 'active' ? 'rgba(0,191,166,0.12)' : 'rgba(148,163,184,0.15)',
                color: unit.status === 'active' ? '#00BFA6' : '#94a3b8',
                border: `1px solid ${unit.status === 'active' ? 'rgba(0,191,166,0.3)' : '#e8ecf0'}`,
                whiteSpace: 'nowrap' as const,
                flexShrink: 0,
              }}>
                {unit.status === 'active' ? '● Active' : '○ Inactive'}
              </div>
            </div>
            {unit.guest_name && (
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#334155', marginBottom: 4 }}>
                👤 {unit.guest_name}
              </div>
            )}
            {unit.guest_contact && (
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8' }}>
                {unit.guest_contact}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Unit Detail View ───────────────────────────────────────
interface UnitLease {
  id: string
  unit_id: string
  lease_type: 'landlord' | 'client'
  file_url?: string
  lease_start?: string
  lease_end?: string
  terms?: string
  created_at: string
}

function UnitDetail({
  unit: initialUnit,
  contractId,
  onBack,
  showToast,
}: {
  unit: ContractUnit
  contractId: string
  onBack: () => void
  showToast: (msg: string, t?: string) => void
}) {
  const [unit, setUnit] = useState(initialUnit)
  const [leases, setLeases] = useState<UnitLease[]>([])
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    address: unit.address || '',
    wifi_ssid: unit.wifi_ssid || '',
    wifi_password: unit.wifi_password || '',
    guest_name: unit.guest_name || '',
    guest_contact: unit.guest_contact || '',
  })
  const [changingStaff, setChangingStaff] = useState(false)
  const [staffForm, setStaffForm] = useState({ guest_name: '', guest_contact: '' })
  const [uploadForm, setUploadForm] = useState<{ type: 'landlord' | 'client'; file: File | null; lease_start: string; lease_end: string; terms: string }>({ type: 'landlord', file: null, lease_start: '', lease_end: '', terms: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadLeases = async () => {
    const headers = await getAuthHeader()
    const res = await fetch(`/api/units/${unit.id}/leases`, { headers })
    if (res.ok) setLeases(await res.json())
  }

  useEffect(() => { loadLeases() }, [unit.id])

  const handleSave = async () => {
    setSaving(true)
    const headers = await getAuthHeader()
    const res = await fetch(`/api/units/${unit.id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const updated = await res.json()
      setUnit(u => ({ ...u, ...updated }))
      setEditMode(false)
      showToast('Unit updated')
    } else showToast('Error saving', 'error')
    setSaving(false)
  }

  const handleDeactivate = async () => {
    const headers = await getAuthHeader()
    const newStatus = unit.status === 'active' ? 'inactive' : 'active'
    const res = await fetch(`/api/units/${unit.id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setUnit(u => ({ ...u, status: newStatus }))
      showToast(`Unit ${newStatus}`)
    }
  }

  const handleChangeStaff = async () => {
    const headers = await getAuthHeader()
    const res = await fetch(`/api/units/${unit.id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_name: staffForm.guest_name, guest_contact: staffForm.guest_contact }),
    })
    if (res.ok) {
      const updated = await res.json()
      setUnit(u => ({ ...u, ...updated }))
      setChangingStaff(false)
      setStaffForm({ guest_name: '', guest_contact: '' })
      showToast('Staff updated')
    }
  }

  const handleLeaseUpload = async (leaseType: 'landlord' | 'client') => {
    if (!uploadForm.file) { showToast('Please select a file', 'error'); return }
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      // Upload file to Supabase storage
      const fileExt = uploadForm.file.name.split('.').pop()
      const filePath = `${unit.id}/${leaseType}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('leases')
        .upload(filePath, uploadForm.file, { upsert: true })

      let fileUrl = ''
      if (uploadError) {
        // Fallback: store without file
        fileUrl = ''
        showToast('File upload failed — saving metadata only', 'error')
      } else {
        const { data: { publicUrl } } = supabase.storage.from('leases').getPublicUrl(filePath)
        fileUrl = publicUrl
      }

      const headers = await getAuthHeader()
      const res = await fetch(`/api/units/${unit.id}/leases`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: leaseType,
          file_url: fileUrl,
          lease_start: uploadForm.lease_start || null,
          lease_end: uploadForm.lease_end || null,
          terms: uploadForm.terms || null,
        }),
      })
      if (res.ok) {
        showToast(`${leaseType === 'landlord' ? 'Landlord' : 'Client'} lease uploaded`)
        setUploadForm({ type: 'landlord', file: null, lease_start: '', lease_end: '', terms: '' })
        loadLeases()
      }
    } catch (err) {
      showToast('Upload error', 'error')
    }
    setUploading(false)
  }

  const isActive = unit.status === 'active'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button style={{ ...styles.btnGhost, padding: '7px 14px', fontSize: 11 }} onClick={onBack}>← Back to Units</button>
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 700, fontSize: 18, color: '#0B2540', flex: 1 }}>
          {unit.address || '(no address)'}
        </div>
        <div style={{
          fontSize: 11,
          fontFamily: 'IBM Plex Mono',
          padding: '4px 12px',
          borderRadius: 12,
          background: isActive ? 'rgba(0,191,166,0.12)' : 'rgba(148,163,184,0.15)',
          color: isActive ? '#00BFA6' : '#94a3b8',
          border: `1px solid ${isActive ? 'rgba(0,191,166,0.3)' : '#e8ecf0'}`,
        }}>
          {isActive ? '● Active' : '○ Inactive'}
        </div>
      </div>

      {/* Unit fields */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={styles.sectionTitle}>Unit Details</div>
          <button style={{ ...styles.btnGhost, fontSize: 11, padding: '6px 14px' }} onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Cancel' : '✎ Edit'}
          </button>
        </div>
        {editMode ? (
          <div>
            <div style={styles.grid2}>
              <div>
                <div style={styles.lbl}>Address</div>
                <input style={styles.inp} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <div style={styles.lbl}>Guest Name</div>
                <input style={styles.inp} value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} />
              </div>
              <div>
                <div style={styles.lbl}>Guest Contact</div>
                <input style={styles.inp} value={form.guest_contact} onChange={e => setForm(f => ({ ...f, guest_contact: e.target.value }))} />
              </div>
              <div>
                <div style={styles.lbl}>Wi-Fi SSID</div>
                <input style={styles.inp} value={form.wifi_ssid} onChange={e => setForm(f => ({ ...f, wifi_ssid: e.target.value }))} />
              </div>
              <div>
                <div style={styles.lbl}>Wi-Fi Password</div>
                <input style={styles.inp} value={form.wifi_password} onChange={e => setForm(f => ({ ...f, wifi_password: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button style={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        ) : (
          <div style={styles.grid2}>
            <div>
              <div style={styles.lbl}>Address</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#334155' }}>{unit.address || '—'}</div>
            </div>
            <div>
              <div style={styles.lbl}>Guest</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#334155' }}>{unit.guest_name || '—'}</div>
              {unit.guest_contact && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8' }}>{unit.guest_contact}</div>}
            </div>
            <div>
              <div style={styles.lbl}>Wi-Fi</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#334155' }}>{unit.wifi_ssid || '—'}</div>
              {unit.wifi_password && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8' }}>pw: {unit.wifi_password}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
        <button
          style={{ ...styles.btnGhost, fontSize: 11, padding: '7px 14px' }}
          onClick={() => { setChangingStaff(!changingStaff); setStaffForm({ guest_name: unit.guest_name || '', guest_contact: unit.guest_contact || '' }) }}
        >
          👤 Change Staff
        </button>
        <button
          style={{
            ...styles.btnGhost,
            fontSize: 11,
            padding: '7px 14px',
            color: isActive ? '#e25858' : '#00BFA6',
            borderColor: isActive ? '#fcdada' : 'rgba(0,191,166,0.3)',
          }}
          onClick={handleDeactivate}
        >
          {isActive ? '⊘ Deactivate Unit' : '✓ Activate Unit'}
        </button>
      </div>

      {changingStaff && (
        <div style={{ ...styles.card, marginBottom: 16, background: '#fffbf5', border: '1px solid rgba(196,121,58,0.3)' }}>
          <div style={styles.sectionTitle}>Change Staff</div>
          <div style={styles.grid2}>
            <div>
              <div style={styles.lbl}>New Guest Name</div>
              <input style={styles.inp} value={staffForm.guest_name} onChange={e => setStaffForm(f => ({ ...f, guest_name: e.target.value }))} placeholder="Occupant name" />
            </div>
            <div>
              <div style={styles.lbl}>New Guest Contact</div>
              <input style={styles.inp} value={staffForm.guest_contact} onChange={e => setStaffForm(f => ({ ...f, guest_contact: e.target.value }))} placeholder="Phone or email" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button style={styles.btnPrimary} onClick={handleChangeStaff}>Update Staff</button>
          </div>
        </div>
      )}

      {/* Lease upload sections */}
      {(['landlord', 'client'] as const).map(leaseType => {
        const typeLeases = leases.filter(l => l.lease_type === leaseType)
        return (
          <div key={leaseType} style={{ ...styles.card, marginBottom: 14 }}>
            <div style={styles.sectionTitle}>
              {leaseType === 'landlord' ? '🏠 Landlord Lease' : '🤝 Client Lease'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={styles.lbl}>Lease Start</div>
                <input type="date" style={styles.inp} value={uploadForm.type === leaseType ? uploadForm.lease_start : ''} onChange={e => setUploadForm(f => ({ ...f, type: leaseType, lease_start: e.target.value }))} />
              </div>
              <div>
                <div style={styles.lbl}>Lease End</div>
                <input type="date" style={styles.inp} value={uploadForm.type === leaseType ? uploadForm.lease_end : ''} onChange={e => setUploadForm(f => ({ ...f, type: leaseType, lease_end: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={styles.lbl}>Terms / Notes</div>
                <textarea style={styles.textarea} rows={2} value={uploadForm.type === leaseType ? uploadForm.terms : ''} onChange={e => setUploadForm(f => ({ ...f, type: leaseType, terms: e.target.value }))} placeholder="Key lease terms…" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={styles.lbl}>Lease File (PDF)</div>
                <input type="file" accept=".pdf,.doc,.docx" style={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }} onChange={e => setUploadForm(f => ({ ...f, type: leaseType, file: e.target.files?.[0] || null }))} />
              </div>
            </div>
            <button
              style={{ ...styles.btnPrimary, fontSize: 11 }}
              onClick={() => handleLeaseUpload(leaseType)}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : `Upload ${leaseType === 'landlord' ? 'Landlord' : 'Client'} Lease`}
            </button>

            {typeLeases.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Uploaded Leases
                </div>
                {typeLeases.map(lease => (
                  <div key={lease.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f4f8', fontSize: 12 }}>
                    <div>
                      {lease.lease_start && <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#334155' }}>{lease.lease_start} → {lease.lease_end}</span>}
                      {lease.terms && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{lease.terms}</div>}
                    </div>
                    {lease.file_url && (
                      <a href={lease.file_url} target="_blank" rel="noreferrer" style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#00BFA6', textDecoration: 'none' }}>
                        ↗ View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── TAB: Documents ────────────────────────────────────────
const authHdr = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

function DocumentsTab({ contract: c }: { contract: Contract }) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const clientRef = useRef<React.RefObject<HTMLInputElement>>(null)
  const landlordRef = useRef<React.RefObject<HTMLInputElement>>(null)
  const clientInputRef = React.useRef<HTMLInputElement>(null)
  const landlordInputRef = React.useRef<HTMLInputElement>(null)

  const load = async () => {
    const h = await authHdr()
    const r = await fetch(`/api/contract-documents?contract_id=${c.id}`, { headers: h })
    if (r.ok) setDocs(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [c.id])

  const upload = async (file: File, type: string) => {
    const h = await authHdr()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('contract_id', String(c.id))
    fd.append('type', type)
    await fetch('/api/contract-documents', { method: 'POST', headers: h, body: fd })
    load()
  }

  const del = async (id: string) => {
    const h = await authHdr()
    await fetch(`/api/contract-documents?id=${id}`, { method: 'DELETE', headers: h })
    load()
  }

  type SectionProps = { title: string; type: string; inputRef: React.RefObject<HTMLInputElement> }
  const Section = ({ title, type, inputRef }: SectionProps) => {
    const sectionDocs = docs.filter(d => d.type === type)
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.08em', fontWeight: 700 }}>{title}</div>
          <button onClick={() => inputRef.current?.click()} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e8ecf0', background: '#f8f9fb', color: '#0B2540', cursor: 'pointer', fontSize: 12 }}>+ Upload</button>
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0], type); (e.target as HTMLInputElement).value = '' }} />
        </div>
        {sectionDocs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>No documents uploaded yet.</div>}
        {sectionDocs.map(doc => (
          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8f9fb', borderRadius: 8, border: '1px solid #e8ecf0', marginBottom: 6 }}>
            <span style={{ flex: 1, fontSize: 13, color: '#0B2540' }}>📄 {doc.file_name}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(doc.created_at).toLocaleDateString()}</span>
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#00BFA6', textDecoration: 'none' }}>Download</a>
            <button onClick={() => del(doc.id)} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      {loading ? <div style={{ color: '#94a3b8' }}>Loading…</div> : (
        <>
          <Section title="Client Contract" type="client_contract" inputRef={clientInputRef} />
          <Section title="Landlord Lease Agreements" type="landlord_lease" inputRef={landlordInputRef} />
        </>
      )}
    </div>
  )
}

// ── TAB: Audit Trail ───────────────────────────────────────
function AuditTab({ contract: c }: { contract: Contract }) {
  const logs = [...((c as any).audit_logs || [])].reverse()
  return (
    <div style={styles.card}>
      <div style={{ ...styles.sectionTitle, marginBottom: 16 }}>Audit Trail</div>
      {logs.length === 0 && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8' }}>No logs yet.</div>}
      {logs.map((a: any, i: number) => (
        <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid #f1f4f8', fontSize: 12 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', minWidth: 150, flexShrink: 0 }}>
            {new Date(a.created_at).toLocaleString('en-CA')}
          </div>
          <div style={{ minWidth: 60, fontSize: 11, color: '#C4793A', flexShrink: 0 }}>{a.actor}</div>
          <div style={{ color: '#334155' }}>{a.action}</div>
        </div>
      ))}
    </div>
  )
}

// ── TAB: Contract Calendar ─────────────────────────────────
function ContractCalendar({ contract: c }: { contract: Contract }) {
  const [unitLeases, setUnitLeases] = useState<Array<{ unit_id: string; address: string; leases: any[] }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/units?contract_id=${c.id}`, { headers })
      if (res.ok) {
        const units: any[] = await res.json()
        const withLeases = await Promise.all(
          units.map(async (u) => {
            const lr = await fetch(`/api/units/${u.id}/leases`, { headers })
            const leases = lr.ok ? await lr.json() : []
            return { unit_id: u.id, address: u.address, leases }
          })
        )
        setUnitLeases(withLeases)
      }
      setLoading(false)
    }
    load()
  }, [c.id])

  const startDate = c.start_date ? new Date(c.start_date) : null
  const endDate = c.end_date ? new Date(c.end_date) : null

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getDurationDays = (start: string, end: string) => {
    const s = new Date(start), e = new Date(end)
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)))
  }

  // Timeline bar: position as % of contract duration
  const contractDays = startDate && endDate ? getDurationDays(c.start_date, c.end_date) : 0

  const getBar = (start: string, end: string) => {
    if (!startDate || contractDays === 0) return { left: '0%', width: '100%' }
    const s = new Date(start), e = new Date(end)
    const offsetDays = Math.max(0, (s.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const durDays = getDurationDays(start, end)
    const left = Math.min(100, (offsetDays / contractDays) * 100)
    const width = Math.min(100 - left, (durDays / contractDays) * 100)
    return { left: `${left}%`, width: `${Math.max(2, width)}%` }
  }

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Contract Timeline</div>

        {/* Main contract bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: '#0B2540' }}>
              {c.client_name}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8' }}>
              {fmtDate(c.start_date)} → {fmtDate(c.end_date)}
              {contractDays > 0 && <span style={{ marginLeft: 8, color: '#00BFA6' }}>({contractDays} days)</span>}
            </div>
          </div>
          <div style={{ position: 'relative', height: 22, background: '#f1f4f8', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #0B2540, #1B4353)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 8,
            }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em' }}>
                CONTRACT PERIOD
              </span>
            </div>
          </div>
        </div>

        {/* Today marker (conceptual) */}
        <div style={{ marginBottom: 6, fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Key Dates
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'rgba(0,191,166,0.06)', border: '1px solid rgba(0,191,166,0.2)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#00BFA6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Start Date</div>
            <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: '#0B2540' }}>{fmtDate(c.start_date)}</div>
          </div>
          <div style={{ background: 'rgba(196,121,58,0.06)', border: '1px solid rgba(196,121,58,0.2)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#C4793A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>End Date</div>
            <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: '#0B2540' }}>{fmtDate(c.end_date)}</div>
          </div>
        </div>
      </div>

      {/* Unit lease timelines */}
      {!loading && unitLeases.length > 0 && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Unit Lease Dates</div>
          {unitLeases.map(({ unit_id, address, leases }) => (
            <div key={unit_id} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#334155', marginBottom: 8, fontWeight: 600 }}>
                🏠 {address || '(no address)'}
              </div>
              {leases.length === 0 && (
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8', paddingLeft: 8 }}>No leases uploaded</div>
              )}
              {leases.map((lease: any) => {
                const bar = lease.lease_start && lease.lease_end && contractDays > 0
                  ? getBar(lease.lease_start, lease.lease_end)
                  : null
                return (
                  <div key={lease.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: lease.lease_type === 'landlord' ? '#1B4353' : '#C4793A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {lease.lease_type} lease
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8' }}>
                        {fmtDate(lease.lease_start)} → {fmtDate(lease.lease_end)}
                      </div>
                    </div>
                    {bar && (
                      <div style={{ position: 'relative', height: 14, background: '#f1f4f8', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute',
                          left: bar.left,
                          width: bar.width,
                          height: '100%',
                          background: lease.lease_type === 'landlord' ? 'rgba(27,67,83,0.7)' : 'rgba(196,121,58,0.7)',
                          borderRadius: 4,
                        }} />
                      </div>
                    )}
                  </div>
                )
              })}
              <div style={{ borderBottom: '1px solid #f1f4f8', marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}

      {loading && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', padding: 12 }}>Loading unit leases…</div>}
    </div>
  )
}

// ── Shared styles (ERS light theme) ──────────────────────────
const styles: Record<string, any> = {
  card: {
    background: '#ffffff',
    border: '1px solid #e8ecf0',
    borderRadius: 10,
    padding: 22,
    marginBottom: 14,
    boxShadow: '0 1px 4px rgba(11,37,64,0.05)',
  },
  cardAccent: {
    background: '#ffffff',
    border: '1px solid rgba(0,191,166,0.3)',
    borderRadius: 10,
    padding: 22,
    marginBottom: 14,
    boxShadow: '0 1px 8px rgba(0,191,166,0.08)',
  },
  sectionTitle: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#0B2540',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: '2px solid rgba(0,191,166,0.18)',
  },
  lbl: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: '#94a3b8',
    marginBottom: 5,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 },
  inp: {
    background: '#f8f9fb',
    border: '1px solid #e8ecf0',
    borderRadius: 7,
    padding: '9px 13px',
    color: '#334155',
    fontSize: 13,
    fontFamily: 'IBM Plex Mono',
    outline: 'none',
    width: '100%',
  },
  inpGold: {
    background: '#f8f9fb',
    border: '1px solid #e8ecf0',
    borderRadius: 7,
    padding: '9px 13px',
    color: '#C4793A',
    fontSize: 16,
    fontFamily: 'IBM Plex Mono',
    outline: 'none',
    width: '100%',
  },
  textarea: {
    background: '#f8f9fb',
    border: '1px solid #e8ecf0',
    borderRadius: 7,
    padding: '9px 13px',
    color: '#334155',
    fontSize: 12,
    fontFamily: 'IBM Plex Mono',
    outline: 'none',
    width: '100%',
    resize: 'vertical' as const,
    minHeight: 90,
    lineHeight: 1.7,
  },
  btnPrimary: {
    background: '#00BFA6',
    border: 'none',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: 7,
    cursor: 'pointer',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  btnGhost: {
    background: 'transparent',
    color: '#0B2540',
    border: '1px solid #e8ecf0',
    padding: '10px 20px',
    borderRadius: 7,
    cursor: 'pointer',
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    letterSpacing: '0.04em',
  },
}

// ── Main ContractDetail ────────────────────────────────────
export default function ContractDetail({ contract: c, onUpdate, onRefresh, showToast }: Props) {
  const { role } = useRole()
  const TABS = [
    { key: 'request',   label: 'Request' },
    { key: 'quote',     label: '✦ Quote' },
    { key: 'contract',  label: '📋 Contract' },
    { key: 'documents', label: '📄 Documents' },
    { key: 'units',     label: '🏠 Units' },
    { key: 'calendar',  label: '📅 Calendar' },
    { key: 'audit',     label: 'Audit Trail' },
  ]
  const [tab, setTab] = useState('request')

  const clientPortalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/client/${c.client_token}`
    : `/client/${c.client_token}`

  const stageColor = STAGE_COLORS[c.stage] ?? '#94a3b8'

  return (
    <div style={{ padding: '28px 36px', background: '#f8f9fb', minHeight: '100%' }}>
      <style>{`
        .cd-tab {
          padding: 9px 18px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.18s;
          color: #94a3b8;
          white-space: nowrap;
        }
        .cd-tab.on { color: #0B2540; border-bottom-color: #00BFA6; }
        .cd-tab:hover { color: #0B2540; background: rgba(0,191,166,0.04); }

        .cd-stage-pip {
          font-size: 9px;
          padding: 4px 10px;
          border-radius: 4px;
          letter-spacing: 0.07em;
          font-family: 'IBM Plex Mono', monospace;
          white-space: nowrap;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#00BFA6', marginBottom: 6, letterSpacing: '0.1em' }}>{c.reference}</div>
          <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 700, fontSize: 26, color: '#0B2540', letterSpacing: '-0.01em' }}>{c.client_name}</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{c.contact_name} · {c.contact_email}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{
            background: `${stageColor}14`,
            border: `1px solid ${stageColor}44`,
            color: stageColor,
            padding: '6px 14px',
            borderRadius: 20,
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
            fontWeight: 600,
          }}>
            {STAGE_LABELS[c.stage]}
          </div>
          {role === 'owner' && (c as any).status !== 'active' && (
            <button
              style={{ ...styles.btnPrimary, fontSize: 11, padding: '6px 16px', background: '#0B2540' }}
              onClick={async () => {
                const headers = await getAuthHeader()
                const res = await fetch(`/api/contracts/${c.id}`, {
                  method: 'PATCH',
                  headers: { ...headers, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'active', audit_action: 'Marked as Operational', actor: 'Owner' }),
                })
                if (res.ok) { showToast('Contract marked as Operational'); onRefresh() }
                else showToast('Error', 'error')
              }}
            >
              ✓ Mark as Operational
            </button>
          )}
          {(c as any).status === 'active' && (
            <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', padding: '5px 12px', borderRadius: 12, background: 'rgba(0,191,166,0.12)', color: '#00BFA6', border: '1px solid rgba(0,191,166,0.3)' }}>
              ● Operational
            </div>
          )}
          <button
            style={{ ...styles.btnGhost, fontSize: 11, padding: '6px 14px' }}
            onClick={() => { navigator.clipboard.writeText(clientPortalUrl); showToast('Client link copied') }}
          >
            ⎘ Client Link
          </button>
          <a href={clientPortalUrl} target="_blank" rel="noreferrer">
            <button style={{ ...styles.btnGhost, fontSize: 11, padding: '6px 14px' }}>↗ Client Portal</button>
          </a>
        </div>
      </div>

      {/* Stage progress */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 22 }}>
        {Object.entries(STAGE_LABELS).map(([i, label]) => {
          const idx = parseInt(i)
          const sc = STAGE_COLORS[idx] ?? '#94a3b8'
          const isCurrent = idx === c.stage
          const isPast = idx < c.stage
          return (
            <div key={i} className="cd-stage-pip" style={{
              background: isCurrent ? `${sc}14` : isPast ? 'rgba(0,191,166,0.08)' : '#f1f4f8',
              border: `1px solid ${isCurrent ? sc + '55' : isPast ? 'rgba(0,191,166,0.25)' : '#e8ecf0'}`,
              color: isCurrent ? sc : isPast ? '#00BFA6' : '#94a3b8',
              fontWeight: isCurrent ? 700 : 400,
            }}>
              {isPast ? '✓ ' : ''}{label}
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e8ecf0', marginBottom: 22 }}>
        {TABS.map(t => (
          <div key={t.key} className={`cd-tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'request'  && <RequestTab  contract={c} />}
      {tab === 'quote'    && <QuoteTab    contract={c} onUpdate={onUpdate} onRefresh={onRefresh} showToast={showToast} />}
      {tab === 'contract' && <ContractTab contract={c} onUpdate={onUpdate} onRefresh={onRefresh} showToast={showToast} />}
      {tab === 'documents' && <DocumentsTab contract={c} />}
      {tab === 'units'     && <ContractUnitsTab contract={c} showToast={showToast} />}
      {tab === 'calendar' && <ContractCalendar contract={c} />}
      {tab === 'audit'    && <AuditTab    contract={c} />}
    </div>
  )
}
