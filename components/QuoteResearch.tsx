'use client'

import { useState } from 'react'
import { Contract, QuoteResearchData } from '@/lib/types'

interface Props {
  contract: Contract
  onUpdate: (id: string, patch: Partial<Contract>, auditMsg?: string) => Promise<void>
  showToast: (msg: string, type?: string) => void
}

const fmt = (n: number) => `$${(n || 0).toLocaleString()}`
const pct = (n: number) => `${(n || 0).toFixed(1)}%`

// ── Markdown → readable doc renderer ─────────────────────────────────────────
function MarkdownDoc({ md }: { md: string }) {
  const lines = md.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  const parseLine = (text: string): React.ReactNode => {
    // Color dollar amounts
    const parts = text.split(/(\$[\d,]+(?:\.\d+)?|-?\$[\d,]+(?:\.\d+)?)/g)
    return parts.map((p, idx) => {
      if (/^\$[\d,]/.test(p)) return <span key={idx} style={{ color: '#007A6E', fontWeight: 600 }}>{p}</span>
      if (/^-\$[\d,]/.test(p)) return <span key={idx} style={{ color: '#C0392B', fontWeight: 600 }}>{p}</span>
      // Bold
      const boldParts = p.split(/(\*\*[^*]+\*\*)/g)
      return boldParts.map((bp, bi) =>
        bp.startsWith('**') && bp.endsWith('**')
          ? <strong key={bi} style={{ color: '#0B2540' }}>{bp.slice(2, -2)}</strong>
          : <span key={bi}>{bp}</span>
      )
    })
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // H1
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontSize: 18, fontWeight: 700, color: '#0B2540', margin: '24px 0 6px', fontFamily: 'Nunito Sans, sans-serif', borderBottom: '2px solid #00BFA6', paddingBottom: 6 }}>
          {trimmed.slice(2)}
        </h1>
      )
      i++; continue
    }
    // H2
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: 14, fontWeight: 700, color: '#00698A', margin: '20px 0 4px', fontFamily: 'Nunito Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {trimmed.slice(3)}
        </h2>
      )
      i++; continue
    }
    // H3
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: '14px 0 2px', fontFamily: 'Nunito Sans, sans-serif' }}>
          {trimmed.slice(4)}
        </h3>
      )
      i++; continue
    }
    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />)
      i++; continue
    }
    // Table: collect all consecutive pipe lines
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      const rows = tableLines.filter(l => !/^\|[-| :]+\|$/.test(l))
      const [header, ...body] = rows
      const cols = header.split('|').map(c => c.trim()).filter(Boolean)
      elements.push(
        <div key={`table-${i}`} style={{ overflowX: 'auto', margin: '10px 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12, fontFamily: 'Nunito Sans, sans-serif' }}>
            <thead>
              <tr style={{ background: '#0B2540' }}>
                {cols.map((c, ci) => (
                  <th key={ci} style={{ padding: '7px 12px', color: '#fff', fontWeight: 600, textAlign: ci === 0 ? 'left' : 'right', whiteSpace: 'nowrap', fontSize: 11, letterSpacing: '0.03em' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => {
                const cells = row.split('|').map(c => c.trim()).filter(Boolean)
                const isTotal = cells[0]?.toUpperCase().includes('TOTAL') || cells[0]?.toUpperCase().includes('NET')
                return (
                  <tr key={ri} style={{ background: isTotal ? '#f0faf9' : ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    {cells.map((cell, ci) => {
                      const isDollar = /\$[\d,]/.test(cell)
                      const isNeg = /^-\$/.test(cell) || /\(\$/.test(cell)
                      return (
                        <td key={ci} style={{
                          padding: '6px 12px',
                          borderBottom: '1px solid #e8ecf0',
                          textAlign: ci === 0 ? 'left' : 'right',
                          fontWeight: isTotal ? 700 : 400,
                          color: isNeg ? '#C0392B' : isDollar && ci !== 0 ? '#007A6E' : isTotal ? '#0B2540' : '#334155',
                          whiteSpace: ci === 0 ? 'normal' : 'nowrap',
                        }}>
                          {cell}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
      continue
    }
    // Bullet
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0', paddingLeft: 8 }}>
          <span style={{ color: '#00BFA6', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>·</span>
          <span style={{ fontSize: 13, color: '#334155', fontFamily: 'Nunito Sans, sans-serif', lineHeight: 1.5 }}>
            {parseLine(trimmed.slice(2))}
          </span>
        </div>
      )
      i++; continue
    }
    // Empty line
    if (!trimmed) {
      elements.push(<div key={i} style={{ height: 6 }} />)
      i++; continue
    }
    // Normal paragraph
    elements.push(
      <p key={i} style={{ fontSize: 13, color: '#334155', fontFamily: 'Nunito Sans, sans-serif', margin: '4px 0', lineHeight: 1.6 }}>
        {parseLine(trimmed)}
      </p>
    )
    i++
  }

  return <div style={{ padding: '4px 0' }}>{elements}</div>
}

// ── Collapsible section ───────────────────────────────────────────────────────
function Section({ emoji, title, children, defaultOpen = false }: {
  emoji: string; title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 10, border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: '#f8fafc', cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#0B2540' }}>
          {emoji} {title}
        </span>
        <span style={{ color: '#94a3b8', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▾</span>
      </div>
      {open && (
        <div style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Compact 2-col table ───────────────────────────────────────────────────────
function MetricTable({ rows }: { rows: [string, string, 'normal' | 'teal' | 'green' | 'red' | 'bold'][] }) {
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 480, fontSize: 13, fontFamily: 'Nunito Sans, sans-serif' }}>
      <tbody>
        {rows.map(([label, val, style], i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
            <td style={{ padding: '6px 10px', color: '#475569', borderBottom: '1px solid #f1f5f9', width: '60%' }}>{label}</td>
            <td style={{
              padding: '6px 10px',
              textAlign: 'right',
              borderBottom: '1px solid #f1f5f9',
              fontWeight: style === 'bold' ? 700 : 500,
              color: style === 'teal' ? '#00698A' : style === 'green' ? '#007A6E' : style === 'red' ? '#C0392B' : style === 'bold' ? '#0B2540' : '#334155',
            }}>{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Sections ─────────────────────────────────────────────────────────────────
function FinancialSummary({ d }: { d: QuoteResearchData }) {
  const f = d.financials
  const rows: [string, string, 'normal' | 'teal' | 'green' | 'red' | 'bold'][] = [
    ['Rate / Night', fmt(d.rate_per_night), 'bold'],
    ['Units', String(f.units), 'normal'],
    ['Contract Duration', `${f.months} months`, 'normal'],
    ['Monthly Revenue', fmt(f.monthly_revenue), 'green'],
    ['OpEx / Unit / Month', fmt(f.opex_per_unit), 'normal'],
    ['Total Monthly OpEx', fmt(f.total_monthly_opex), 'red'],
    ['Monthly Profit', fmt(f.monthly_profit), 'green'],
    ['Profit / Unit / Month', fmt((f as any).profit_per_unit || f.monthly_profit / f.units), 'green'],
    ['Operating Margin', pct(f.operating_margin_pct), 'teal'],
    ['Contract Total Revenue', fmt(f.contract_total_revenue), 'bold'],
    ['Furniture (in-house)', d.furniture_in_house ? 'Yes — $0 cost' : fmt(f.furniture_cost), d.furniture_in_house ? 'teal' : 'normal'],
    ['Pack-In Cost', fmt(f.pack_in_cost), 'red'],
    ['Pack-Out Cost', fmt(f.pack_out_cost), 'red'],
    ['Total Moving Costs', fmt(f.total_one_time), 'red'],
    ['Moving / Unit / Month (amortized)', fmt(f.moving_amortized_per_unit_month), 'normal'],
  ]
  return <MetricTable rows={rows} />
}

function CapitalSchedule({ d }: { d: QuoteResearchData }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12, fontFamily: 'Nunito Sans, sans-serif' }}>
        <thead>
          <tr style={{ background: '#0B2540' }}>
            {['Month', 'Event', 'Cash Out', 'Cash In', 'Net', 'Cumulative'].map((h, i) => (
              <th key={h} style={{ padding: '7px 10px', color: '#fff', fontWeight: 600, textAlign: i < 2 ? 'left' : 'right', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.capital_schedule.map((row, i) => {
            const isTotal = row.month === 'TOTAL'
            return (
              <tr key={i} style={{ background: isTotal ? '#f0faf9' : i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '6px 10px', color: '#0B2540', fontWeight: isTotal ? 700 : 500, borderBottom: '1px solid #e8ecf0', whiteSpace: 'nowrap' }}>{row.month}</td>
                <td style={{ padding: '6px 10px', color: '#475569', borderBottom: '1px solid #e8ecf0', fontSize: 12 }}>{row.event}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', color: row.cash_out > 0 ? '#C0392B' : '#94a3b8', borderBottom: '1px solid #e8ecf0', whiteSpace: 'nowrap', fontWeight: isTotal ? 700 : 400 }}>
                  {row.cash_out > 0 ? `-${fmt(row.cash_out)}` : '—'}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', color: row.cash_in > 0 ? '#007A6E' : '#94a3b8', borderBottom: '1px solid #e8ecf0', whiteSpace: 'nowrap', fontWeight: isTotal ? 700 : 400 }}>
                  {row.cash_in > 0 ? fmt(row.cash_in) : '—'}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', color: row.net >= 0 ? '#007A6E' : '#C0392B', borderBottom: '1px solid #e8ecf0', whiteSpace: 'nowrap', fontWeight: isTotal ? 700 : 400 }}>
                  {row.net >= 0 ? fmt(row.net) : `-${fmt(Math.abs(row.net))}`}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', color: row.cumulative >= 0 ? '#0B2540' : '#C0392B', borderBottom: '1px solid #e8ecf0', whiteSpace: 'nowrap', fontWeight: 700 }}>
                  {row.cumulative >= 0 ? fmt(row.cumulative) : `-${fmt(Math.abs(row.cumulative))}`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MoneyWaterfall({ d }: { d: QuoteResearchData }) {
  const w = d.waterfall
  const total = w.gross_revenue
  const rows: [string, number, string][] = [
    ['Gross Revenue', w.gross_revenue, '#0B2540'],
    ['Less: Total OpEx', -w.total_opex, '#C0392B'],
    ['Contribution Margin', w.contribution_margin, '#007A6E'],
    ['Less: Corporate Tax (11%)', -(w.corporate_tax || 0), '#e67e22'],
    ['Less: Reserves (10%)', -(w.reserves || 0), '#7f8c8d'],
    ['Less: Owner Salary', -(w.owner_salary || 0), '#7f8c8d'],
    ['Net Retained', w.net_retained, '#00698A'],
  ]
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ display: 'inline-flex', gap: 6, marginBottom: 14, background: '#f0faf9', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#007A6E', fontFamily: 'Nunito Sans, sans-serif', fontWeight: 600 }}>
        CM Margin: {pct(w.cm_margin_pct)}
      </div>
      {rows.map(([label, val, color]) => {
        if (val === 0 || val === -0) return null
        const barPct = Math.abs(val) / total * 100
        const isNeg = val < 0
        const isKey = label === 'Gross Revenue' || label === 'Net Retained' || label === 'Contribution Margin'
        return (
          <div key={label} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: '#475569', fontFamily: 'Nunito Sans, sans-serif', fontWeight: isKey ? 600 : 400 }}>{label}</span>
              <span style={{ fontSize: 13, color, fontWeight: isKey ? 700 : 500, fontFamily: 'Nunito Sans, sans-serif' }}>
                {isNeg ? `-${fmt(Math.abs(val))}` : fmt(val)}
              </span>
            </div>
            <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(barPct, 100)}%`, background: color, borderRadius: 3, opacity: isNeg ? 0.5 : 0.85 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MarketAnalysis({ d }: { d: QuoteResearchData }) {
  const m = d.market
  return (
    <div>
      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'vs Hotel', val: `${pct(m.ers_savings_vs_hotel_pct)} cheaper`, color: '#007A6E', bg: '#f0faf9' },
          { label: 'vs Airbnb', val: `${pct(m.ers_vs_airbnb_pct)} ${(m.ers_vs_airbnb_pct || 0) < 0 ? 'more' : 'cheaper'}`, color: '#00698A', bg: '#f0f7fa' },
          { label: 'Source', val: `${m.city} · ${m.source_date}`, color: '#475569', bg: '#f8fafc' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={{ background: bg, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'Nunito Sans', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, color, fontWeight: 700, fontFamily: 'Nunito Sans' }}>{val}</div>
          </div>
        ))}
      </div>
      <MetricTable rows={[
        ['Long-Term 1BR Median', `${fmt(m.lt_1bed_median)}/mo`, 'normal'],
        ['Long-Term 1BR Top Market', `${fmt(m.lt_1bed_top_market)}/mo`, 'normal'],
        ['Hotel (avg nightly)', `${fmt(m.hotel_avg_nightly)}/night`, 'red'],
        ['Hotel (monthly equiv.)', `${fmt(m.hotel_monthly_equiv)}/mo`, 'red'],
        ['Airbnb (avg nightly)', `${fmt(m.airbnb_avg_nightly)}/night`, 'normal'],
        ['Airbnb (monthly equiv.)', `${fmt(m.airbnb_monthly_equiv)}/mo`, 'normal'],
        ['Corporate Furnished', `${fmt(m.corporate_furnished_monthly)}/mo`, 'normal'],
        ['ERS Rate / Night', `${fmt(m.ers_rate_per_night)}/night`, 'teal'],
        ['ERS Monthly / Person', `${fmt(m.ers_monthly_per_person)}/mo`, 'bold'],
      ]} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function QuoteResearch({ contract, onUpdate, showToast }: Props) {
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const qr = contract.quote_research

  const btnGhost: React.CSSProperties = { background: 'none', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontFamily: 'Nunito Sans', cursor: 'pointer' }
  const btnPrimary: React.CSSProperties = { background: '#0B2540', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 16px', fontSize: 12, fontFamily: 'Nunito Sans', fontWeight: 600, cursor: 'pointer' }

  const handleSaveImport = async () => {
    let parsed: QuoteResearchData
    try { parsed = JSON.parse(importJson) } catch { showToast('Invalid JSON', 'error'); return }
    setSaving(true)
    try {
      await onUpdate(contract.id, { quote_research: parsed }, 'Quote research imported')
      showToast('Research data saved ✓')
      setShowImport(false); setImportJson('')
    } catch { showToast('Failed to save', 'error') }
    setSaving(false)
  }

  const handleClear = async () => {
    if (!confirm('Clear all research data? Cannot be undone.')) return
    setSaving(true)
    try { await onUpdate(contract.id, { quote_research: null }, 'Research cleared'); showToast('Cleared') }
    catch { showToast('Failed', 'error') }
    setSaving(false)
  }

  if (!qr) return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 14, color: '#334155', fontFamily: 'Nunito Sans', marginBottom: 6, fontWeight: 600 }}>No research data yet</div>
      <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Nunito Sans', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
        Ask Maestro to quote this contract — financial analysis, capital schedule, market data and waterfall will appear here automatically.
      </div>
      <button style={btnGhost} onClick={() => setShowImport(v => !v)}>⬆ Import JSON</button>
      {showImport && (
        <div style={{ marginTop: 16, textAlign: 'left', maxWidth: 560, margin: '16px auto 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <textarea value={importJson} onChange={e => setImportJson(e.target.value)} placeholder='{ "quote_number": "ERS-001", ... }' style={{ width: '100%', minHeight: 160, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontFamily: 'IBM Plex Mono', resize: 'vertical', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
            <button style={btnGhost} onClick={() => { setShowImport(false); setImportJson('') }}>Cancel</button>
            <button style={btnPrimary} onClick={handleSaveImport} disabled={saving || !importJson.trim()}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      )}
    </div>
  )

  const docLabels: Record<string, string> = {
    quote_md: '📊 Financial Analysis',
    capital_md: '💰 Capital Schedule',
    waterfall_md: '💧 Money Waterfall',
    market_md: '🏙️ Market Analysis',
  }

  return (
    <div style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0B2540' }}>{qr.quote_number} · {qr.city}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Generated {new Date(qr.generated_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnGhost} onClick={() => setShowImport(v => !v)}>⬆ Replace</button>
          <button style={{ ...btnGhost, color: '#ef4444', borderColor: '#fee2e2' }} onClick={handleClear} disabled={saving}>✕</button>
        </div>
      </div>

      {showImport && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <textarea value={importJson} onChange={e => setImportJson(e.target.value)} placeholder="{ ... }" style={{ width: '100%', minHeight: 120, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontFamily: 'IBM Plex Mono', resize: 'vertical', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnGhost} onClick={() => { setShowImport(false); setImportJson('') }}>Cancel</button>
            <button style={btnPrimary} onClick={handleSaveImport} disabled={saving || !importJson.trim()}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      )}

      <Section emoji="📊" title="Financial Summary" defaultOpen>
        <FinancialSummary d={qr} />
      </Section>

      <Section emoji="💰" title="Capital Schedule">
        <CapitalSchedule d={qr} />
      </Section>

      <Section emoji="💧" title="Money Waterfall">
        <MoneyWaterfall d={qr} />
      </Section>

      <Section emoji="🏙️" title="Market Analysis">
        <MarketAnalysis d={qr} />
      </Section>

      {qr.raw_docs && Object.entries(qr.raw_docs).some(([, v]) => Boolean(v)) && (
        <Section emoji="📄" title="Full Documents">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {Object.entries(qr.raw_docs).filter(([, v]) => Boolean(v)).map(([key, val], idx, arr) => (
              <div key={key}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#00698A', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 0 8px', fontFamily: 'Nunito Sans' }}>
                  {docLabels[key] || key.replace(/_/g, ' ')}
                </div>
                <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '16px 20px' }}>
                  <MarkdownDoc md={val as string} />
                </div>
                {idx < arr.length - 1 && <div style={{ height: 16 }} />}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
