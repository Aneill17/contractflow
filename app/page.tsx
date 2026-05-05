'use client'

import { useEffect, useState } from 'react'
import { Contract, STAGE_LABELS, STAGE_COLORS, calcTotal, calcMonths } from '@/lib/types'
import ContractDetail from '@/components/ContractDetail'
import NewContract from '@/components/NewContract'
import OwnerOnly from '@/components/OwnerOnly'
import DeleteContractModal from '@/components/DeleteContractModal'
import { useRole } from '@/components/UserRoleContext'
import { supabase } from '@/lib/supabase'


export default function HomePage() {
  const { role, userName, loading: roleLoading, signOut } = useRole()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'dashboard' | 'contract' | 'new'>('dashboard')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; ref: string } | null>(null)
  const [openStagePicker, setOpenStagePicker] = useState<{ id: string; top: number; left: number; openUp: boolean } | null>(null)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }

  const fetchContracts = async () => {
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/contracts', { headers })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      setContracts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load contracts:', err)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!roleLoading) fetchContracts()
  }, [roleLoading])

  const updateContract = async (id: string, patch: Partial<Contract>, auditMsg?: string) => {
    const headers = await getAuthHeader()
    await fetch(`/api/contracts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ ...patch, audit_action: auditMsg, actor: userName || 'Team' }),
    })
    await fetchContracts()
  }

  const activeContract = contracts.find(c => c.id === activeId)

  const filtered = contracts.filter(c => {
    if (filter === 'pending') return c.stage === 1
    if (filter === 'signing') return c.stage === 2 || c.stage === 3 || c.stage === 4
    if (filter === 'ops') return c.stage >= 5 && c.stage < 8
    return true
  })

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.stage > 0 && c.stage < 8).length,
    pending: contracts.filter(c => c.stage === 1).length,
    value: contracts.reduce((s, c) => s + calcTotal(c), 0),
  }

  // CFO metrics
  const operationalContracts = contracts.filter(c => c.stage === 5)
  const mrr = operationalContracts.reduce((s, c) => s + c.units * (c.price_per_unit || 0), 0)
  const arr = mrr * 12
  const unitsUnderMgmt = operationalContracts.reduce((s, c) => s + (c.units || 0), 0)
  const pipelineContracts = contracts.filter(c => c.stage >= 1 && c.stage <= 3)
  const pipelineValue = pipelineContracts.reduce((s, c) => s + calcTotal(c), 0)
  const portfolioValue = contracts.filter(c => c.stage >= 4).reduce((s, c) => s + calcTotal(c), 0)
  const avgRatePerUnit = operationalContracts.length > 0
    ? operationalContracts.reduce((s, c) => s + (c.price_per_unit || 0), 0) / operationalContracts.length
    : 0
  const now = new Date()
  const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const expiringSoon = contracts.filter(c => c.stage >= 4 && c.stage < 6 && new Date(c.end_date) >= now && new Date(c.end_date) <= in60).length
  const avgContractMonths = contracts.length > 0
    ? Math.round(contracts.reduce((s, c) => s + calcMonths(c), 0) / contracts.length)
    : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        /* ── ERS Dashboard Styles ── */
        .ers-card {
          background: #ffffff;
          border: 1px solid #e8ecf0;
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(11,37,64,0.06);
        }
        .ers-card-accent {
          background: #ffffff;
          border: 1px solid rgba(0,191,166,0.35);
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(0,191,166,0.08);
        }
        .ers-btn {
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 9px 18px;
          transition: all 0.18s;
          letter-spacing: 0.01em;
        }
        .ers-btn-primary { background: #00BFA6; color: #ffffff; }
        .ers-btn-primary:hover { background: #00a892; transform: translateY(-1px); }
        .ers-btn-outline { background: transparent; color: #00BFA6; border: 1.5px solid #00BFA6; }
        .ers-btn-outline:hover { background: rgba(0,191,166,0.08); }
        .ers-btn-ghost { background: transparent; color: #94a3b8; border: 1px solid #e8ecf0; }
        .ers-btn-ghost:hover { background: #f8f9fb; color: #334155; }
        .ers-btn-danger { background: transparent; color: #e74c3c; border: 1px solid #e74c3c55; }
        .ers-btn-danger:hover { background: #fef2f2; }
        .ers-btn-active { background: #0B2540; color: #ffffff; }
        .ers-btn-sm { padding: 5px 13px; font-size: 11px; }

        .ers-nav-item {
          padding: 8px 14px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.15s;
          color: rgba(255,255,255,0.55);
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .ers-nav-item:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
        .ers-nav-item.active { background: rgba(0,191,166,0.18); color: #00BFA6; }

        .ers-contract-row {
          padding: 13px 20px;
          border-bottom: 1px solid #f1f4f8;
          cursor: pointer;
          transition: background 0.12s;
          display: grid;
          align-items: center;
          gap: 16px;
        }
        .ers-contract-row:hover { background: rgba(0,191,166,0.04); }
        .ers-contract-row:last-child { border-bottom: none; }

        .ers-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          white-space: nowrap;
          display: inline-block;
          letter-spacing: 0.02em;
        }

        .ers-lbl {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .ers-stat-card { border-left: 3px solid #00BFA6; }
        .ers-stat-card-pending { border-left: 3px solid #C4793A; }

        .ers-toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          z-index: 9999;
          animation: ersSlideUp 0.3s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        @keyframes ersSlideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* Sidebar scrollbar */
        .ers-sidebar::-webkit-scrollbar { width: 3px; }
        .ers-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
      `}</style>

      {/* Stage picker overlay + dropdown (fixed position, never clipped) */}
      {openStagePicker && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setOpenStagePicker(null)}
          />
          <div style={{
            position: 'fixed',
            top: openStagePicker.top,
            left: openStagePicker.left,
            zIndex: 100,
            background: '#ffffff',
            border: '1px solid #e8ecf0',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '4px 0',
            minWidth: 164,
          }}>
            {Object.entries(STAGE_LABELS).map(([s, label]) => {
              const stageNum = Number(s)
              const sc = STAGE_COLORS[stageNum] ?? '#94a3b8'
              const contract = contracts.find(c => c.id === openStagePicker.id)
              const isActive = contract ? stageNum === contract.stage : false
              return (
                <div
                  key={s}
                  style={{
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: isActive ? sc : '#334155',
                    background: isActive ? `${sc}14` : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f8f9fb' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  onClick={async () => {
                    const id = openStagePicker.id
                    setOpenStagePicker(null)
                    await updateContract(id, { stage: stageNum as any }, `Stage → ${label}`)
                    showToast(`Stage updated: ${label}`)
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0, display: 'inline-block' }} />
                  {label}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="ers-toast" style={{
          background: toast.type === 'success' ? '#f0fdf9' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#00BFA655' : '#e74c3c55'}`,
          color: toast.type === 'success' ? '#00a892' : '#e74c3c',
        }}>
          {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.msg}
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <DeleteContractModal
          contractRef={deleteTarget.ref}
          contractId={deleteTarget.id}
          onDeleted={async () => {
            setDeleteTarget(null)
            if (activeId === deleteTarget.id) { setActiveId(null); setView('dashboard') }
            await fetchContracts()
            showToast('Contract deleted')
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Sidebar ── */}
      <div className="ers-sidebar" style={{
        width: 230,
        background: '#0B2540',
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flexShrink: 0,
        overflowY: 'auto',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
      }}>
        {/* Logo block */}
        <div style={{
          background: '#ffffff',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }} onClick={() => { setView('dashboard'); setActiveId(null) }}>
          <img src="/logo.png" alt="Elias Range Stays" style={{ height: 44, width: 'auto', display: 'block' }} />
        </div>

        {/* App name */}
        <div style={{ padding: '0 10px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Contract<span style={{ color: '#00BFA6' }}>Flow</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginTop: 2 }}>
            HOUSING MGMT
          </div>
        </div>

        {/* Main nav */}
        {[
          { key: 'dashboard', icon: '▦', label: 'Dashboard' },
          { key: 'new',       icon: '+', label: 'New Contract' },
        ].map(n => (
          <div
            key={n.key}
            className={`ers-nav-item ${view === n.key && !activeId ? 'active' : ''}`}
            onClick={() => { setView(n.key as 'dashboard' | 'new'); setActiveId(null) }}
          >
            <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
          </div>
        ))}

        {/* Active contracts */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="ers-lbl" style={{ paddingLeft: 10, marginBottom: 8, color: 'rgba(255,255,255,0.3)' }}>Active</div>
          {contracts.filter(c => c.stage < 8).map(c => (
            <div
              key={c.id}
              className={`ers-nav-item ${activeId === c.id ? 'active' : ''}`}
              onClick={() => { setActiveId(c.id); setView('contract') }}
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
            >
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em' }}>{c.reference}</div>
              <div style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{c.client_name}</div>
            </div>
          ))}
        </div>

        {/* Owner nav — always visible */}
        <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
          {[
            { href: '/dashboard/units',       icon: '🏘️', label: 'Units',       disabled: false },
            { href: '/dashboard/ap-ar',        icon: '💰', label: 'AP / AR',     disabled: false },
            { href: '/dashboard/sourcing',     icon: '🔍', label: 'Sourcing',    disabled: false },
            { href: '/dashboard/team',         icon: '👥', label: 'Team',        disabled: true },
            { href: '/dashboard/contractors',  icon: '🤝', label: 'Contractors', disabled: true },
            { href: '/dashboard/kpi',          icon: '📊', label: 'KPI',         disabled: false },
            { href: '/dashboard/pipeline',      icon: '🚀', label: 'Pipeline',    disabled: false },
          ].map(({ href, icon, label, disabled }) => (
            <div key={href} className="ers-nav-item" style={disabled ? { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' } : {}} onClick={() => !disabled && (window.location.href = href)}>
              <span style={{ fontSize: 14 }}>{icon}</span>{label}
            </div>
          ))}
          <div className="ers-nav-item" onClick={() => window.open('/diagnostics', '_blank')}>
            <span style={{ fontSize: 14 }}>⚡</span>System Health
          </div>
        </div>

        {/* Footer of sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', paddingLeft: 10, fontFamily: 'IBM Plex Mono, monospace' }}>
            v1.2 · {contracts.length} contracts
          </div>
          <div style={{ padding: '10px 10px 4px', fontSize: 9, color: '#00BFA6', opacity: 0.7, letterSpacing: '0.04em', lineHeight: 1.4 }}>
            Healthy Living · Stronger Communities
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f8f9fb' }}>

        {/* Loading */}
        {(loading || roleLoading) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 13, color: '#94a3b8' }}>
            Loading...
          </div>
        )}

        {/* Dashboard */}
        {!loading && !roleLoading && view === 'dashboard' && (
          <div style={{ padding: '36px 40px' }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0B2540', letterSpacing: '-0.02em' }}>Dashboard</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                {new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* ── Row 1: Financial heroes ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
              <div className="ers-card ers-stat-card" style={{ padding: '18px 20px' }}>
                <div className="ers-lbl" style={{ marginBottom: 8 }}>MRR</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#00BFA6' }}>${mrr.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>monthly recurring revenue</div>
              </div>
              <div className="ers-card ers-stat-card" style={{ padding: '18px 20px' }}>
                <div className="ers-lbl" style={{ marginBottom: 8 }}>ARR</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#00BFA6' }}>${(arr / 1000).toFixed(0)}k</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>annual run rate</div>
              </div>
              <div className="ers-card ers-stat-card" style={{ padding: '18px 20px' }}>
                <div className="ers-lbl" style={{ marginBottom: 8 }}>Portfolio Value</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#00BFA6' }}>${(portfolioValue / 1000).toFixed(0)}k</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>signed + operational</div>
              </div>
              <div className="ers-card" style={{ padding: '18px 20px', borderLeft: '3px solid #F59E0B' }}>
                <div className="ers-lbl" style={{ marginBottom: 8 }}>Pipeline Value</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#F59E0B' }}>${(pipelineValue / 1000).toFixed(0)}k</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>quotes &amp; contracts out</div>
              </div>
            </div>

            {/* ── Row 2: Operations ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
              <div className="ers-card ers-stat-card" style={{ padding: '18px 20px' }}>
                <div className="ers-lbl" style={{ marginBottom: 8 }}>Units Under Mgmt</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0B2540' }}>{unitsUnderMgmt}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>operational units</div>
              </div>
              <div className="ers-card ers-stat-card" style={{ padding: '18px 20px' }}>
                <div className="ers-lbl" style={{ marginBottom: 8 }}>Active Contracts</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0B2540' }}>{stats.active}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>in progress</div>
              </div>
              <div className="ers-card ers-stat-card" style={{ padding: '18px 20px' }}>
                <div className="ers-lbl" style={{ marginBottom: 8 }}>Avg Rate / Unit</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0B2540' }}>${avgRatePerUnit.toFixed(0)}<span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>/mo</span></div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>per unit per month</div>
              </div>
              <div className="ers-card" style={{ padding: '18px 20px', borderLeft: `3px solid ${expiringSoon > 0 ? '#F59E0B' : '#00BFA6'}` }}>
                <div className="ers-lbl" style={{ marginBottom: 8 }}>Expiring in 60 Days</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: expiringSoon > 0 ? '#F59E0B' : '#0B2540' }}>{expiringSoon}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{expiringSoon > 0 ? 'action required' : `avg ${avgContractMonths}mo duration`}</div>
              </div>
            </div>

            {/* ── Pipeline stage bar ── */}
            <div className="ers-card" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div className="ers-lbl" style={{ marginRight: 8 }}>Pipeline</div>
              {Object.entries(STAGE_LABELS).map(([s, label]) => {
                const count = contracts.filter(c => c.stage === Number(s)).length
                const color = STAGE_COLORS[Number(s)] ?? '#94a3b8'
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: `${color}12`, border: `1px solid ${color}30`, cursor: 'pointer' }} onClick={() => setFilter('all')}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#334155', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['all', 'All'], ['pending', 'Pending Approval'], ['signing', 'Signing'], ['ops', 'Operations']].map(([k, l]) => (
                <button
                  key={k}
                  className={`ers-btn ers-btn-sm ${filter === k ? 'ers-btn-active' : 'ers-btn-ghost'}`}
                  onClick={() => setFilter(k)}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Contract table */}
            <div className="ers-card" style={{ overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: role === 'owner' ? '110px 1fr 130px 120px 120px 110px 60px' : '110px 1fr 130px 120px 120px 110px',
                padding: '10px 20px',
                borderBottom: '1px solid #e8ecf0',
                gap: 16,
                background: '#f8f9fb',
              }}>
                {['Reference', 'Client', 'Location', 'Dates', 'Stage', '', ...(role === 'owner' ? [''] : [])].map((h, i) => (
                  <div key={i} className="ers-lbl">{h}</div>
                ))}
              </div>

              {/* Contract rows */}
              {filtered.map(c => {
                const stageColor = STAGE_COLORS[c.stage] ?? '#94a3b8'
                return (
                  <div
                    key={c.id}
                    className="ers-contract-row"
                    style={{ gridTemplateColumns: role === 'owner' ? '110px 1fr 130px 120px 120px 110px 60px' : '110px 1fr 130px 120px 120px 110px' }}
                    onClick={() => { setActiveId(c.id); setView('contract') }}
                  >
                    {/* Reference */}
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#00BFA6', fontWeight: 600 }}>
                      {c.reference}
                    </div>
                    {/* Client */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0B2540' }}>{c.client_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{c.contact_name}{c.contact_name_2 ? ` · ${c.contact_name_2}` : ''}</div>
                    </div>
                    {/* Location */}
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.location.split('—')[0].trim()}</div>
                    {/* Dates */}
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
                      {c.start_date}<br />{c.end_date}
                    </div>
                    {/* Stage badge — clickable, dropdown rendered at root level */}
                    <div onClick={e => e.stopPropagation()}>
                      <span
                        className="ers-badge"
                        style={{
                          background: `${stageColor}18`,
                          border: `1px solid ${stageColor}44`,
                          color: stageColor,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                        onClick={e => {
                          if (openStagePicker?.id === c.id) { setOpenStagePicker(null); return }
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const dropdownH = 268
                          const openUp = rect.bottom + dropdownH > window.innerHeight
                          setOpenStagePicker({
                            id: c.id,
                            top: openUp ? rect.top - dropdownH : rect.bottom + 4,
                            left: rect.left,
                            openUp,
                          })
                        }}
                      >
                        {STAGE_LABELS[c.stage]} ▾
                      </span>
                    </div>
                    {/* Client link */}
                    <div onClick={e => e.stopPropagation()}>
                      <a href={`/client/${c.client_token}`} target="_blank" rel="noreferrer">
                        <button className="ers-btn ers-btn-outline ers-btn-sm">↗ Client</button>
                      </a>
                    </div>
                    {/* Delete (owner only) */}
                    {role === 'owner' && (
                      <div onClick={e => e.stopPropagation()}>
                        <button
                          className="ers-btn ers-btn-danger ers-btn-sm"
                          onClick={() => setDeleteTarget({ id: c.id, ref: c.reference })}
                          style={{ padding: '5px 10px', fontSize: 15 }}
                          title="Delete contract"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No contracts
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contract detail */}
        {!loading && !roleLoading && view === 'contract' && activeContract && (
          <ContractDetail
            contract={activeContract}
            onUpdate={updateContract}
            onRefresh={fetchContracts}
            showToast={showToast}
          />
        )}

        {/* New contract */}
        {!loading && !roleLoading && view === 'new' && (
          <NewContract
            onSave={async (data) => {
              const headers = await getAuthHeader()
              const res = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify(data),
              })
              const contract = await res.json()
              await fetchContracts()
              setActiveId(contract.id)
              setView('contract')
              showToast('Contract created')
            }}
          />
        )}
      </div>
    </div>
  )
}
