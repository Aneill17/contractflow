'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth'
import { useRole } from '@/components/UserRoleContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'contacted' | 'viewing_scheduled' | 'viewing_done' | 'offered' | 'secured' | 'passed'

interface Lead {
  id: string
  created_at: string
  title: string
  address?: string
  city?: string
  region?: string
  monthly_rent?: number
  furnished: boolean
  bedrooms?: number
  bathrooms?: number
  unit_type?: string
  available_date?: string
  listing_url?: string
  source?: string
  notes?: string
  status: LeadStatus
  contract_id?: string
  added_by?: string
  landlord_name?: string
  landlord_contact?: string
  viewing_date?: string
  monthly_cost_ers?: number
  nightly_rate_client?: number
}

interface Contract {
  id: string
  reference: string
  client_name: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'new',               label: 'New',              color: '#6B7280' },
  { key: 'contacted',         label: 'Contacted',        color: '#4F87A0' },
  { key: 'viewing_scheduled', label: 'Viewing Scheduled',color: '#4ECDC4' },
  { key: 'viewing_done',      label: 'Viewing Done',     color: '#45B7D1' },
  { key: 'offered',           label: 'Offered',          color: '#C9A84C' },
  { key: 'secured',           label: 'Secured ✅',       color: '#4CAF93' },
  { key: 'passed',            label: 'Passed ✗',         color: '#E84855' },
]

const SOURCE_COLORS: Record<string, string> = {
  facebook:   '#4267B2',
  kijiji:     '#E8411A',
  craigslist: '#8B5CF6',
  rentals_ca: '#4ECDC4',
  referral:   '#4CAF93',
  other:      '#6B7280',
}

const SOURCE_LABELS: Record<string, string> = {
  facebook:   'Facebook',
  kijiji:     'Kijiji',
  craigslist: 'Craigslist',
  rentals_ca: 'Rentals.ca',
  referral:   'Referral',
  other:      'Other',
}

const CITIES = ['Vancouver', 'Squamish', 'Kamloops', 'Prince George', 'Victoria', 'Kelowna']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / 86400000)
}

function kijijiUrl(city: string, furnished: boolean) {
  const q = encodeURIComponent(`${furnished ? 'furnished' : 'unfurnished'} rental ${city} BC`)
  return `https://www.kijiji.ca/b-for-rent/${city.toLowerCase().replace(/ /g, '-')}/k0c34l0?q=${q}`
}

function fbUrl(city: string) {
  return `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(`furnished rental ${city} BC`)}&category_id=120&availability=day`
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const src = lead.source || 'other'
  const stage = PIPELINE_STAGES.find(s => s.key === lead.status)
  return (
    <div
      onClick={onClick}
      style={{
        background: '#0C0E14',
        border: '1px solid #ffffff0D',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#C9A84C44')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#ffffff0D')}
    >
      <div style={{ fontSize: 12, color: '#DDD5C8', marginBottom: 6, fontWeight: 500, lineHeight: 1.3 }}>
        {lead.title}
      </div>
      {lead.address && (
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff55', marginBottom: 6 }}>
          {lead.address}{lead.city ? `, ${lead.city}` : ''}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {lead.monthly_rent && (
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#C9A84C' }}>
            ${lead.monthly_rent.toLocaleString()}/mo
          </span>
        )}
        {lead.bedrooms && (
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff44', marginLeft: 4 }}>
            {lead.bedrooms}bd
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Furnished badge */}
        <span style={{
          fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '2px 7px', borderRadius: 20,
          border: lead.furnished ? '1px solid #C9A84C88' : '1px solid #ffffff22',
          color: lead.furnished ? '#C9A84C' : '#ffffff33',
        }}>
          {lead.furnished ? 'Furnished' : 'Unfurnished'}
        </span>
        {/* Source badge */}
        <span style={{
          fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '2px 7px', borderRadius: 20,
          background: `${SOURCE_COLORS[src]}22`, border: `1px solid ${SOURCE_COLORS[src]}55`,
          color: SOURCE_COLORS[src],
        }}>
          {SOURCE_LABELS[src] || src}
        </span>
        {/* Days since */}
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff22', marginLeft: 'auto' }}>
          {daysSince(lead.created_at)}d ago
        </span>
      </div>
    </div>
  )
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function LeadDrawer({
  lead,
  contracts,
  role,
  onClose,
  onSave,
  onDelete,
}: {
  lead: Lead
  contracts: Contract[]
  role: string
  onClose: () => void
  onSave: (id: string, patch: Partial<Lead>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [form, setForm] = useState<Lead>({ ...lead })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (k: keyof Lead, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(lead.id, form)
    setSaving(false)
  }

  const handleSecure = async () => {
    setSaving(true)
    await onSave(lead.id, { ...form, status: 'secured' })
    setSaving(false)
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'IBM Plex Mono', fontSize: 9, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: '#ffffff33', marginBottom: 4, display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0C0E14', border: '1px solid #ffffff0D',
    borderRadius: 6, padding: '8px 10px', color: '#DDD5C8',
    fontFamily: 'IBM Plex Mono', fontSize: 12, outline: 'none',
    boxSizing: 'border-box',
  }
  const rowStyle: React.CSSProperties = { marginBottom: 14 }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: '#13161D', borderLeft: '1px solid #ffffff0D',
      zIndex: 1000, overflowY: 'auto', padding: 24,
      boxShadow: '-8px 0 32px #00000066',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 18, color: '#DDD5C8', fontWeight: 700 }}>
          Lead Detail
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff44', fontSize: 20, cursor: 'pointer' }}>×</button>
      </div>

      {/* Status dropdown */}
      <div style={rowStyle}>
        <label style={labelStyle}>Status</label>
        <select value={form.status} onChange={e => set('status', e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          {PIPELINE_STAGES.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div style={rowStyle}>
        <label style={labelStyle}>Title</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
      </div>

      {/* Address + City */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Address</label>
          <input value={form.address || ''} onChange={e => set('address', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>City</label>
          <input value={form.city || ''} onChange={e => set('city', e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Rent + Bedrooms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Monthly Rent</label>
          <input type="number" value={form.monthly_rent || ''} onChange={e => set('monthly_rent', parseFloat(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bedrooms</label>
          <input type="number" value={form.bedrooms || ''} onChange={e => set('bedrooms', parseInt(e.target.value))} style={inputStyle} />
        </div>
      </div>

      {/* ERS Cost + Nightly rate */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>ERS Monthly Cost</label>
          <input type="number" value={form.monthly_cost_ers || ''} onChange={e => set('monthly_cost_ers', parseFloat(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Nightly Rate (Client)</label>
          <input type="number" value={form.nightly_rate_client || 105} onChange={e => set('nightly_rate_client', parseFloat(e.target.value))} style={inputStyle} />
        </div>
      </div>

      {/* Furnished + Source */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Furnished</label>
          <select value={form.furnished ? 'yes' : 'no'} onChange={e => set('furnished', e.target.value === 'yes')} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Source</label>
          <select value={form.source || 'other'} onChange={e => set('source', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Viewing date */}
      <div style={rowStyle}>
        <label style={labelStyle}>Viewing Date</label>
        <input type="datetime-local"
          value={form.viewing_date ? form.viewing_date.substring(0, 16) : ''}
          onChange={e => set('viewing_date', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          style={inputStyle} />
      </div>

      {/* Landlord */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Landlord Name</label>
          <input value={form.landlord_name || ''} onChange={e => set('landlord_name', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Landlord Contact</label>
          <input value={form.landlord_contact || ''} onChange={e => set('landlord_contact', e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Listing URL */}
      <div style={rowStyle}>
        <label style={labelStyle}>Listing URL</label>
        <input value={form.listing_url || ''} onChange={e => set('listing_url', e.target.value)} style={inputStyle} placeholder="https://..." />
      </div>

      {/* Link to contract */}
      <div style={rowStyle}>
        <label style={labelStyle}>Link to Contract</label>
        <select value={form.contract_id || ''} onChange={e => set('contract_id', e.target.value || undefined)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">— None —</option>
          {contracts.map(c => (
            <option key={c.id} value={c.id}>{c.reference} — {c.client_name}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div style={rowStyle}>
        <label style={labelStyle}>Notes</label>
        <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {/* Mark Secured CTA */}
        {form.status !== 'secured' && form.status !== 'passed' && (
          <button onClick={handleSecure} disabled={saving} style={{
            background: '#4CAF93', color: '#0C0E14', border: 'none', borderRadius: 7,
            padding: '12px 20px', fontFamily: 'IBM Plex Mono', fontSize: 12,
            fontWeight: 700, letterSpacing: '0.07em', cursor: 'pointer', width: '100%',
          }}>
            ✅ Mark Secured
          </button>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          background: '#C9A84C', color: '#0C0E14', border: 'none', borderRadius: 7,
          padding: '10px 20px', fontFamily: 'IBM Plex Mono', fontSize: 12,
          fontWeight: 500, letterSpacing: '0.07em', cursor: 'pointer', width: '100%',
        }}>
          {saving ? 'Saving…' : '💾 Save Changes'}
        </button>

        {role === 'owner' && (
          <>
            {confirmDelete ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={async () => { await onDelete(lead.id); onClose() }} style={{
                  flex: 1, background: '#E84855', color: '#fff', border: 'none', borderRadius: 7,
                  padding: '8px', fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer',
                }}>Confirm Delete</button>
                <button onClick={() => setConfirmDelete(false)} style={{
                  flex: 1, background: 'transparent', color: '#ffffff44', border: '1px solid #ffffff22',
                  borderRadius: 7, padding: '8px', fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{
                background: 'transparent', color: '#E84855', border: '1px solid #E8485544',
                borderRadius: 7, padding: '8px 20px', fontFamily: 'IBM Plex Mono', fontSize: 11,
                cursor: 'pointer', width: '100%',
              }}>
                Delete Lead
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Quick Add Form ───────────────────────────────────────────────────────────

function QuickAddForm({ onAdd }: { onAdd: (lead: Partial<Lead>) => Promise<void> }) {
  const [form, setForm] = useState({
    title: '', address: '', city: '', monthly_rent: '',
    furnished: false, bedrooms: '', source: 'other',
    listing_url: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await onAdd({
      title: form.title,
      address: form.address || undefined,
      city: form.city || undefined,
      monthly_rent: form.monthly_rent ? parseFloat(form.monthly_rent) : undefined,
      furnished: form.furnished,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
      source: form.source,
      listing_url: form.listing_url || undefined,
      notes: form.notes || undefined,
    })
    setForm({ title: '', address: '', city: '', monthly_rent: '', furnished: false, bedrooms: '', source: 'other', listing_url: '', notes: '' })
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    background: '#0C0E14', border: '1px solid #ffffff0D', borderRadius: 6,
    padding: '8px 10px', color: '#DDD5C8', fontFamily: 'IBM Plex Mono', fontSize: 12,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '20px 24px', marginTop: 24 }}>
      <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 15, color: '#DDD5C8', fontWeight: 700, marginBottom: 16 }}>
        ➕ Quick Add Lead
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 10 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Title / Listing name *" style={inputStyle} />
          </div>
          <input value={form.address} onChange={e => set('address', e.target.value)}
            placeholder="Address" style={inputStyle} />
          <input value={form.city} onChange={e => set('city', e.target.value)}
            placeholder="City" style={inputStyle} />
          <input type="number" value={form.monthly_rent} onChange={e => set('monthly_rent', e.target.value)}
            placeholder="Monthly rent ($)" style={inputStyle} />
          <input type="number" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}
            placeholder="Bedrooms" style={inputStyle} />
          <select value={form.source} onChange={e => set('source', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={form.listing_url} onChange={e => set('listing_url', e.target.value)}
            placeholder="Listing URL" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#ffffff55', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.furnished} onChange={e => set('furnished', e.target.checked)} />
            Furnished
          </label>
        </div>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Notes…" rows={2}
          style={{ ...inputStyle, resize: 'vertical', width: '100%', marginBottom: 10 }} />
        <button type="submit" disabled={saving} style={{
          background: '#C9A84C', color: '#0C0E14', border: 'none', borderRadius: 7,
          padding: '10px 24px', fontFamily: 'IBM Plex Mono', fontSize: 12,
          fontWeight: 700, letterSpacing: '0.07em', cursor: 'pointer',
        }}>
          {saving ? 'Adding…' : 'Add to Pipeline →'}
        </button>
      </form>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SourcingPage() {
  const { role, loading: roleLoading } = useRole()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  const fetchLeads = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/sourcing', { headers })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load leads:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchContracts = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/contracts', { headers })
      if (!res.ok) return
      const data = await res.json()
      setContracts(Array.isArray(data) ? data : [])
    } catch { }
  }, [])

  useEffect(() => {
    if (!roleLoading) {
      fetchLeads()
      fetchContracts()
    }
  }, [roleLoading, fetchLeads, fetchContracts])

  const saveLead = async (id: string, patch: Partial<Lead>) => {
    const headers = await getAuthHeaders()
    const res = await fetch(`/api/sourcing/${id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const updated = await res.json()
    if (!res.ok) { showToast(updated.error || 'Save failed', 'error'); return }
    await fetchLeads()
    // Sync drawer
    setSelectedLead(l => l?.id === id ? { ...l, ...updated } : l)
    showToast('Saved')
  }

  const deleteLead = async (id: string) => {
    const headers = await getAuthHeaders()
    await fetch(`/api/sourcing/${id}`, { method: 'DELETE', headers })
    await fetchLeads()
    showToast('Lead deleted')
  }

  const addLead = async (data: Partial<Lead>) => {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/sourcing', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const newLead = await res.json()
    if (!res.ok) { showToast(newLead.error || 'Failed to add', 'error'); return }
    await fetchLeads()
    showToast('Lead added to pipeline')
  }

  if (roleLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0C0E14', fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#ffffff33' }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0C0E14' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0C0E14; }
        ::-webkit-scrollbar-thumb { background: #ffffff22; border-radius: 3px; }
        .nav-item { padding: 8px 14px; border-radius: 7px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.08em; transition: all 0.15s; color: #ffffff44; display: flex; align-items: center; gap: 8px; }
        .nav-item:hover { background: #ffffff08; color: #DDD5C8; }
        .nav-item.active { background: #C9A84C18; color: #C9A84C; }
        .lbl { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #ffffff33; }
        .toast { position: fixed; bottom: 28px; right: 28px; padding: 12px 20px; border-radius: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; z-index: 9999; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .kanban-col { min-width: 200px; flex: 1; background: #13161D; border: 1px solid #ffffff0D; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; }
        .kanban-col-header { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
      `}</style>

      {toast && (
        <div className="toast" style={{ background: toast.type === 'success' ? '#1a3a2a' : '#3a1a1a', border: `1px solid ${toast.type === 'success' ? '#4CAF9355' : '#E8485555'}`, color: toast.type === 'success' ? '#4CAF93' : '#E84855' }}>
          {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 220, borderRight: '1px solid #ffffff0A', padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <div style={{ padding: '4px 14px 20px' }}>
          <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 11, fontWeight: 700, color: '#4F87A0', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
            Elias Range Stays
          </div>
          <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 18, fontWeight: 700, color: '#DDD5C8', lineHeight: 1 }}>
            Contract<span style={{ color: '#C9A84C' }}>Flow</span>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff22', letterSpacing: '0.18em', marginTop: 4 }}>HOUSING MGMT</div>
        </div>

        {[
          { href: '/', icon: '▦', label: 'Dashboard' },
          { href: '/dashboard/units', icon: '🏘️', label: 'Units' },
          { href: '/dashboard/ap-ar', icon: '💰', label: 'AP / AR' },
          { href: '/dashboard/sourcing', icon: '🔍', label: 'Sourcing', active: true },
        ].map(n => (
          <div
            key={n.href}
            className={`nav-item ${n.active ? 'active' : ''}`}
            onClick={() => { window.location.href = n.href }}
          >
            <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
          </div>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #ffffff08' }}>
          <div className="nav-item" onClick={() => window.location.href = '/'} style={{ fontSize: 10, color: '#ffffff22' }}>
            ← Back to Contracts
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 30, color: '#DDD5C8', fontWeight: 700 }}>
            Unit Sourcing
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#ffffff33', marginTop: 2 }}>
            {leads.length} leads · {leads.filter(l => l.status === 'secured').length} secured · {leads.filter(l => l.status === 'new').length} new
          </div>
        </div>

        {/* ── LIVE FEED PANEL ─────────────────────────────────────────────── */}
        <LiveFeedPanel onAddToPipeline={addLead} />

        {/* ── PIPELINE BOARD ──────────────────────────────────────────────── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 18, color: '#DDD5C8', fontWeight: 700, marginBottom: 16 }}>
            Pipeline Board
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12 }}>
            {PIPELINE_STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.status === stage.key)
              return (
                <div key={stage.key} className="kanban-col">
                  <div className="kanban-col-header">
                    <span style={{ color: stage.color }}>{stage.label}</span>
                    <span style={{ color: '#ffffff33', fontSize: 10 }}>{stageLeads.length}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: 500 }}>
                    {stageLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => setSelectedLead(lead)}
                      />
                    ))}
                    {stageLeads.length === 0 && (
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff22', textAlign: 'center', paddingTop: 20 }}>
                        empty
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── QUICK ADD FORM ───────────────────────────────────────────────── */}
        <QuickAddForm onAdd={addLead} />
      </div>

      {/* Detail Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          contracts={contracts}
          role={role || 'staff'}
          onClose={() => setSelectedLead(null)}
          onSave={saveLead}
          onDelete={deleteLead}
        />
      )}
    </div>
  )
}

// ─── Live Feed Panel ──────────────────────────────────────────────────────────

function LiveFeedPanel({ onAddToPipeline }: { onAddToPipeline: (lead: Partial<Lead>) => Promise<void> }) {
  const [rssItems, setRssItems] = useState<{ title: string; url: string; date: string; price: string }[]>([])
  const [rssError, setRssError] = useState(false)
  const [rssLoading, setRssLoading] = useState(false)

  useEffect(() => {
    setRssLoading(true)
    // Try to fetch Craigslist RSS via a public CORS proxy
    const CORS_PROXY = 'https://api.allorigins.win/get?url='
    const CL_URL = encodeURIComponent('https://vancouver.craigslist.org/search/apa?format=rss&hasPic=1&availabilityMode=0')

    fetch(`${CORS_PROXY}${CL_URL}`)
      .then(r => r.json())
      .then(json => {
        const xml = json.contents
        if (!xml) throw new Error('no content')
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'application/xml')
        const items = Array.from(doc.querySelectorAll('item'))
        const parsed = items.slice(0, 20).map(item => {
          const title = item.querySelector('title')?.textContent?.trim() || 'No title'
          const url = item.querySelector('link')?.textContent?.trim() || '#'
          const date = item.querySelector('pubDate')?.textContent?.trim() || ''
          const desc = item.querySelector('description')?.textContent || ''
          const priceMatch = desc.match(/\$[\d,]+/)
          const price = priceMatch ? priceMatch[0] : ''
          return { title, url, date, price }
        })
        setRssItems(parsed)
        setRssLoading(false)
      })
      .catch(() => {
        setRssError(true)
        setRssLoading(false)
      })
  }, [])

  const cardStyle: React.CSSProperties = {
    background: '#13161D', border: '1px solid #ffffff0D',
    borderRadius: 10, padding: '20px 24px',
  }

  const quickLinkBtn: React.CSSProperties = {
    display: 'inline-block', padding: '7px 14px', borderRadius: 6,
    fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.08em',
    textDecoration: 'none', marginRight: 6, marginBottom: 6,
    cursor: 'pointer', transition: 'opacity 0.15s',
    border: '1px solid #ffffff22', color: '#ffffff77',
    background: '#ffffff08',
  }

  return (
    <div style={{ ...cardStyle }}>
      <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 18, color: '#DDD5C8', fontWeight: 700, marginBottom: 4 }}>
        🌐 Live Listing Feed
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff33', marginBottom: 20 }}>
        Auto-pulled from Craigslist · Quick links to Kijiji &amp; Facebook Marketplace
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left — Craigslist */}
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.12em', color: '#8B5CF6', textTransform: 'uppercase', marginBottom: 12 }}>
            Craigslist — Vancouver
          </div>

          {rssLoading && (
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#ffffff33' }}>Fetching listings…</div>
          )}

          {!rssLoading && rssError && (
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#ffffff44', marginBottom: 10 }}>
                Live fetch unavailable (CORS). Open Craigslist directly:
              </div>
              {CITIES.map(city => (
                <a
                  key={city}
                  href={`https://vancouver.craigslist.org/search/apa?query=${encodeURIComponent(city)}&hasPic=1`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...quickLinkBtn, borderColor: '#8B5CF644', color: '#8B5CF6', background: '#8B5CF611' }}
                >
                  🔗 {city} apartments
                </a>
              ))}
            </div>
          )}

          {!rssLoading && !rssError && rssItems.length > 0 && (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {rssItems.map((item, i) => (
                <div key={i} style={{
                  background: '#0C0E14', border: '1px solid #ffffff0D', borderRadius: 7,
                  padding: '10px 12px', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#DDD5C8', lineHeight: 1.4 }}>{item.title}</div>
                    {item.price && (
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#C9A84C', marginTop: 3 }}>{item.price}</div>
                    )}
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff33', marginTop: 2 }}>
                      {item.date ? new Date(item.date).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <a href={item.url} target="_blank" rel="noreferrer" style={{
                      fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#8B5CF6',
                      textDecoration: 'none', padding: '3px 8px', border: '1px solid #8B5CF644',
                      borderRadius: 4, background: '#8B5CF611',
                    }}>↗ View</a>
                    <button
                      onClick={() => onAddToPipeline({ title: item.title, listing_url: item.url, source: 'craigslist' })}
                      style={{
                        fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#C9A84C',
                        background: '#C9A84C11', border: '1px solid #C9A84C44',
                        borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
                      }}
                    >+ Pipeline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Kijiji + Facebook quick links */}
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.12em', color: '#E8411A', textTransform: 'uppercase', marginBottom: 12 }}>
            Kijiji Quick Search
          </div>
          <div style={{ marginBottom: 16 }}>
            {CITIES.map(city => (
              <div key={city} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                <a href={kijijiUrl(city, true)} target="_blank" rel="noreferrer"
                  style={{ ...quickLinkBtn, borderColor: '#E8411A44', color: '#E8411A', background: '#E8411A11' }}>
                  🔑 Furnished · {city}
                </a>
                <a href={kijijiUrl(city, false)} target="_blank" rel="noreferrer"
                  style={{ ...quickLinkBtn, borderColor: '#ffffff22', color: '#ffffff55' }}>
                  Unfurnished · {city}
                </a>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.12em', color: '#4267B2', textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>
            Facebook Marketplace
          </div>
          <div>
            {CITIES.map(city => (
              <a key={city} href={fbUrl(city)} target="_blank" rel="noreferrer"
                style={{ ...quickLinkBtn, borderColor: '#4267B244', color: '#4267B2', background: '#4267B211' }}>
                📘 {city}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
