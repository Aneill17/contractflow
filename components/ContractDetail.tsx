'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Contract, STAGE_LABELS, STAGE_COLORS, calcTotal, calcMonths, formatDate } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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
  const [pricePerUnit, setPricePerUnit] = useState(c.price_per_unit || 0)
  const [damageDeposit, setDamageDeposit] = useState(c.damage_deposit || 0)
  const [paymentSchedule, setPaymentSchedule] = useState(c.payment_schedule || 'Monthly')
  const [inclusions, setInclusions] = useState(c.inclusions || 'All utilities (heat, water, electricity, internet)\nParking as specified\nLaundry facilities on-site\nProperty maintenance')
  const [exclusions, setExclusions] = useState(c.exclusions || "Personal renter's insurance\nPersonal grocery/food expenses")
  const [quoteNotes, setQuoteNotes] = useState(c.quote_notes || '')
  const [lineItems, setLineItems] = useState<{ description: string; amount: number }[]>(c.quote_line_items || [])
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const isQuoteSent = c.stage >= 1

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

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={styles.btnGhost} onClick={saveQuote} disabled={saving}>{saving ? 'Saving...' : 'Save Draft'}</button>
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

  const markComplete = async () => {
    await onUpdate(c.id, { stage: 5 }, 'Contract marked as complete — housing active')
    showToast('Marked as complete')
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
          {bothSigned && c.stage < 5 && (
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
  const TABS = [
    { key: 'request',  label: 'Request' },
    { key: 'quote',    label: '✦ Quote' },
    { key: 'contract', label: '📋 Contract' },
    { key: 'audit',    label: 'Audit Trail' },
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
      {tab === 'audit'    && <AuditTab    contract={c} />}
    </div>
  )
}
