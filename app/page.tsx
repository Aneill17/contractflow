'use client'

import { useEffect, useState } from 'react'
import { Contract, STAGE_LABELS, STAGE_COLORS, calcTotal, formatDate } from '@/lib/types'
import ContractDetail from '@/components/ContractDetail'
import NewContract from '@/components/NewContract'

export default function HomePage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'dashboard' | 'contract' | 'new'>('dashboard')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  const fetchContracts = async () => {
    const res = await fetch('/api/contracts')
    const data = await res.json()
    setContracts(data)
    setLoading(false)
  }

  useEffect(() => { fetchContracts() }, [])

  const updateContract = async (id: string, patch: Partial<Contract>, auditMsg?: string) => {
    await fetch(`/api/contracts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...patch, audit_action: auditMsg, actor: 'Team' }),
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0C0E14' }}>
      <style>{`
        .card { background: #13161D; border: 1px solid #ffffff0D; border-radius: 10px; }
        .card-accent { background: #13161D; border: 1px solid #C9A84C2A; border-radius: 10px; }
        .btn { border: none; border-radius: 7px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.07em; padding: 10px 20px; transition: all 0.18s; }
        .btn-gold { background: #C9A84C; color: #0C0E14; font-weight: 500; }
        .btn-gold:hover { background: #DDB85C; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: #C9A84C; border: 1px solid #C9A84C44; }
        .btn-ghost:hover { background: #C9A84C11; border-color: #C9A84C88; }
        .btn-sm { padding: 6px 14px; font-size: 11px; }
        .nav-item { padding: 8px 14px; border-radius: 7px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.08em; transition: all 0.15s; color: #ffffff44; display: flex; align-items: center; gap: 8px; }
        .nav-item:hover { background: #ffffff08; color: #DDD5C8; }
        .nav-item.active { background: #C9A84C18; color: #C9A84C; }
        .contract-row { padding: 14px 20px; border-bottom: 1px solid #ffffff08; cursor: pointer; transition: background 0.15s; display: grid; grid-template-columns: 110px 1fr 130px 120px 110px 90px; align-items: center; gap: 16px; }
        .contract-row:hover { background: #ffffff05; }
        .stage-badge { font-family: 'IBM Plex Mono', monospace; font-size: 10px; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.08em; white-space: nowrap; display: inline-block; }
        .lbl { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #ffffff33; }
        .toast { position: fixed; bottom: 28px; right: 28px; padding: 12px 20px; border-radius: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; z-index: 9999; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {toast && (
        <div className="toast" style={{ background: toast.type === 'success' ? '#1a3a2a' : '#3a1a1a', border: `1px solid ${toast.type === 'success' ? '#4CAF9355' : '#e74c3c55'}`, color: toast.type === 'success' ? '#4CAF93' : '#e74c3c' }}>
          {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 220, borderRight: '1px solid #ffffff0A', padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <div style={{ padding: '4px 14px 20px' }}>
          <div className="pf" style={{ fontSize: 18, color: '#DDD5C8' }}>Contract<span style={{ color: '#C9A84C' }}>Flow</span></div>
          <div className="mono" style={{ fontSize: 9, color: '#ffffff22', letterSpacing: '0.18em', marginTop: 2 }}>HOUSING MGMT</div>
        </div>
        {[{ key: 'dashboard', icon: '▦', label: 'Dashboard' }, { key: 'new', icon: '+', label: 'New Contract' }].map(n => (
          <div key={n.key} className={`nav-item ${view === n.key && !activeId ? 'active' : ''}`} onClick={() => { setView(n.key as any); setActiveId(null); }}>
            <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
          </div>
        ))}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #ffffff08' }}>
          <div className="lbl" style={{ paddingLeft: 14, marginBottom: 8 }}>Active</div>
          {contracts.filter(c => c.stage < 8).map(c => (
            <div key={c.id} className={`nav-item ${activeId === c.id ? 'active' : ''}`}
              onClick={() => { setActiveId(c.id); setView('contract'); }}
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <div style={{ fontSize: 10, color: '#ffffff33' }}>{c.reference}</div>
              <div style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{c.client_name}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: '14px 14px 0', borderTop: '1px solid #ffffff08' }}>
          <div className="mono" style={{ fontSize: 9, color: '#ffffff22' }}>v1.0 · {contracts.length} contracts</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#ffffff33' }}>
            Loading contracts...
          </div>
        )}

        {!loading && view === 'dashboard' && (
          <div style={{ padding: '32px 36px' }}>
            <div style={{ marginBottom: 28 }}>
              <div className="pf" style={{ fontSize: 30 }}>Dashboard</div>
              <div className="mono" style={{ fontSize: 11, color: '#ffffff33', marginTop: 2 }}>{new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Total Contracts', value: stats.total, sub: 'all time' },
                { label: 'Active', value: stats.active, sub: 'in progress' },
                { label: 'Pending Approval', value: stats.pending, sub: 'awaiting client', accent: stats.pending > 0 },
                { label: 'Total Value', value: `$${(stats.value / 1000).toFixed(0)}k`, sub: 'under management' },
              ].map((s, i) => (
                <div key={i} className={s.accent ? 'card-accent' : 'card'} style={{ padding: '18px 20px' }}>
                  <div className="lbl" style={{ marginBottom: 8 }}>{s.label}</div>
                  <div className="pf" style={{ fontSize: 28, color: s.accent ? '#C9A84C' : '#DDD5C8' }}>{s.value}</div>
                  <div className="mono" style={{ fontSize: 10, color: '#ffffff22', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['all','All'],['pending','Pending Approval'],['signing','Signing'],['ops','Operations']].map(([k,l]) => (
                <button key={k} className={`btn btn-sm ${filter === k ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 130px 120px 110px 90px', padding: '10px 20px', borderBottom: '1px solid #ffffff08', gap: 16 }}>
                {['Reference','Client','Location','Dates','Stage',''].map((h,i) => <div key={i} className="lbl">{h}</div>)}
              </div>
              {filtered.map(c => (
                <div key={c.id} className="contract-row" onClick={() => { setActiveId(c.id); setView('contract'); }}>
                  <div className="mono" style={{ fontSize: 11, color: '#C9A84C' }}>{c.reference}</div>
                  <div>
                    <div style={{ fontSize: 13 }}>{c.client_name}</div>
                    <div className="mono" style={{ fontSize: 10, color: '#ffffff33' }}>{c.contact_name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#ffffff77' }}>{c.location.split('—')[0].trim()}</div>
                  <div className="mono" style={{ fontSize: 10, color: '#ffffff55' }}>{c.start_date}<br/>{c.end_date}</div>
                  <div>
                    <div className="stage-badge" style={{ background: `${STAGE_COLORS[c.stage]}18`, border: `1px solid ${STAGE_COLORS[c.stage]}44`, color: STAGE_COLORS[c.stage] }}>
                      {STAGE_LABELS[c.stage]}
                    </div>
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <a href={`/client/${c.client_token}`} target="_blank" rel="noreferrer">
                      <button className="btn btn-ghost btn-sm">↗ Client</button>
                    </a>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#ffffff33', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>No contracts</div>}
            </div>
          </div>
        )}

        {!loading && view === 'contract' && activeContract && (
          <ContractDetail
            contract={activeContract}
            onUpdate={updateContract}
            onRefresh={fetchContracts}
            showToast={showToast}
          />
        )}

        {!loading && view === 'new' && (
          <NewContract
            onSave={async (data) => {
              const res = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
