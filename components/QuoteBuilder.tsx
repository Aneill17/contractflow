'use client'

import { useState } from 'react'
import { Contract, QuoteLineItem, calcTotal, formatDate } from '@/lib/types'

interface Props {
  contract: Contract
  onUpdate: (id: string, patch: Partial<Contract>, auditMsg?: string) => Promise<void>
  onRefresh: () => Promise<void>
  showToast: (msg: string, type?: string) => void
}

export default function QuoteBuilder({ contract: c, onUpdate, onRefresh, showToast }: Props) {
  const occupants = (c as any).occupants || []

  const [pricePerUnit, setPricePerUnit] = useState(c.price_per_unit || 0)
  const [damageDeposit, setDamageDeposit] = useState(c.damage_deposit || 0)
  const [paymentSchedule, setPaymentSchedule] = useState(c.payment_schedule || 'Monthly')
  const [inclusions, setInclusions] = useState(c.inclusions || 'All utilities (heat, water, electricity, internet)\nParking as specified\nLaundry facilities on-site\nWeekly common area cleaning')
  const [exclusions, setExclusions] = useState(c.exclusions || 'Personal renter\'s insurance\nPersonal grocery/food expenses\nLong distance telephone charges')
  const [quoteNotes, setQuoteNotes] = useState(c.quote_notes || '')
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>(c.quote_line_items || [])
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const months = Math.max(1, Math.round(
    (new Date(c.end_date).getTime() - new Date(c.start_date).getTime())
    / (1000 * 60 * 60 * 24 * 30)
  ))

  const baseTotal = c.units * pricePerUnit * months
  const lineItemsTotal = lineItems.reduce((sum, li) => sum + (li.amount || 0), 0)
  const grandTotal = baseTotal + lineItemsTotal + (damageDeposit || 0)

  const addLineItem = () => setLineItems(li => [...li, { description: '', amount: 0 }])
  const removeLineItem = (i: number) => setLineItems(li => li.filter((_, idx) => idx !== i))
  const updateLineItem = (i: number, field: keyof QuoteLineItem, val: any) => {
    setLineItems(li => li.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  const saveQuote = async () => {
    setSaving(true)
    await onUpdate(c.id, {
      price_per_unit: pricePerUnit,
      damage_deposit: damageDeposit,
      payment_schedule: paymentSchedule,
      inclusions,
      exclusions,
      quote_notes: quoteNotes,
      quote_line_items: lineItems,
    } as any, 'Quote details saved')
    showToast('Quote saved')
    setSaving(false)
  }

  const sendQuote = async () => {
    setSending(true)
    await onUpdate(c.id, {
      price_per_unit: pricePerUnit,
      damage_deposit: damageDeposit,
      payment_schedule: paymentSchedule,
      inclusions,
      exclusions,
      quote_notes: quoteNotes,
      quote_line_items: lineItems,
      stage: 1,
    } as any, 'Quote sent to client')
    showToast('Quote sent to client!')
    await onRefresh()
    setSending(false)
  }

  return (
    <div>
      <style>{`
        .qb-card { background: #13161D; border: 1px solid #ffffff0D; border-radius: 10px; padding: 22px; margin-bottom: 14px; }
        .qb-card-gold { background: #13161D; border: 1px solid #C9A84C2A; border-radius: 10px; padding: 22px; margin-bottom: 14px; }
        .qb-lbl { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #ffffff33; margin-bottom: 6px; display: block; }
        .qb-inp { background: #0C0E14; border: 1px solid #ffffff15; border-radius: 7px; padding: 9px 13px; color: #DDD5C8; font-size: 13px; font-family: 'IBM Plex Mono', monospace; outline: none; transition: border 0.2s; width: 100%; }
        .qb-inp:focus { border-color: #C9A84C55; }
        .qb-inp-num { background: #0C0E14; border: 1px solid #ffffff15; border-radius: 7px; padding: 9px 13px; color: #C9A84C; font-size: 16px; font-family: 'IBM Plex Mono', monospace; outline: none; transition: border 0.2s; width: 100%; }
        .qb-inp-num:focus { border-color: #C9A84C55; }
        .qb-textarea { background: #0C0E14; border: 1px solid #ffffff15; border-radius: 7px; padding: 9px 13px; color: #DDD5C8; font-size: 12px; font-family: 'IBM Plex Mono', monospace; outline: none; width: 100%; resize: vertical; min-height: 90px; line-height: 1.7; }
        .qb-textarea:focus { border-color: #C9A84C55; }
        .qb-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .qb-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .qb-field { margin-bottom: 16px; }
        .qb-section { font-family: 'Playfair Display', serif; font-size: 13px; font-style: italic; color: #C9A84C88; margin-bottom: 14px; }
        .qb-total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ffffff07; font-size: 13px; }
        .qb-btn { border: none; border-radius: 7px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.07em; padding: 10px 20px; transition: all 0.18s; }
        .qb-btn-gold { background: #C9A84C; color: #0C0E14; font-weight: 500; }
        .qb-btn-gold:hover { background: #DDB85C; }
        .qb-btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }
        .qb-btn-ghost { background: transparent; color: #C9A84C; border: 1px solid #C9A84C44; }
        .qb-btn-ghost:hover { background: #C9A84C11; }
        .qb-btn-red { background: transparent; color: #e74c3c55; border: none; cursor: pointer; font-size: 14px; padding: 4px 8px; }
        .qb-btn-red:hover { color: #e74c3c; }
        .li-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
      `}</style>

      {/* Booking summary (read only) */}
      <div className="qb-card" style={{ marginBottom: 14 }}>
        <div className="qb-section">Booking Request Summary</div>
        <div className="qb-grid3">
          {[
            ['Client', c.client_name],
            ['Contact', c.contact_name],
            ['Email', c.contact_email],
            ['Location', c.location],
            ['Units', `${c.units} units`],
            ['Dates', `${formatDate(c.start_date)} → ${formatDate(c.end_date)} (${months} mo)`],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="qb-lbl">{l}</div>
              <div style={{ fontSize: 13, color: '#DDD5C8' }}>{v}</div>
            </div>
          ))}
        </div>
        {occupants.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #ffffff08' }}>
            <div className="qb-lbl">Occupants</div>
            <div style={{ fontSize: 12, color: '#ffffff66' }}>{occupants.map((o: any) => o.name).join(', ')}</div>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="qb-card-gold">
        <div className="qb-section">Pricing</div>
        <div className="qb-grid3">
          <div className="qb-field">
            <label className="qb-lbl">Price / Unit / Month ($)</label>
            <input className="qb-inp-num" type="number" min="0" value={pricePerUnit || ''} placeholder="0"
              onChange={e => setPricePerUnit(Number(e.target.value))} />
          </div>
          <div className="qb-field">
            <label className="qb-lbl">Number of Units</label>
            <input className="qb-inp-num" type="number" value={c.units} disabled style={{ opacity: 0.5 }} />
          </div>
          <div className="qb-field">
            <label className="qb-lbl">Duration (months)</label>
            <input className="qb-inp-num" type="number" value={months} disabled style={{ opacity: 0.5 }} />
          </div>
        </div>

        <div className="qb-grid2">
          <div className="qb-field">
            <label className="qb-lbl">Damage Deposit ($)</label>
            <input className="qb-inp-num" type="number" min="0" value={damageDeposit || ''} placeholder="0"
              onChange={e => setDamageDeposit(Number(e.target.value))} />
          </div>
          <div className="qb-field">
            <label className="qb-lbl">Payment Schedule</label>
            <select className="qb-inp" value={paymentSchedule} onChange={e => setPaymentSchedule(e.target.value)}>
              <option value="Monthly">Monthly</option>
              <option value="Bi-weekly">Bi-weekly</option>
              <option value="Upfront (full term)">Upfront (full term)</option>
              <option value="First & last month upfront">First & last month upfront</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Custom line items */}
        <div style={{ marginTop: 4 }}>
          <div className="qb-lbl" style={{ marginBottom: 10 }}>Additional Line Items</div>
          {lineItems.map((li, i) => (
            <div key={i} className="li-row">
              <input className="qb-inp" placeholder="Description (e.g. Parking fee)" value={li.description}
                onChange={e => updateLineItem(i, 'description', e.target.value)} style={{ flex: 2 }} />
              <input className="qb-inp-num" placeholder="$" type="number" value={li.amount || ''}
                onChange={e => updateLineItem(i, 'amount', Number(e.target.value))} style={{ flex: 1, fontSize: 13 }} />
              <button className="qb-btn-red" onClick={() => removeLineItem(i)}>✕</button>
            </div>
          ))}
          <button className="qb-btn qb-btn-ghost" style={{ fontSize: 11, padding: '7px 16px', marginTop: 4 }} onClick={addLineItem}>
            + Add Line Item
          </button>
        </div>
      </div>

      {/* Quote total */}
      <div className="qb-card" style={{ padding: '18px 22px' }}>
        <div className="qb-section">Quote Total</div>
        <div className="qb-total-row">
          <span style={{ color: '#ffffff55' }}>Base rent ({c.units} units × ${pricePerUnit.toLocaleString()} × {months} mo)</span>
          <span>${baseTotal.toLocaleString()}</span>
        </div>
        {lineItems.filter(li => li.description && li.amount).map((li, i) => (
          <div key={i} className="qb-total-row">
            <span style={{ color: '#ffffff55' }}>{li.description}</span>
            <span>${li.amount.toLocaleString()}</span>
          </div>
        ))}
        {damageDeposit > 0 && (
          <div className="qb-total-row">
            <span style={{ color: '#ffffff55' }}>Damage deposit</span>
            <span>${damageDeposit.toLocaleString()}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, marginTop: 4, borderTop: '1px solid #C9A84C22' }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#C9A84C88' }}>Total Quote Value</span>
          <span style={{ fontFamily: 'Playfair Display', serif: true, fontSize: 28, color: '#C9A84C' } as any}>${grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Terms */}
      <div className="qb-card">
        <div className="qb-section">Terms & Details</div>
        <div className="qb-grid2">
          <div className="qb-field">
            <label className="qb-lbl">What's Included</label>
            <textarea className="qb-textarea" value={inclusions} onChange={e => setInclusions(e.target.value)}
              placeholder="List what's included in the rate..." />
          </div>
          <div className="qb-field">
            <label className="qb-lbl">What's Not Included</label>
            <textarea className="qb-textarea" value={exclusions} onChange={e => setExclusions(e.target.value)}
              placeholder="List exclusions..." />
          </div>
        </div>
        <div className="qb-field">
          <label className="qb-lbl">Special Notes / Terms</label>
          <textarea className="qb-textarea" value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)}
            placeholder="Any special conditions, notes, or terms for this quote..." style={{ minHeight: 70 }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="qb-btn qb-btn-ghost" onClick={saveQuote} disabled={saving}>
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button className="qb-btn qb-btn-gold" onClick={sendQuote} disabled={sending || !pricePerUnit}>
          {sending ? 'Sending...' : 'Send Quote to Client →'}
        </button>
      </div>
    </div>
  )
}
