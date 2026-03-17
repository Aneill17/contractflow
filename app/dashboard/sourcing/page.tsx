'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { useRole } from '@/components/UserRoleContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'approved' | 'messaged' | 'securing_details' | 'negotiating' | 'closed' | 'passed'

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
  available_date_text?: string
  listing_url?: string
  source?: string
  notes?: string
  status: LeadStatus
  contract_id?: string
  added_by?: string
  landlord_name?: string
  landlord_contact?: string
  landlord_phone?: string
  lease_term?: string
  photo_url?: string
  monthly_cost_ers?: number
  nightly_rate_client?: number
}

interface Contract {
  id: string
  reference: string
  client_name: string
}

interface ImportedListing {
  title: string | null
  price: number | null
  photo_url: string | null
  description: string | null
  bedrooms: number | null
  source: string
  url: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: {
  key: LeadStatus
  label: string
  color: string
  emoji: string
  collapsedByDefault?: boolean
}[] = [
  { key: 'new',              label: 'New',              color: '#6B7280', emoji: '⬜' },
  { key: 'approved',         label: 'Approved',         color: '#4F87A0', emoji: '✓' },
  { key: 'messaged',         label: 'Messaged',         color: '#C9A84C', emoji: '📨' },
  { key: 'securing_details', label: 'Securing Details', color: '#2A7A8A', emoji: '🔍' },
  { key: 'negotiating',      label: 'Negotiating',      color: '#6B4FA0', emoji: '🤝' },
  { key: 'closed',           label: 'Closed',           color: '#2D5A3D', emoji: '✅' },
  { key: 'passed',           label: 'Passed',           color: '#8B3A3A', emoji: '✗', collapsedByDefault: true },
]

const STAGE_ORDER = PIPELINE_STAGES.map(s => s.key)

function prevStage(status: LeadStatus): LeadStatus | null {
  const idx = STAGE_ORDER.indexOf(status)
  if (idx <= 0) return null
  return STAGE_ORDER[idx - 1]
}

const SOURCE_EMOJIS: Record<string, string> = {
  facebook: '📘',
  kijiji: '🏠',
  craigslist: '📋',
  other: '🔗',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

// ─── Outreach Messages ────────────────────────────────────────────────────────

function buildOutreachMessage(stage: LeadStatus, lead: Lead): string {
  const br = lead.bedrooms ? `${lead.bedrooms}BR` : 'X BR'
  const city = lead.city || '[city]'
  const price = lead.monthly_rent ? `$${lead.monthly_rent.toLocaleString()}` : '$[price]'
  const landlord = lead.landlord_name || 'there'
  const date = lead.available_date_text || '[date]'

  if (stage === 'approved') {
    return `Hi! I'm Jordan with Elias Range Stays — a BC workforce housing company. We provide long-term furnished accommodations for healthcare and construction teams.

We're looking for a ${br} unit in ${city} for a professional team. We offer:
• Stable 6–12 month lease
• On-time guaranteed monthly payments
• Professional tenants (healthcare workers/engineers)
• No issues — we manage our residents carefully

Is this unit still available? Happy to connect quickly.

Jordan Neill | Elias Range Stays
austin@eliasrangestays.ca | (250) 719-8085`
  }

  if (stage === 'messaged') {
    return `Hi ${landlord},

Thanks for getting back to me! To move forward quickly, could you confirm:
• Is the unit still available?
• What's the earliest move-in date?
• Is parking included?
• Are utilities included or separate?
• Would you consider a 6–12 month lease?

We're ready to move fast if it's a fit.

Jordan Neill | Elias Range Stays`
  }

  if (stage === 'securing_details') {
    return `Hi,

We're very interested in moving forward. Our offer:
• Monthly rent: ${price}
• Lease term: [X] months starting ${date}
• Professional tenants — healthcare/construction workers
• First + last month upfront

Can we confirm the details and get a lease agreement drafted?

Jordan Neill | Elias Range Stays
austin@eliasrangestays.ca | (250) 719-8085`
  }

  if (stage === 'negotiating') {
    return `Hi,

We're ready to sign. Could you send over the lease agreement?

We'll need:
• Full legal address
• Landlord legal name for the agreement
• Lease start date confirmed as ${date}
• Any move-in instructions

Looking forward to getting this finalized.

Jordan Neill | Elias Range Stays`
  }

  return ''
}

// ─── URL Import Panel ─────────────────────────────────────────────────────────

function UrlImportPanel({
  contracts,
  onAdd,
  onToast,
}: {
  contracts: Contract[]
  onAdd: (data: Partial<Lead>) => Promise<void>
  onToast: (msg: string, type?: string) => void
}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ImportedListing | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editBedrooms, setEditBedrooms] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editContract, setEditContract] = useState('')
  const [saving, setSaving] = useState(false)

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setPreview(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/sourcing/import', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setPreview(data)
      setEditTitle(data.title || '')
      setEditPrice(data.price ? String(data.price) : '')
      setEditBedrooms(data.bedrooms != null ? String(data.bedrooms) : '')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      onToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!preview) return
    setSaving(true)
    await onAdd({
      title: editTitle || preview.title || 'Untitled listing',
      monthly_rent: editPrice ? parseFloat(editPrice) : preview.price ?? undefined,
      bedrooms: editBedrooms ? parseInt(editBedrooms) : preview.bedrooms ?? undefined,
      photo_url: preview.photo_url ?? undefined,
      listing_url: url.trim(),
      source: preview.source,
      notes: editNotes || undefined,
      contract_id: editContract || undefined,
      status: 'new',
    })
    setUrl('')
    setPreview(null)
    setEditTitle('')
    setEditPrice('')
    setEditBedrooms('')
    setEditNotes('')
    setEditContract('')
    setSaving(false)
    onToast('Added to pipeline')
  }

  const inputStyle: React.CSSProperties = {
    background: '#0C0E14',
    border: '1px solid #ffffff0D',
    borderRadius: 6,
    padding: '8px 10px',
    color: '#DDD5C8',
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ background: '#13161D', border: '1px solid #1B4353', borderRadius: 12, padding: '24px 28px', marginBottom: 32 }}>
      <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 20, color: '#DDD5C8', fontWeight: 700, marginBottom: 4 }}>
        🔗 Paste a listing URL to import
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff44', marginBottom: 18 }}>
        Paste any Facebook, Kijiji, or Craigslist URL — we&apos;ll pull the photo and details automatically
      </div>
      <form onSubmit={handleFetch} style={{ display: 'flex', gap: 10, marginBottom: preview ? 24 : 0 }}>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.facebook.com/marketplace/item/..."
          style={{ ...inputStyle, flex: 1, fontSize: 13 }}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          style={{
            background: loading ? '#1B435388' : '#1B4353',
            color: '#DDD5C8',
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontFamily: "'League Spartan', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            opacity: url.trim() ? 1 : 0.5,
          }}
        >
          {loading ? '⟳' : '→'}
        </button>
      </form>

      {loading && (
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#4F87A0', marginTop: 12 }}>
          Fetching listing…
        </div>
      )}

      {preview && (
        <div style={{ background: '#0C0E14', border: '1px solid #4F87A044', borderRadius: 10, overflow: 'hidden' }}>
          {/* Preview card */}
          <div style={{ display: 'flex', gap: 0 }}>
            {preview.photo_url ? (
              <img
                src={preview.photo_url}
                alt=""
                style={{ width: 180, height: 120, objectFit: 'cover', flexShrink: 0 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div style={{ width: 180, height: 120, background: '#1a1e28', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 32 }}>
                {SOURCE_EMOJIS[preview.source] || '🔗'}
              </div>
            )}
            <div style={{ padding: '16px 20px', flex: 1 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#4F87A0', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                {preview.source} · Preview
              </div>
              <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 15, color: '#DDD5C8', fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                {preview.title || 'No title found'}
              </div>
              <div style={{ display: 'flex', gap: 16, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                {preview.price && <span style={{ color: '#C9A84C' }}>${preview.price.toLocaleString()}/mo</span>}
                {preview.bedrooms != null && <span style={{ color: '#ffffff55' }}>{preview.bedrooms === 0 ? 'Studio' : `${preview.bedrooms}BR`}</span>}
              </div>
            </div>
          </div>

          {/* Edit fields */}
          <div style={{ padding: '20px', borderTop: '1px solid #ffffff08' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Title</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle} placeholder="Edit title..." />
              </div>
              <div>
                <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Monthly Rent ($)</label>
                <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={inputStyle} placeholder="e.g. 2400" />
              </div>
              <div>
                <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Bedrooms</label>
                <input type="number" value={editBedrooms} onChange={e => setEditBedrooms(e.target.value)} style={inputStyle} placeholder="e.g. 2" />
              </div>
              <div>
                <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Link to Contract</label>
                <select value={editContract} onChange={e => setEditContract(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— None —</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.reference} — {c.client_name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff44', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Notes</label>
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} placeholder="Any notes..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{
                background: '#2D5A3D',
                color: '#4CAF93',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontFamily: "'League Spartan', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {saving ? 'Adding…' : 'Add to Pipeline →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Unit Card ────────────────────────────────────────────────────────────────

function UnitCard({
  lead,
  contracts,
  onStageAction,
  onMoveBack,
  onPass,
  onSave,
  onToast,
}: {
  lead: Lead
  contracts: Contract[]
  onStageAction: (lead: Lead) => Promise<void>
  onMoveBack: (lead: Lead) => Promise<void>
  onPass: (lead: Lead) => Promise<void>
  onSave: (id: string, patch: Partial<Lead>) => Promise<void>
  onToast: (msg: string, type?: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState<Lead>({ ...lead })
  const [saving, setSaving] = useState(false)
  const setField = (k: keyof Lead, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const stageInfo = PIPELINE_STAGES.find(s => s.key === lead.status)
  const contractName = lead.contract_id
    ? contracts.find(c => c.id === lead.contract_id)
    : null

  const src = lead.source || 'other'
  const hasPrev = prevStage(lead.status) !== null && lead.status !== 'new'

  const inputStyle: React.CSSProperties = {
    background: '#0C0E14',
    border: '1px solid #ffffff0D',
    borderRadius: 6,
    padding: '7px 10px',
    color: '#DDD5C8',
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'IBM Plex Mono',
    fontSize: 9,
    color: '#ffffff33',
    display: 'block',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(lead.id, form)
    setSaving(false)
    setExpanded(false)
    onToast('Saved')
  }

  const renderActionButton = () => {
    if (lead.status === 'closed') {
      return (
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4CAF93' }}>✅ Lease Closed</span>
      )
    }
    if (lead.status === 'passed') return null

    const configs: Record<string, { label: string; bg: string; color: string }> = {
      new:              { label: '✓ Approve',              bg: '#4F87A0', color: '#fff' },
      approved:         { label: '📨 Copy Message + Mark Messaged', bg: '#C9A84C', color: '#0C0E14' },
      messaged:         { label: '🔍 Mark Securing Details', bg: '#2A7A8A', color: '#fff' },
      securing_details: { label: '🤝 Mark Negotiating',     bg: '#6B4FA0', color: '#fff' },
      negotiating:      { label: '✅ Close Deal',           bg: '#2D5A3D', color: '#4CAF93' },
    }
    const cfg = configs[lead.status]
    if (!cfg) return null

    return (
      <button
        onClick={() => onStageAction(lead)}
        style={{
          background: cfg.bg,
          color: cfg.color,
          border: 'none',
          borderRadius: 6,
          padding: '7px 14px',
          fontFamily: "'League Spartan', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        {cfg.label}
      </button>
    )
  }

  return (
    <div style={{
      background: '#13161D',
      border: '1px solid #ffffff0D',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 10,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#ffffff1A')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#ffffff0D')}
    >
      {/* Main row */}
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Photo */}
        {lead.photo_url ? (
          <img
            src={lead.photo_url}
            alt=""
            style={{ width: 140, height: 100, objectFit: 'cover', flexShrink: 0, borderRadius: '10px 0 0 0' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={{
            width: 140, height: 100, background: '#1a1e28', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, fontSize: 28, borderRadius: '10px 0 0 0',
            color: '#ffffff22',
          }}>
            {SOURCE_EMOJIS[src] || '🔗'}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
              <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 14, color: '#DDD5C8', fontWeight: 600, lineHeight: 1.3, flex: 1, minWidth: 0 }}>
                {lead.title}
              </div>
              {stageInfo && (
                <span style={{
                  fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '2px 8px', borderRadius: 20,
                  background: `${stageInfo.color}22`, border: `1px solid ${stageInfo.color}55`,
                  color: stageInfo.color, whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {stageInfo.emoji} {stageInfo.label}
                </span>
              )}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff55', marginBottom: 4 }}>
              {[
                lead.monthly_rent ? `$${lead.monthly_rent.toLocaleString()}/mo` : null,
                lead.bedrooms != null ? `${lead.bedrooms}BR` : null,
                lead.furnished ? 'Furnished' : null,
                lead.city || null,
              ].filter(Boolean).join(' · ')}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff33' }}>
              Source: {SOURCE_EMOJIS[src]} {src.charAt(0).toUpperCase() + src.slice(1)} · Added {daysSince(lead.created_at)}
            </div>
            {contractName && (
              <div style={{ marginTop: 4 }}>
                <span style={{
                  fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '2px 8px', borderRadius: 20,
                  background: '#C9A84C11', border: '1px solid #C9A84C33', color: '#C9A84C',
                }}>
                  {contractName.reference} — {contractName.client_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      {lead.status !== 'passed' && (
        <div style={{
          borderTop: '1px solid #ffffff08',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          {hasPrev && (
            <button
              onClick={() => onMoveBack(lead)}
              style={{
                background: 'transparent', color: '#ffffff33', border: '1px solid #ffffff11',
                borderRadius: 6, padding: '5px 12px', fontFamily: 'IBM Plex Mono', fontSize: 10,
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          )}
          {renderActionButton()}
          <div style={{ flex: 1 }} />
          {lead.status !== 'closed' && (
            <button
              onClick={() => onPass(lead)}
              style={{
                background: 'transparent', color: '#8B3A3A', border: '1px solid #8B3A3A44',
                borderRadius: 6, padding: '5px 12px', fontFamily: 'IBM Plex Mono', fontSize: 10,
                cursor: 'pointer',
              }}
            >
              ✗ Pass
            </button>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: expanded ? '#ffffff08' : 'transparent', color: '#ffffff44',
              border: '1px solid #ffffff11', borderRadius: 6, padding: '5px 12px',
              fontFamily: 'IBM Plex Mono', fontSize: 10, cursor: 'pointer',
            }}
          >
            {expanded ? '▲ Close' : '⋯ Details'}
          </button>
        </div>
      )}

      {/* Inline expand */}
      {expanded && (
        <div style={{ borderTop: '1px solid #ffffff08', padding: '20px 18px', background: '#0C0E14' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Title</label>
              <input value={form.title} onChange={e => setField('title', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <input value={form.address || ''} onChange={e => setField('address', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input value={form.city || ''} onChange={e => setField('city', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Monthly Rent ($)</label>
              <input type="number" value={form.monthly_rent || ''} onChange={e => setField('monthly_rent', parseFloat(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Bedrooms</label>
              <input type="number" value={form.bedrooms || ''} onChange={e => setField('bedrooms', parseInt(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Bathrooms</label>
              <input type="number" step="0.5" value={form.bathrooms || ''} onChange={e => setField('bathrooms', parseFloat(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Furnished</label>
              <select value={form.furnished ? 'yes' : 'no'} onChange={e => setField('furnished', e.target.value === 'yes')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Landlord Name</label>
              <input value={form.landlord_name || ''} onChange={e => setField('landlord_name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Landlord Phone</label>
              <input value={form.landlord_phone || ''} onChange={e => setField('landlord_phone', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Landlord Email</label>
              <input value={form.landlord_contact || ''} onChange={e => setField('landlord_contact', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Available Date</label>
              <input value={form.available_date_text || ''} onChange={e => setField('available_date_text', e.target.value)} style={inputStyle} placeholder="e.g. April 1" />
            </div>
            <div>
              <label style={labelStyle}>Lease Term</label>
              <input value={form.lease_term || ''} onChange={e => setField('lease_term', e.target.value)} style={inputStyle} placeholder="e.g. 6–12 months" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Listing URL</label>
              <input value={form.listing_url || ''} onChange={e => setField('listing_url', e.target.value)} style={inputStyle} placeholder="https://..." />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Link to Contract</label>
              <select value={form.contract_id || ''} onChange={e => setField('contract_id', e.target.value || undefined)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">— None —</option>
                {contracts.map(c => <option key={c.id} value={c.id}>{c.reference} — {c.client_name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes || ''} onChange={e => setField('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#C9A84C', color: '#0C0E14', border: 'none', borderRadius: 7,
                padding: '10px 20px', fontFamily: "'League Spartan', sans-serif", fontSize: 14,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              {saving ? 'Saving…' : '💾 Save'}
            </button>
            {form.listing_url && (
              <a
                href={form.listing_url}
                target="_blank"
                rel="noreferrer"
                style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4F87A0', textDecoration: 'none' }}
              >
                Open Listing ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stage Section ─────────────────────────────────────────────────────────────

function StageSection({
  stage,
  leads,
  contracts,
  onStageAction,
  onMoveBack,
  onPass,
  onSave,
  onToast,
}: {
  stage: typeof PIPELINE_STAGES[number]
  leads: Lead[]
  contracts: Contract[]
  onStageAction: (lead: Lead) => Promise<void>
  onMoveBack: (lead: Lead) => Promise<void>
  onPass: (lead: Lead) => Promise<void>
  onSave: (id: string, patch: Partial<Lead>) => Promise<void>
  onToast: (msg: string, type?: string) => void
}) {
  const [collapsed, setCollapsed] = useState(stage.collapsedByDefault ?? false)

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '8px 0', marginBottom: collapsed ? 0 : 12, width: '100%', textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: "'League Spartan', sans-serif",
          fontSize: 16,
          fontWeight: 700,
          color: stage.color,
          letterSpacing: '0.06em',
        }}>
          {stage.emoji} {stage.label.toUpperCase()}
        </span>
        <span style={{
          fontFamily: 'IBM Plex Mono', fontSize: 10,
          background: `${stage.color}22`, border: `1px solid ${stage.color}44`,
          color: stage.color, borderRadius: 20, padding: '2px 8px',
        }}>
          {leads.length}
        </span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff22', marginLeft: 'auto' }}>
          {collapsed ? '▼ show' : '▲ hide'}
        </span>
      </button>

      {!collapsed && (
        <div>
          {leads.length === 0 && (
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ffffff22',
              padding: '16px 0', borderLeft: `2px solid ${stage.color}22`, paddingLeft: 16,
            }}>
              No units in this stage
            </div>
          )}
          {leads.map(lead => (
            <UnitCard
              key={lead.id}
              lead={lead}
              contracts={contracts}
              onStageAction={onStageAction}
              onMoveBack={onMoveBack}
              onPass={onPass}
              onSave={onSave}
              onToast={onToast}
            />
          ))}
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
    } catch { /* ignore */ }
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
    setLeads(ls => ls.map(l => l.id === id ? { ...l, ...updated } : l))
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
    setLeads(ls => [newLead, ...ls])
  }

  const handleStageAction = async (lead: Lead) => {
    const nextStageMap: Record<LeadStatus, LeadStatus | null> = {
      new: 'approved',
      approved: 'messaged',
      messaged: 'securing_details',
      securing_details: 'negotiating',
      negotiating: 'closed',
      closed: null,
      passed: null,
    }

    const next = nextStageMap[lead.status]
    if (!next) return

    // For approved → messaged, also copy outreach message
    if (lead.status === 'approved') {
      const msg = buildOutreachMessage('approved', lead)
      try {
        await navigator.clipboard.writeText(msg)
        showToast('📨 Outreach message copied! Moving to Messaged.')
      } catch {
        showToast('Moving to Messaged (clipboard unavailable)')
      }
    } else if (lead.status !== 'new') {
      const msg = buildOutreachMessage(lead.status, lead)
      if (msg) {
        try { await navigator.clipboard.writeText(msg) } catch { /* ignore */ }
      }
    }

    await saveLead(lead.id, { status: next })
  }

  const handleMoveBack = async (lead: Lead) => {
    const prev = prevStage(lead.status)
    if (!prev) return
    await saveLead(lead.id, { status: prev })
    showToast('Moved back')
  }

  const handlePass = async (lead: Lead) => {
    await saveLead(lead.id, { status: 'passed' })
    showToast('Marked as passed')
  }

  if (roleLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0C0E14', fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#ffffff33' }}>
        Loading…
      </div>
    )
  }

  const closedCount = leads.filter(l => l.status === 'closed').length
  const newCount = leads.filter(l => l.status === 'new').length
  const activeCount = leads.filter(l => !['passed', 'closed'].includes(l.status)).length

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
          <div key={n.href} className={`nav-item ${n.active ? 'active' : ''}`} onClick={() => { window.location.href = n.href }}>
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
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 30, color: '#DDD5C8', fontWeight: 700 }}>
            Unit Sourcing
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#ffffff33', marginTop: 4, display: 'flex', gap: 20 }}>
            <span>{activeCount} active</span>
            <span style={{ color: '#2D5A3D' }}>{closedCount} closed</span>
            <span>{newCount} new</span>
            <span>{leads.length} total</span>
          </div>
        </div>

        {/* URL Import Panel */}
        <UrlImportPanel
          contracts={contracts}
          onAdd={addLead}
          onToast={showToast}
        />

        {/* Pipeline */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 20, color: '#DDD5C8', fontWeight: 700, marginBottom: 20 }}>
            Unit Pipeline
          </div>

          {PIPELINE_STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage.key)
            return (
              <StageSection
                key={stage.key}
                stage={stage}
                leads={stageLeads}
                contracts={contracts}
                onStageAction={handleStageAction}
                onMoveBack={handleMoveBack}
                onPass={handlePass}
                onSave={saveLead}
                onToast={showToast}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
