'use client'

const N = '#0B2540', T = '#00BFA6', A = '#F59E0B', P = '#8B5CF6'

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}k`
  : `$${Math.round(n).toLocaleString()}`

// ── Pipeline data ─────────────────────────────────────────────────────────
interface Deal {
  id: number
  client: string
  location: string
  units: number
  ratePerNight: number
  durationMonths: number
  startYear: number
  startLabel: string
  notes: string
  tag: string
  tagColor: string
  totalValue: number
  mrr: number
}

const DEALS: Deal[] = [
  {
    id: 1,
    client: 'Green Infrastructure Partners',
    location: 'Campbell River, BC',
    units: 24,
    ratePerNight: 105,
    durationMonths: 24,
    startYear: 2026,
    startLabel: 'July 2026',
    notes: 'Construction workforce housing. 24-month commitment. Standard ERS rate.',
    tag: 'Prospective 2026',
    tagColor: T,
    totalValue: 24 * 105 * 30 * 24,
    mrr: 24 * 105 * 30,
  },
  {
    id: 2,
    client: 'Green Infrastructure Partners',
    location: 'Victoria, BC',
    units: 4,
    ratePerNight: 135,
    durationMonths: 6,
    startYear: 2026,
    startLabel: 'July 2026',
    notes: 'Short-term project crew. Premium Victoria rate at $135/night per unit.',
    tag: 'Prospective 2026',
    tagColor: T,
    totalValue: 4 * 135 * 30 * 6,
    mrr: 4 * 135 * 30,
  },
  {
    id: 3,
    client: 'Northern Health',
    location: 'Dawson Creek, BC',
    units: 32,
    ratePerNight: 0,
    durationMonths: 120,
    startYear: 2028,
    startLabel: '2028 — 10-Year Lease',
    notes: 'Healthcare Housing Hub. Master lease agreement. Long-term institutional partnership. Includes development, fit-out and ongoing operations.',
    tag: 'Development 2028',
    tagColor: P,
    totalValue: 1_500_000,
    mrr: 1_500_000 / 120,
  },
]

const YEAR_GROUPS = [
  { year: 2026, label: '2026', color: T },
  { year: 2028, label: '2028 +', color: P },
]

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = T }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(11,37,64,.06)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{sub}</div>
    </div>
  )
}

// ── Deal card ─────────────────────────────────────────────────────────────
function DealCard({ deal }: { deal: Deal }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(11,37,64,.06)' }}>
      {/* Top bar */}
      <div style={{ background: `${deal.tagColor}12`, borderBottom: `1px solid ${deal.tagColor}30`, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: deal.tagColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{deal.tag}</span>
        <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: '#94a3b8' }}>{deal.startLabel}</span>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: N, marginBottom: 2 }}>{deal.client}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>📍 {deal.location}</div>

        {/* Metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Units', value: `${deal.units}` },
            { label: 'Duration', value: deal.durationMonths >= 120 ? '10 yr' : `${deal.durationMonths} mo` },
            { label: deal.ratePerNight > 0 ? 'Rate/Night' : 'Contract Value', value: deal.ratePerNight > 0 ? `$${deal.ratePerNight}` : fmt(deal.totalValue) },
          ].map(m => (
            <div key={m.label} style={{ background: '#f8f9fb', borderRadius: 7, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: N }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Value row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${deal.tagColor}0a`, border: `1px solid ${deal.tagColor}25`, borderRadius: 7, padding: '10px 14px', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Total Contract Value</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: deal.tagColor }}>{fmt(deal.totalValue)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Monthly Rev</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: N }}>{fmt(deal.mrr)}<span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>/mo</span></div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55, fontStyle: 'italic' }}>{deal.notes}</div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const totalValue = DEALS.reduce((s, d) => s + d.totalValue, 0)
  const totalUnits = DEALS.reduce((s, d) => s + d.units, 0)
  const peakMrr = DEALS.reduce((s, d) => s + d.mrr, 0)
  const deals2026 = DEALS.filter(d => d.startYear === 2026)
  const dealsLater = DEALS.filter(d => d.startYear > 2026)
  const value2026 = deals2026.reduce((s, d) => s + d.totalValue, 0)
  const valueFuture = dealsLater.reduce((s, d) => s + d.totalValue, 0)

  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#94a3b8' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* ── Top nav bar ── */}
      <div style={{ background: N, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 0, height: 52, borderBottom: `2px solid ${T}` }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 32 }}>
          <img src="/logo.png" alt="ERS" style={{ height: 32, background: '#fff', borderRadius: 5, padding: '2px 6px' }} />
        </a>
        {[
          { href: '/', label: 'Contracts' },
          { href: '/dashboard/units', label: 'Units' },
          { href: '/dashboard/ap-ar', label: 'AP / AR' },
          { href: '/dashboard/kpi', label: 'KPI' },
          { href: '/dashboard/pipeline', label: 'Pipeline', active: true },
        ].map(n => (
          <a key={n.href} href={n.href} style={{
            padding: '0 16px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: n.active ? T : 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            borderBottom: n.active ? `2px solid ${T}` : '2px solid transparent',
            letterSpacing: '0.02em',
          }}>{n.label}</a>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
          Prospective Pipeline · {new Date().getFullYear()}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 32px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: N, letterSpacing: '-0.02em' }}>Prospective Pipeline</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                ERS growth contracts in progress — 2026 through 2028+
              </div>
            </div>
            <div style={{ background: N, color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', padding: '6px 14px', borderRadius: 6, letterSpacing: '0.08em' }}>
              CONFIDENTIAL · {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* ── Summary metrics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
          <StatCard label="Total Pipeline Value" value={fmt(totalValue)} sub="all prospective contracts" color={T} />
          <StatCard label="2026 Opportunities" value={fmt(value2026)} sub={`${deals2026.length} contracts`} color={T} />
          <StatCard label="Future Development" value={fmt(valueFuture)} sub="2028 and beyond" color={P} />
          <StatCard label="Units in Pipeline" value={`${totalUnits}`} sub={`${fmt(peakMrr)}/mo at full deployment`} color={A} />
        </div>

        {/* ── Year breakdown bar ── */}
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: '14px 20px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={lbl}>Breakdown</div>
          {YEAR_GROUPS.map(g => {
            const gDeals = DEALS.filter(d => d.startYear === g.year || (g.year === 2028 && d.startYear > 2026))
            const gVal = gDeals.reduce((s, d) => s + d.totalValue, 0)
            const gUnits = gDeals.reduce((s, d) => s + d.units, 0)
            return (
              <div key={g.year} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color }} />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: N }}>{g.label}</span>
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{gDeals.length} contracts · {gUnits} units · {fmt(gVal)}</span>
                </div>
              </div>
            )
          })}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
            <span style={{ fontWeight: 700, color: N }}>{DEALS.length} total deals</span> · {totalUnits} units · {fmt(totalValue)} combined value
          </div>
        </div>

        {/* ── 2026 Section ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 3, height: 28, background: T, borderRadius: 2 }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: N }}>2026 Pipeline</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                {deals2026.length} contracts · {deals2026.reduce((s,d)=>s+d.units,0)} units · {fmt(value2026)} combined value
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
            {deals2026.map(d => <DealCard key={d.id} deal={d} />)}
          </div>
        </div>

        {/* ── Future Section ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 3, height: 28, background: P, borderRadius: 2 }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: N }}>Development Pipeline — 2028+</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                Long-term institutional contracts and development projects
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
            {dealsLater.map(d => <DealCard key={d.id} deal={d} />)}
          </div>
        </div>

        {/* ── Projection table ── */}
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: N }}>Full Pipeline Summary</div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace' }}>ALL PROSPECTIVE CONTRACTS</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: N }}>
                {['Client', 'Location', 'Units', 'Start', 'Duration', 'Monthly Rev', 'Total Value', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEALS.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: N }}>{d.client}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{d.location}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: N }}>{d.units}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{d.startLabel}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{d.durationMonths >= 120 ? '10 years' : `${d.durationMonths} months`}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: T }}>{fmt(d.mrr)}/mo</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: d.tagColor }}>{fmt(d.totalValue)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${d.tagColor}14`, color: d.tagColor, border: `1px solid ${d.tagColor}30` }}>
                      {d.tag}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ background: `${N}08`, borderTop: `2px solid ${N}18` }}>
                <td colSpan={2} style={{ padding: '12px 16px', fontWeight: 700, color: N, fontSize: 12 }}>TOTAL PIPELINE</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: N }}>{totalUnits}</td>
                <td colSpan={2} style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 11 }}></td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: T, fontSize: 14 }}>{fmt(peakMrr)}/mo</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: N, fontSize: 16 }}>{fmt(totalValue)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Footer disclaimer ── */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
          All figures are prospective projections based on active client relationships and quoted rates.<br />
          Not a guarantee of revenue. For investor discussion purposes only.<br />
          <span style={{ color: T, fontWeight: 600 }}>Elias Range Stays</span> · eliasrangestays.ca · austin@eliasrangestays.ca
        </div>

      </div>
    </div>
  )
}
