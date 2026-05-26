'use client'

import { useState } from 'react'
import { Contract, QuoteResearchData } from '@/lib/types'

interface Props {
  contract: Contract
  onUpdate: (id: string, patch: Partial<Contract>, auditMsg?: string) => Promise<void>
  showToast: (msg: string, type?: string) => void
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  mono: { fontFamily: 'IBM Plex Mono' } as React.CSSProperties,
  label: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 10,
    color: '#5a6170',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: 4,
  } as React.CSSProperties,
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    cursor: 'pointer',
    userSelect: 'none' as const,
    borderRadius: 10,
    background: '#13161E',
    border: '1px solid #23273A',
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    color: '#C9A84C',
    fontWeight: 600,
    letterSpacing: '0.04em',
  } as React.CSSProperties,
  card: {
    background: '#0F1117',
    border: '1px solid #23273A',
    borderRadius: 10,
    padding: '18px 20px',
    marginBottom: 12,
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    fontSize: 10,
    color: '#5a6170',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    borderBottom: '1px solid #23273A',
  } as React.CSSProperties,
  td: {
    padding: '9px 12px',
    borderBottom: '1px solid #1a1d27',
    color: '#c8cdd8',
    fontSize: 12,
  } as React.CSSProperties,
  tdNum: {
    padding: '9px 12px',
    borderBottom: '1px solid #1a1d27',
    color: '#00BFA6',
    fontSize: 12,
    textAlign: 'right' as const,
    fontFamily: 'IBM Plex Mono',
  } as React.CSSProperties,
  tdGold: {
    padding: '9px 12px',
    borderBottom: '1px solid #1a1d27',
    color: '#C9A84C',
    fontSize: 12,
    textAlign: 'right' as const,
    fontFamily: 'IBM Plex Mono',
  } as React.CSSProperties,
  btnGhost: {
    background: 'none',
    border: '1px solid #2e3349',
    color: '#8892a4',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 11,
    fontFamily: 'IBM Plex Mono',
    cursor: 'pointer',
  } as React.CSSProperties,
  btnGold: {
    background: 'linear-gradient(135deg, #C9A84C, #a07a28)',
    border: 'none',
    color: '#0C0E14',
    borderRadius: 6,
    padding: '8px 20px',
    fontSize: 12,
    fontFamily: 'IBM Plex Mono',
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,
}

const fmt = (n: number) => `$${n.toLocaleString()}`
const pct = (n: number) => `${n.toFixed(1)}%`

function CollapsibleSection({
  emoji,
  title,
  children,
  defaultOpen = false,
}: {
  emoji: string
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={s.sectionHeader} onClick={() => setOpen(o => !o)}>
        <span style={s.sectionTitle}>{emoji} {title}</span>
        <span style={{ color: '#5a6170', fontSize: 14, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </div>
      {open && (
        <div style={{ ...s.card, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none', marginTop: 0 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function FinancialSummary({ d }: { d: QuoteResearchData }) {
  const f = d.financials
  const rows: [string, string, boolean?][] = [
    ['Rate / Night', fmt(d.rate_per_night)],
    ['Units', String(f.units)],
    ['Months', String(f.months)],
    ['Monthly Revenue', fmt(f.monthly_revenue), true],
    ['OpEx / Unit / Month', fmt(f.opex_per_unit)],
    ['Total Monthly OpEx', fmt(f.total_monthly_opex)],
    ['Monthly Profit', fmt(f.monthly_profit), true],
    ['Operating Margin', pct(f.operating_margin_pct), true],
    ['Contract Total Revenue', fmt(f.contract_total_revenue)],
    ['Furniture Cost', fmt(f.furniture_cost)],
    ['Pack-In Cost', fmt(f.pack_in_cost)],
    ['Pack-Out Cost', fmt(f.pack_out_cost)],
    ['Total One-Time Costs', fmt(f.total_one_time)],
    ['Moving (amortized / unit / mo)', fmt(f.moving_amortized_per_unit_month)],
  ]
  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>Metric</th>
          <th style={{ ...s.th, textAlign: 'right' }}>Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, val, highlight]) => (
          <tr key={label}>
            <td style={s.td}>{label}</td>
            <td style={highlight ? s.tdGold : s.tdNum}>{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CapitalSchedule({ d }: { d: QuoteResearchData }) {
  return (
    <table style={s.table}>
      <thead>
        <tr>
          {['Month', 'Event', 'Cash Out', 'Cash In', 'Net', 'Cumulative'].map(h => (
            <th key={h} style={{ ...s.th, textAlign: h === 'Month' || h === 'Event' ? 'left' : 'right' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {d.capital_schedule.map((row, i) => (
          <tr key={i}>
            <td style={s.td}>{row.month}</td>
            <td style={{ ...s.td, color: '#8892a4' }}>{row.event}</td>
            <td style={{ ...s.tdNum, color: row.cash_out > 0 ? '#e57373' : '#5a6170' }}>
              {row.cash_out > 0 ? `-${fmt(row.cash_out)}` : '—'}
            </td>
            <td style={{ ...s.tdNum, color: row.cash_in > 0 ? '#00BFA6' : '#5a6170' }}>
              {row.cash_in > 0 ? fmt(row.cash_in) : '—'}
            </td>
            <td style={{ ...s.tdNum, color: row.net >= 0 ? '#00BFA6' : '#e57373' }}>
              {row.net >= 0 ? fmt(row.net) : `-${fmt(Math.abs(row.net))}`}
            </td>
            <td style={{ ...s.tdNum, color: row.cumulative >= 0 ? '#C9A84C' : '#e57373', fontWeight: 600 }}>
              {row.cumulative >= 0 ? fmt(row.cumulative) : `-${fmt(Math.abs(row.cumulative))}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function MoneyWaterfall({ d }: { d: QuoteResearchData }) {
  const w = d.waterfall
  const total = w.gross_revenue
  const rows: [string, number, string][] = [
    ['Gross Revenue', w.gross_revenue, '#C9A84C'],
    ['Less: Total OpEx', -w.total_opex, '#e57373'],
    ['Contribution Margin', w.contribution_margin, '#00BFA6'],
    ['Less: Corporate Tax', -w.corporate_tax, '#e57373'],
    ['Less: Reserves', -w.reserves, '#8892a4'],
    ['Less: Owner Salary', -w.owner_salary, '#8892a4'],
    ['Net Retained', w.net_retained, '#C9A84C'],
  ]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#5a6170' }}>
        CM Margin: <span style={{ color: '#00BFA6' }}>{pct(w.cm_margin_pct)}</span>
      </div>
      {rows.map(([label, val, color]) => {
        const barPct = Math.abs(val) / total * 100
        const isNeg = val < 0
        return (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#8892a4' }}>{label}</span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color, fontWeight: label === 'Gross Revenue' || label === 'Net Retained' ? 700 : 400 }}>
                {isNeg ? `-${fmt(Math.abs(val))}` : fmt(val)}
              </span>
            </div>
            <div style={{ height: 6, background: '#1a1d27', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(barPct, 100)}%`, background: color, borderRadius: 3, opacity: isNeg ? 0.6 : 1 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MarketAnalysis({ d }: { d: QuoteResearchData }) {
  const m = d.market
  const rows: [string, string, string][] = [
    ['Long-Term 1BR Median', fmt(m.lt_1bed_median), '/mo'],
    ['Long-Term 1BR Top Market', fmt(m.lt_1bed_top_market), '/mo'],
    ['Hotel Avg Nightly', fmt(m.hotel_avg_nightly), '/night'],
    ['Hotel Monthly Equiv.', fmt(m.hotel_monthly_equiv), '/mo'],
    ['Airbnb Avg Nightly', fmt(m.airbnb_avg_nightly), '/night'],
    ['Airbnb Monthly Equiv.', fmt(m.airbnb_monthly_equiv), '/mo'],
    ['Corporate Furnished', fmt(m.corporate_furnished_monthly), '/mo'],
    ['ERS Rate / Night', fmt(m.ers_rate_per_night), '/night'],
    ['ERS Monthly / Person', fmt(m.ers_monthly_per_person), '/mo'],
  ]
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#0C0E14', border: '1px solid rgba(0,191,166,0.25)', borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 140 }}>
          <div style={s.label}>ERS vs Hotel</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 20, color: '#00BFA6', fontWeight: 700 }}>
            {pct(m.ers_savings_vs_hotel_pct)} cheaper
          </div>
        </div>
        <div style={{ background: '#0C0E14', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 140 }}>
          <div style={s.label}>ERS vs Airbnb</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 20, color: '#C9A84C', fontWeight: 700 }}>
            {pct(m.ers_vs_airbnb_pct)} cheaper
          </div>
        </div>
        <div style={{ background: '#0C0E14', border: '1px solid #23273A', borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 140 }}>
          <div style={s.label}>Data Source</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#8892a4' }}>{m.city}</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#5a6170', marginTop: 2 }}>{m.source_date}</div>
        </div>
      </div>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Market Comparator</th>
            <th style={{ ...s.th, textAlign: 'right' }}>Rate</th>
            <th style={{ ...s.th, textAlign: 'right' }}>Unit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, val, unit]) => (
            <tr key={label}>
              <td style={s.td}>{label}</td>
              <td style={label.startsWith('ERS') ? s.tdGold : s.tdNum}>{val}</td>
              <td style={{ ...s.td, color: '#5a6170', textAlign: 'right' }}>{unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function QuoteResearch({ contract, onUpdate, showToast }: Props) {
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')

  const qr = contract.quote_research

  const handleSaveImport = async () => {
    let parsed: QuoteResearchData
    try {
      parsed = JSON.parse(importJson)
    } catch {
      showToast('Invalid JSON — check the format and try again', 'error')
      return
    }
    setSaving(true)
    try {
      await onUpdate(contract.id, { quote_research: parsed }, 'Quote research data imported')
      showToast('Research data saved ✓')
      setShowImport(false)
      setImportJson('')
    } catch {
      showToast('Failed to save research data', 'error')
    }
    setSaving(false)
  }

  const handleClear = async () => {
    if (!confirm('Clear all research data for this quote? This cannot be undone.')) return
    setSaving(true)
    try {
      await onUpdate(contract.id, { quote_research: null }, 'Quote research cleared')
      showToast('Research data cleared')
    } catch {
      showToast('Failed to clear research data', 'error')
    }
    setSaving(false)
  }

  // ── Empty State ──────────────────────────────────────────────────────────────
  if (!qr) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: '#5a6170', marginBottom: 8 }}>
          No research data yet
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#3a3f50', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
          Generate a quote with Maestro to populate this tab. Research data includes financial analysis, capital schedule, money waterfall, and market comparison.
        </div>

        <button style={s.btnGhost} onClick={() => setShowImport(v => !v)}>
          ⬆ Import JSON
        </button>

        {showImport && (
          <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 600, margin: '20px auto 0' }}>
            <div style={s.label}>Paste QuoteResearchData JSON</div>
            <textarea
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder={'{\n  "quote_number": "ERS-001",\n  "generated_at": "...",\n  ...\n}'}
              style={{
                width: '100%',
                minHeight: 200,
                background: '#0C0E14',
                border: '1px solid #2e3349',
                borderRadius: 6,
                padding: '10px 12px',
                color: '#c8cdd8',
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
              <button style={s.btnGhost} onClick={() => { setShowImport(false); setImportJson('') }}>Cancel</button>
              <button style={s.btnGold} onClick={handleSaveImport} disabled={saving || !importJson.trim()}>
                {saving ? 'Saving...' : '✓ Save Research Data'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Populated State ──────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#5a6170' }}>
            Quote #{qr.quote_number} · {qr.city}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#3a3f50', marginTop: 2 }}>
            Last updated: {new Date(qr.generated_at).toLocaleString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.btnGhost} onClick={() => setShowImport(v => !v)}>
            ⬆ Import JSON
          </button>
          <button style={{ ...s.btnGhost, color: '#e57373', borderColor: 'rgba(229,115,115,0.3)' }} onClick={handleClear} disabled={saving}>
            ✕ Clear
          </button>
        </div>
      </div>

      {/* Import panel (inline, when visible) */}
      {showImport && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <div style={s.label}>Paste QuoteResearchData JSON to replace current data</div>
          <textarea
            value={importJson}
            onChange={e => setImportJson(e.target.value)}
            placeholder="{ ... }"
            style={{
              width: '100%',
              minHeight: 160,
              background: '#0C0E14',
              border: '1px solid #2e3349',
              borderRadius: 6,
              padding: '10px 12px',
              color: '#c8cdd8',
              fontFamily: 'IBM Plex Mono',
              fontSize: 11,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
            <button style={s.btnGhost} onClick={() => { setShowImport(false); setImportJson('') }}>Cancel</button>
            <button style={s.btnGold} onClick={handleSaveImport} disabled={saving || !importJson.trim()}>
              {saving ? 'Saving...' : '✓ Save Research Data'}
            </button>
          </div>
        </div>
      )}

      {/* 4 collapsible sections */}
      <CollapsibleSection emoji="📊" title="Financial Summary" defaultOpen>
        <FinancialSummary d={qr} />
      </CollapsibleSection>

      <CollapsibleSection emoji="💰" title="Capital Schedule">
        <CapitalSchedule d={qr} />
      </CollapsibleSection>

      <CollapsibleSection emoji="💧" title="Money Waterfall">
        <MoneyWaterfall d={qr} />
      </CollapsibleSection>

      <CollapsibleSection emoji="🏙️" title="Market Analysis">
        <MarketAnalysis d={qr} />
      </CollapsibleSection>

      {/* Raw docs (if any) */}
      {qr.raw_docs && Object.values(qr.raw_docs).some(Boolean) && (
        <CollapsibleSection emoji="📄" title="Raw Documents">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(qr.raw_docs)
              .filter(([, v]) => Boolean(v))
              .map(([key, val]) => (
                <div key={key}>
                  <div style={{ ...s.label, marginBottom: 8 }}>{key.replace(/_/g, ' ').replace(/\bmd\b/i, '').trim()}</div>
                  <pre style={{
                    background: '#0C0E14',
                    border: '1px solid #1a1d27',
                    borderRadius: 6,
                    padding: '12px 14px',
                    fontSize: 11,
                    fontFamily: 'IBM Plex Mono',
                    color: '#8892a4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    maxHeight: 300,
                    overflowY: 'auto',
                  }}>
                    {val as string}
                  </pre>
                </div>
              ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}
