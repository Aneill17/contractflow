'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
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
  work_site_lat?: number
  work_site_lng?: number
  work_site_address?: string
}

interface SearchResult {
  id: string
  source: string
  title: string
  url: string
  price: number | null
  bedrooms: number | null
  posted_date: string
  thumbnail: string | null
  score: number
  score_reasons: string[]
  description?: string
}

interface SearchResponse {
  results: SearchResult[]
  kijiji_links: { label: string; url: string }[]
  facebook_links: { label: string; url: string }[]
  total_fetched: number
  total_after_filter: number
  sources_searched: string[]
  sources_errored?: string[]
  regions_tried?: string[]
}

interface SearchConfig {
  contract_id: string
  work_site_lat: number | null
  work_site_lng: number | null
  work_site_address: string
  radius_km: number
  bedrooms_min: number
  bedrooms_max: number
  bathrooms_min: number
  furnished: 'yes' | 'no' | 'either'
  unit_types: string[]
  max_monthly_rent: number
  require_parking: boolean
  require_modern: boolean
  min_photos: boolean
  exclude_bad: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WorksiteMap = dynamic(() => import('@/components/WorksiteMap'), { ssr: false })

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

const UNIT_TYPES = ['Apartment', 'House', 'Townhouse', 'Basement Suite', 'Garden Suite']

const DEFAULT_SEARCH: SearchConfig = {
  contract_id: '',
  work_site_lat: null,
  work_site_lng: null,
  work_site_address: '',
  radius_km: 20,
  bedrooms_min: 2,
  bedrooms_max: 3,
  bathrooms_min: 1,
  furnished: 'either',
  unit_types: ['Apartment', 'House', 'Townhouse', 'Basement Suite'],
  max_monthly_rent: 2800,
  require_parking: true,
  require_modern: true,
  min_photos: true,
  exclude_bad: true,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / 86400000)
}

function scoreColor(score: number): string {
  if (score >= 80) return '#4CAF93'
  if (score >= 60) return '#C9A84C'
  return '#6B7280'
}

function marginColor(margin: number): string {
  if (margin >= 35) return '#4CAF93'
  if (margin >= 20) return '#C9A84C'
  return '#E84855'
}

function coverageKm2(radius: number): string {
  return Math.round(Math.PI * radius * radius).toLocaleString()
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-')
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const src = lead.source || 'other'
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
        <span style={{
          fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '2px 7px', borderRadius: 20,
          border: lead.furnished ? '1px solid #C9A84C88' : '1px solid #ffffff22',
          color: lead.furnished ? '#C9A84C' : '#ffffff33',
        }}>
          {lead.furnished ? 'Furnished' : 'Unfurnished'}
        </span>
        <span style={{
          fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '2px 7px', borderRadius: 20,
          background: `${SOURCE_COLORS[src]}22`, border: `1px solid ${SOURCE_COLORS[src]}55`,
          color: SOURCE_COLORS[src],
        }}>
          {SOURCE_LABELS[src] || src}
        </span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff22', marginLeft: 'auto' }}>
          {daysSince(lead.created_at)}d ago
        </span>
      </div>
    </div>
  )
}

// ─── Lead Drawer ──────────────────────────────────────────────────────────────

function LeadDrawer({
  lead, contracts, role, onClose, onSave, onDelete,
}: {
  lead: Lead; contracts: Contract[]; role: string
  onClose: () => void
  onSave: (id: string, patch: Partial<Lead>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [form, setForm] = useState<Lead>({ ...lead })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (k: keyof Lead, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => { setSaving(true); await onSave(lead.id, form); setSaving(false) }
  const handleSecure = async () => { setSaving(true); await onSave(lead.id, { ...form, status: 'secured' }); setSaving(false) }

  const labelStyle: React.CSSProperties = { fontFamily: 'IBM Plex Mono', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff33', marginBottom: 4, display: 'block' }
  const inputStyle: React.CSSProperties = { width: '100%', background: '#0C0E14', border: '1px solid #ffffff0D', borderRadius: 6, padding: '8px 10px', color: '#DDD5C8', fontFamily: 'IBM Plex Mono', fontSize: 12, outline: 'none', boxSizing: 'border-box' }
  const rowStyle: React.CSSProperties = { marginBottom: 14 }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: '#13161D', borderLeft: '1px solid #ffffff0D', zIndex: 1000, overflowY: 'auto', padding: 24, boxShadow: '-8px 0 32px #00000066' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 18, color: '#DDD5C8', fontWeight: 700 }}>Lead Detail</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff44', fontSize: 20, cursor: 'pointer' }}>×</button>
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Status</label>
        <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Title</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div><label style={labelStyle}>Address</label><input value={form.address || ''} onChange={e => set('address', e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>City</label><input value={form.city || ''} onChange={e => set('city', e.target.value)} style={inputStyle} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div><label style={labelStyle}>Monthly Rent</label><input type="number" value={form.monthly_rent || ''} onChange={e => set('monthly_rent', parseFloat(e.target.value))} style={inputStyle} /></div>
        <div><label style={labelStyle}>Bedrooms</label><input type="number" value={form.bedrooms || ''} onChange={e => set('bedrooms', parseInt(e.target.value))} style={inputStyle} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div><label style={labelStyle}>ERS Monthly Cost</label><input type="number" value={form.monthly_cost_ers || ''} onChange={e => set('monthly_cost_ers', parseFloat(e.target.value))} style={inputStyle} /></div>
        <div><label style={labelStyle}>Nightly Rate (Client)</label><input type="number" value={form.nightly_rate_client || 105} onChange={e => set('nightly_rate_client', parseFloat(e.target.value))} style={inputStyle} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Furnished</label>
          <select value={form.furnished ? 'yes' : 'no'} onChange={e => set('furnished', e.target.value === 'yes')} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Source</label>
          <select value={form.source || 'other'} onChange={e => set('source', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Viewing Date</label>
        <input type="datetime-local" value={form.viewing_date ? form.viewing_date.substring(0, 16) : ''} onChange={e => set('viewing_date', e.target.value ? new Date(e.target.value).toISOString() : undefined)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div><label style={labelStyle}>Landlord Name</label><input value={form.landlord_name || ''} onChange={e => set('landlord_name', e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>Landlord Contact</label><input value={form.landlord_contact || ''} onChange={e => set('landlord_contact', e.target.value)} style={inputStyle} /></div>
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Listing URL</label>
        <input value={form.listing_url || ''} onChange={e => set('listing_url', e.target.value)} style={inputStyle} placeholder="https://..." />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Link to Contract</label>
        <select value={form.contract_id || ''} onChange={e => set('contract_id', e.target.value || undefined)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">— None —</option>
          {contracts.map(c => <option key={c.id} value={c.id}>{c.reference} — {c.client_name}</option>)}
        </select>
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Notes</label>
        <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {form.status !== 'secured' && form.status !== 'passed' && (
          <button onClick={handleSecure} disabled={saving} style={{ background: '#4CAF93', color: '#0C0E14', border: 'none', borderRadius: 7, padding: '12px 20px', fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', cursor: 'pointer', width: '100%' }}>
            ✅ Mark Secured
          </button>
        )}
        <button onClick={handleSave} disabled={saving} style={{ background: '#C9A84C', color: '#0C0E14', border: 'none', borderRadius: 7, padding: '10px 20px', fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 500, letterSpacing: '0.07em', cursor: 'pointer', width: '100%' }}>
          {saving ? 'Saving…' : '💾 Save Changes'}
        </button>
        {role === 'owner' && (
          confirmDelete ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={async () => { await onDelete(lead.id); onClose() }} style={{ flex: 1, background: '#E84855', color: '#fff', border: 'none', borderRadius: 7, padding: '8px', fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer' }}>Confirm Delete</button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, background: 'transparent', color: '#ffffff44', border: '1px solid #ffffff22', borderRadius: 7, padding: '8px', fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={{ background: 'transparent', color: '#E84855', border: '1px solid #E8485544', borderRadius: 7, padding: '8px 20px', fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer', width: '100%' }}>
              Delete Lead
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ─── Quick Add Form ───────────────────────────────────────────────────────────

function QuickAddForm({ onAdd }: { onAdd: (lead: Partial<Lead>) => Promise<void> }) {
  const [form, setForm] = useState({ title: '', address: '', city: '', monthly_rent: '', furnished: false, bedrooms: '', source: 'other', listing_url: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await onAdd({ title: form.title, address: form.address || undefined, city: form.city || undefined, monthly_rent: form.monthly_rent ? parseFloat(form.monthly_rent) : undefined, furnished: form.furnished, bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined, source: form.source, listing_url: form.listing_url || undefined, notes: form.notes || undefined })
    setForm({ title: '', address: '', city: '', monthly_rent: '', furnished: false, bedrooms: '', source: 'other', listing_url: '', notes: '' })
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = { background: '#0C0E14', border: '1px solid #ffffff0D', borderRadius: 6, padding: '8px 10px', color: '#DDD5C8', fontFamily: 'IBM Plex Mono', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '20px 24px', marginTop: 24 }}>
      <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 15, color: '#DDD5C8', fontWeight: 700, marginBottom: 16 }}>
        ➕ Quick Add Lead
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 10 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Title / Listing name *" style={inputStyle} />
          </div>
          <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Address" style={inputStyle} />
          <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" style={inputStyle} />
          <input type="number" value={form.monthly_rent} onChange={e => set('monthly_rent', e.target.value)} placeholder="Monthly rent ($)" style={inputStyle} />
          <input type="number" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} placeholder="Bedrooms" style={inputStyle} />
          <select value={form.source} onChange={e => set('source', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={form.listing_url} onChange={e => set('listing_url', e.target.value)} placeholder="Listing URL" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#ffffff55', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.furnished} onChange={e => set('furnished', e.target.checked)} />
            Furnished
          </label>
        </div>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes…" rows={2} style={{ ...inputStyle, resize: 'vertical', width: '100%', marginBottom: 10 }} />
        <button type="submit" disabled={saving} style={{ background: '#C9A84C', color: '#0C0E14', border: 'none', borderRadius: 7, padding: '10px 24px', fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', cursor: 'pointer' }}>
          {saving ? 'Adding…' : 'Add to Pipeline →'}
        </button>
      </form>
    </div>
  )
}

// ─── Smart Sourcing Engine ────────────────────────────────────────────────────

function SmartSourcingEngine({ onAddToPipeline, contracts }: {
  onAddToPipeline: (lead: Partial<Lead>) => Promise<void>
  contracts: Contract[]
}) {
  const [config, setConfig] = useState<SearchConfig>(DEFAULT_SEARCH)
  const [collapsed, setCollapsed] = useState(false)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const set = <K extends keyof SearchConfig>(k: K, v: SearchConfig[K]) =>
    setConfig(c => ({ ...c, [k]: v }))

  const toggleUnitType = (type: string) => {
    setConfig(c => ({
      ...c,
      unit_types: c.unit_types.includes(type)
        ? c.unit_types.filter(t => t !== type)
        : [...c.unit_types, type],
    }))
  }

  const handleContractSelect = (contractId: string) => {
    set('contract_id', contractId)
    if (contractId) {
      const contract = contracts.find(c => c.id === contractId)
      if (contract) {
        if (contract.work_site_lat) set('work_site_lat', contract.work_site_lat)
        if (contract.work_site_lng) set('work_site_lng', contract.work_site_lng)
        if (contract.work_site_address) set('work_site_address', contract.work_site_address)
      }
    }
  }

  const handleSearch = async () => {
    setSearching(true)
    setError(null)
    setCollapsed(true)
    try {
      const headers = await getAuthHeaders()
      const body = {
        contract_id: config.contract_id || undefined,
        work_site_lat: config.work_site_lat,
        work_site_lng: config.work_site_lng,
        work_site_address: config.work_site_address,
        radius_km: config.radius_km,
        bedrooms_min: config.bedrooms_min,
        bedrooms_max: config.bedrooms_max,
        bathrooms_min: config.bathrooms_min,
        furnished: config.furnished === 'yes' ? true : config.furnished === 'no' ? false : undefined,
        unit_types: config.unit_types.map(t => t.toLowerCase()),
        max_monthly_rent: config.max_monthly_rent,
        require_parking: config.require_parking,
        require_modern: config.require_modern,
        min_photos: config.min_photos ? 4 : 0,
        exclude_keywords: config.exclude_bad
          ? ['student', 'shared', 'roommate', 'room only', 'land', 'for sale', 'commercial']
          : [],
      }
      const res = await fetch('/api/sourcing/search', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResults(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setError(message)
    } finally {
      setSearching(false)
    }
  }

  const handleAddToPipeline = async (result: SearchResult) => {
    await onAddToPipeline({
      title: result.title,
      monthly_rent: result.price || undefined,
      bedrooms: result.bedrooms || undefined,
      listing_url: result.url,
      source: 'craigslist',
      furnished: config.furnished === 'yes',
      status: 'new' as LeadStatus,
    })
    setAddedIds(prev => { const next = new Set(Array.from(prev)); next.add(result.id); return next })
  }

  const revenue = 105 * 30
  const margin = Math.round(((revenue - config.max_monthly_rent) / revenue) * 100)

  const summaryText = `${config.bedrooms_min === config.bedrooms_max ? config.bedrooms_min : `${config.bedrooms_min}–${config.bedrooms_max}`}BR · ${config.radius_km}km · $${config.max_monthly_rent.toLocaleString()}/mo`

  const labelStyle: React.CSSProperties = { fontFamily: 'IBM Plex Mono', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff44', display: 'block', marginBottom: 6 }
  const sectionStyle: React.CSSProperties = { background: '#0C0E14', border: '1px solid #ffffff0D', borderRadius: 8, padding: '16px 18px', marginBottom: 12 }

  return (
    <div style={{ background: '#13161D', border: '1px solid #1B4353', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #ffffff0D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 18, color: '#DDD5C8', fontWeight: 700 }}>
            🔍 Smart Sourcing Engine
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4F87A0', marginTop: 2 }}>
            Live Craigslist · Kijiji · Facebook Marketplace
          </div>
        </div>
        {collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#4F87A0' }}>{summaryText}</span>
            <button
              onClick={() => setCollapsed(false)}
              style={{ background: '#1B435322', border: '1px solid #1B435355', borderRadius: 6, padding: '5px 12px', fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4F87A0', cursor: 'pointer' }}
            >
              Edit ✎
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {!collapsed && (
        <div style={{ padding: '20px 24px' }}>
          {/* Step 1 — Contract */}
          <div style={{ ...sectionStyle }}>
            <label style={labelStyle}>Step 1 — Link to Contract (optional)</label>
            <select
              value={config.contract_id}
              onChange={e => handleContractSelect(e.target.value)}
              style={{ width: '100%', background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 6, padding: '8px 10px', color: '#DDD5C8', fontFamily: 'IBM Plex Mono', fontSize: 12, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">— Searching for contract... —</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>{c.reference} — {c.client_name}</option>
              ))}
            </select>
          </div>

          {/* Step 2 — Work Site */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Step 2 — Work Site Pin</label>
            <WorksiteMap
              onLocationSelect={(address, lat, lng) => {
                set('work_site_address', address)
                set('work_site_lat', lat)
                set('work_site_lng', lng)
              }}
              initialAddress={config.work_site_address}
            />
          </div>

          {/* Step 3 — Distance */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Step 3 — Max distance from work site</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, fontWeight: 700, color: '#4F87A0', minWidth: 100 }}>
                {config.radius_km} km
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={config.radius_km <= 20 ? 1 : 5}
                  value={config.radius_km}
                  onChange={e => set('radius_km', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#1B4353' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff33', marginTop: 4 }}>
                  <span>5 km</span><span>100 km</span>
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff44' }}>
              Covers approximately {coverageKm2(config.radius_km)} km²
            </div>
          </div>

          {/* Step 4 — Unit Requirements */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Step 4 — Unit Requirements</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              {/* Bedrooms min */}
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', marginBottom: 6 }}>Bedrooms Min</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => set('bedrooms_min', Math.max(1, config.bedrooms_min - 1))} style={{ background: '#ffffff0D', border: 'none', borderRadius: 4, width: 28, height: 28, color: '#DDD5C8', cursor: 'pointer', fontSize: 16 }}>−</button>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: '#DDD5C8', minWidth: 20, textAlign: 'center' }}>{config.bedrooms_min}</span>
                  <button onClick={() => set('bedrooms_min', Math.min(config.bedrooms_max, config.bedrooms_min + 1))} style={{ background: '#ffffff0D', border: 'none', borderRadius: 4, width: 28, height: 28, color: '#DDD5C8', cursor: 'pointer', fontSize: 16 }}>+</button>
                </div>
              </div>
              {/* Bedrooms max */}
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', marginBottom: 6 }}>Bedrooms Max</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => set('bedrooms_max', Math.max(config.bedrooms_min, config.bedrooms_max - 1))} style={{ background: '#ffffff0D', border: 'none', borderRadius: 4, width: 28, height: 28, color: '#DDD5C8', cursor: 'pointer', fontSize: 16 }}>−</button>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: '#DDD5C8', minWidth: 20, textAlign: 'center' }}>{config.bedrooms_max}</span>
                  <button onClick={() => set('bedrooms_max', Math.min(8, config.bedrooms_max + 1))} style={{ background: '#ffffff0D', border: 'none', borderRadius: 4, width: 28, height: 28, color: '#DDD5C8', cursor: 'pointer', fontSize: 16 }}>+</button>
                </div>
              </div>
              {/* Bathrooms min */}
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', marginBottom: 6 }}>Bathrooms Min</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => set('bathrooms_min', Math.max(1, config.bathrooms_min - 0.5))} style={{ background: '#ffffff0D', border: 'none', borderRadius: 4, width: 28, height: 28, color: '#DDD5C8', cursor: 'pointer', fontSize: 16 }}>−</button>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: '#DDD5C8', minWidth: 24, textAlign: 'center' }}>{config.bathrooms_min}</span>
                  <button onClick={() => set('bathrooms_min', Math.min(4, config.bathrooms_min + 0.5))} style={{ background: '#ffffff0D', border: 'none', borderRadius: 4, width: 28, height: 28, color: '#DDD5C8', cursor: 'pointer', fontSize: 16 }}>+</button>
                </div>
              </div>
            </div>
            {/* Furnished toggle */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', marginBottom: 8 }}>Furnished</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['yes', 'no', 'either'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => set('furnished', opt)}
                    style={{
                      padding: '5px 14px', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 10,
                      cursor: 'pointer', border: '1px solid',
                      background: config.furnished === opt ? '#1B435333' : 'transparent',
                      borderColor: config.furnished === opt ? '#4F87A0' : '#ffffff22',
                      color: config.furnished === opt ? '#4F87A0' : '#ffffff55',
                    }}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {/* Unit types */}
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', marginBottom: 8 }}>Unit Types</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {UNIT_TYPES.map(type => {
                  const active = config.unit_types.includes(type)
                  return (
                    <button
                      key={type}
                      onClick={() => toggleUnitType(type)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontFamily: 'IBM Plex Mono', fontSize: 10,
                        cursor: 'pointer', border: '1px solid',
                        background: active ? '#1B435333' : 'transparent',
                        borderColor: active ? '#4F87A0' : '#ffffff22',
                        color: active ? '#4F87A0' : '#ffffff44',
                      }}
                    >
                      {active ? '✓ ' : ''}{type}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Step 5 — Budget */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Step 5 — Max monthly rent ERS pays landlord</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, fontWeight: 700, color: '#C9A84C', minWidth: 100 }}>
                ${config.max_monthly_rent.toLocaleString()}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="range" min={1000} max={5000} step={100}
                  value={config.max_monthly_rent}
                  onChange={e => set('max_monthly_rent', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#C9A84C' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff33', marginTop: 4 }}>
                  <span>$1,000</span><span>$5,000</span>
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: marginColor(margin) }}>
              At $105/night × 30 days = ${revenue.toLocaleString()} revenue → {margin}% margin at this rent
            </div>
          </div>

          {/* Step 6 — Quality Filters */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Step 6 — Quality Filters</label>
            {[
              { key: 'require_parking' as const, label: 'Must have parking' },
              { key: 'require_modern' as const, label: 'Modern/updated only' },
              { key: 'min_photos' as const, label: 'Minimum 4 photos' },
              { key: 'exclude_bad' as const, label: 'Exclude: student, shared, room rentals, land, for sale' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config[key] as boolean}
                  onChange={e => set(key, e.target.checked)}
                  style={{ accentColor: '#1B4353', width: 14, height: 14 }}
                />
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#DDD5C8' }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Run Search */}
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              width: '100%', background: searching ? '#1B435388' : '#1B4353',
              color: '#DDD5C8', border: 'none', borderRadius: 8,
              padding: '14px 24px', fontFamily: "'League Spartan', sans-serif",
              fontSize: 16, fontWeight: 700, letterSpacing: '0.05em',
              cursor: searching ? 'wait' : 'pointer', transition: 'background 0.2s',
            }}
          >
            {searching ? '⟳ Searching listings…' : 'Find Units →'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ margin: '0 24px 16px', padding: '12px 16px', background: '#3a1a1a', border: '1px solid #E8485544', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#E84855' }}>
          ⚠ {error} — Kijiji &amp; Facebook links still available below.
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ padding: '0 24px 24px' }}>
          {/* Summary bar */}
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#4F87A0', marginBottom: 16, padding: '8px 12px', background: '#1B435322', borderRadius: 6 }}>
            Found {results.total_fetched} listings · Filtered to top {results.total_after_filter} · Sources: {results.sources_searched.map(s => s.replace('craigslist_', '')).join(', ')}
            {results.sources_errored && results.sources_errored.length > 0 && (
              <span style={{ color: '#E84855', marginLeft: 8 }}>· {results.sources_errored.join(', ')}: fetch failed</span>
            )}
          </div>

          {/* Result cards */}
          {results.results.length === 0 && (
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#ffffff44', textAlign: 'center', padding: '32px 0' }}>
              No listings matched your filters. Try adjusting the budget or removing some quality filters.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.results.map(result => (
              <div
                key={result.id}
                style={{ background: '#0C0E14', border: '1px solid #ffffff0D', borderRadius: 8, padding: '14px 16px', position: 'relative' }}
              >
                {/* Score badge */}
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: `${scoreColor(result.score)}22`, border: `1px solid ${scoreColor(result.score)}55`,
                  borderRadius: 20, padding: '3px 10px',
                  fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, color: scoreColor(result.score),
                }}>
                  {result.score}
                </div>

                <div style={{ paddingRight: 60 }}>
                  {result.thumbnail && (
                    <img
                      src={result.thumbnail}
                      alt=""
                      style={{ float: 'right', width: 80, height: 60, objectFit: 'cover', borderRadius: 4, marginLeft: 12, marginBottom: 8 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div style={{ fontSize: 13, color: '#DDD5C8', fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>
                    {result.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {result.price && (
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>
                        ${result.price.toLocaleString()}/mo
                      </span>
                    )}
                    {result.bedrooms !== null && result.bedrooms !== undefined && (
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff55' }}>
                        {result.bedrooms === 0 ? 'Studio' : `${result.bedrooms} bed`}
                      </span>
                    )}
                    {result.posted_date && (
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff33' }}>
                        {new Date(result.posted_date).toLocaleDateString()}
                      </span>
                    )}
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '2px 7px', borderRadius: 10, background: '#8B5CF622', border: '1px solid #8B5CF644', color: '#8B5CF6' }}>
                      {result.source}
                    </span>
                  </div>

                  {/* Score reasons */}
                  {result.score_reasons.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                      {result.score_reasons.map(reason => (
                        <span
                          key={reason}
                          style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '2px 8px', borderRadius: 10, background: '#ffffff08', border: '1px solid #ffffff11', color: '#ffffff55' }}
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => handleAddToPipeline(result)}
                    disabled={addedIds.has(result.id)}
                    style={{
                      flex: 1, padding: '7px 12px', borderRadius: 6,
                      fontFamily: 'IBM Plex Mono', fontSize: 10, cursor: addedIds.has(result.id) ? 'default' : 'pointer',
                      border: '1px solid',
                      background: addedIds.has(result.id) ? '#4CAF9322' : '#C9A84C22',
                      borderColor: addedIds.has(result.id) ? '#4CAF9355' : '#C9A84C55',
                      color: addedIds.has(result.id) ? '#4CAF93' : '#C9A84C',
                    }}
                  >
                    {addedIds.has(result.id) ? '✓ Added' : 'Add to Pipeline →'}
                  </button>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '7px 12px', borderRadius: 6,
                      fontFamily: 'IBM Plex Mono', fontSize: 10, textDecoration: 'none',
                      border: '1px solid #ffffff22', color: '#ffffff55', background: '#ffffff08',
                    }}
                  >
                    Open ↗
                  </a>
                  <button
                    onClick={() => {
                      const msg = `Hi, I'm reaching out on behalf of Elias Range Stays — a BC-based workforce housing company that provides furnished accommodations for healthcare and construction teams.\n\nWe are currently looking for a ${result.title} for a team contract in your area. We offer:\n• Stable, long-term lease agreements (3–12+ months)\n• On-time monthly payments — guaranteed\n• Professional tenants (healthcare workers & engineers)\n• No wear beyond normal use — we manage the property carefully\n\nWould you be open to discussing a lease arrangement? We can move quickly if the unit is a good fit.\n\nThanks,\nAustin Neill\nElias Range Stays\naustin@eliasrangestays.ca\n(250) 719-8085\neliasrangestays.ca`
                      navigator.clipboard.writeText(msg).then(() => {
                        alert('✓ Outreach message copied! Paste it into Facebook Messenger or Kijiji.')
                      })
                    }}
                    style={{
                      padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                      fontFamily: 'IBM Plex Mono', fontSize: 10,
                      border: '1px solid #4F87A044', color: '#4F87A0', background: '#4F87A011',
                    }}
                    title="Copy a professional outreach message to paste into Facebook/Kijiji"
                  >
                    📋 Copy Message
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Kijiji links */}
          {results.kijiji_links.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.12em', color: '#E8411A', textTransform: 'uppercase', marginBottom: 10 }}>
                Kijiji Quick Search
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {results.kijiji_links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 11,
                      textDecoration: 'none', border: '1px solid #E8411A55',
                      background: '#E8411A11', color: '#E8411A',
                    }}
                  >
                    🏠 {link.label} →
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Facebook links */}
          {results.facebook_links.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.12em', color: '#4267B2', textTransform: 'uppercase', marginBottom: 10 }}>
                Facebook Marketplace
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {results.facebook_links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 11,
                      textDecoration: 'none', border: '1px solid #4267B255',
                      background: '#4267B211', color: '#4267B2',
                    }}
                  >
                    📘 {link.label} →
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SourcingPage() {
  const { role, loading: roleLoading } = useRole()
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

        {/* ── SMART SOURCING ENGINE ────────────────────────────────────────── */}
        <SmartSourcingEngine onAddToPipeline={addLead} contracts={contracts} />

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
                      <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                    ))}
                    {stageLeads.length === 0 && (
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff22', textAlign: 'center', paddingTop: 20 }}>empty</div>
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
