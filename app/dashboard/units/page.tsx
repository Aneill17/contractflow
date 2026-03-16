'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth'

interface Unit {
  id: string
  address: string
  city?: string
  province: string
  monthly_cost?: number
  daily_rate?: number
  bedrooms: number
  status: string
  landlord_name?: string
  landlord_email?: string
  landlord_phone?: string
  lease_start?: string
  lease_end?: string
  damage_deposit?: number
  notes?: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  vacant: '#4CAF93',
  occupied: '#C9A84C',
  maintenance: '#E84855',
  reserved: '#4F87A0',
}

const STATUS_LABELS: Record<string, string> = {
  vacant: 'Vacant',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
  reserved: 'Reserved',
}

function AddUnitModal({ onClose, onSave }: { onClose: () => void; onSave: (u: any) => void }) {
  const [form, setForm] = useState({
    address: '', city: '', province: 'BC', bedrooms: '1', status: 'vacant',
    monthly_cost: '', daily_rate: '', landlord_name: '', landlord_email: '',
    landlord_phone: '', lease_start: '', lease_end: '', damage_deposit: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.address.trim()) return
    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/units', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bedrooms: parseInt(form.bedrooms) || 1,
          monthly_cost: form.monthly_cost ? parseFloat(form.monthly_cost) : null,
          daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : null,
          damage_deposit: form.damage_deposit ? parseFloat(form.damage_deposit) : null,
        }),
      })
      const data = await r.json()
      if (r.ok) { onSave(data); onClose() }
    } finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0C0E14', border: '1px solid #ffffff12', borderRadius: 6,
    padding: '9px 12px', color: '#DDD5C8', fontSize: 12,
    fontFamily: 'IBM Plex Mono, monospace', width: '100%', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: '#ffffff33', letterSpacing: '0.12em', marginBottom: 4,
    display: 'block', fontFamily: 'IBM Plex Mono, monospace',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#13161D', border: '1px solid #ffffff10', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ffffff0D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: '#DDD5C8', fontFamily: 'IBM Plex Mono, monospace' }}>Add Unit</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff44', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>UNIT ADDRESS *</label>
            <input style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} placeholder="103-1504 Scott Crescent, Squamish" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>CITY</label>
              <input style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Squamish" />
            </div>
            <div>
              <label style={labelStyle}>BEDROOMS</label>
              <input style={inputStyle} value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} type="number" min="0" />
            </div>
            <div>
              <label style={labelStyle}>STATUS</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>MONTHLY COST (LEASE)</label>
              <input style={inputStyle} value={form.monthly_cost} onChange={e => set('monthly_cost', e.target.value)} type="number" placeholder="2800" />
            </div>
            <div>
              <label style={labelStyle}>DAILY RATE (TO CLIENT)</label>
              <input style={inputStyle} value={form.daily_rate} onChange={e => set('daily_rate', e.target.value)} type="number" placeholder="105" />
            </div>
          </div>
          <div style={{ borderTop: '1px solid #ffffff0D', paddingTop: 14 }}>
            <div style={{ fontSize: 9, color: '#C9A84C', letterSpacing: '0.12em', marginBottom: 12 }}>LANDLORD</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>NAME</label>
                <input style={inputStyle} value={form.landlord_name} onChange={e => set('landlord_name', e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <label style={labelStyle}>PHONE</label>
                <input style={inputStyle} value={form.landlord_phone} onChange={e => set('landlord_phone', e.target.value)} placeholder="604-555-0100" />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={labelStyle}>EMAIL</label>
              <input style={inputStyle} value={form.landlord_email} onChange={e => set('landlord_email', e.target.value)} placeholder="jane@example.com" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>LEASE START</label>
              <input style={inputStyle} value={form.lease_start} onChange={e => set('lease_start', e.target.value)} type="date" />
            </div>
            <div>
              <label style={labelStyle}>LEASE END</label>
              <input style={inputStyle} value={form.lease_end} onChange={e => set('lease_end', e.target.value)} type="date" />
            </div>
            <div>
              <label style={labelStyle}>DAMAGE DEPOSIT</label>
              <input style={inputStyle} value={form.damage_deposit} onChange={e => set('damage_deposit', e.target.value)} type="number" placeholder="2800" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>NOTES</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Parking, amenities, special conditions..." />
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #ffffff0D', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #ffffff15', color: '#ffffff55', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.address.trim()} style={{ background: '#1B4353', border: '1px solid #4F87A033', color: '#4F87A0', borderRadius: 6, padding: '8px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
            {saving ? 'Saving...' : 'Add Unit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/units', { headers })
      if (r.ok) setUnits(await r.json())
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? units : units.filter(u => u.status === filter)

  const stats = {
    total: units.length,
    occupied: units.filter(u => u.status === 'occupied').length,
    vacant: units.filter(u => u.status === 'vacant').length,
    maintenance: units.filter(u => u.status === 'maintenance').length,
    monthlyRevenue: units.filter(u => u.status === 'occupied').reduce((s, u) => s + (u.daily_rate || 0) * 30, 0),
    monthlyCost: units.reduce((s, u) => s + (u.monthly_cost || 0), 0),
  }

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  const now = new Date()
  const daysUntil = (d?: string) => {
    if (!d) return null
    const diff = new Date(d).getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div style={{ padding: '32px 32px', fontFamily: 'IBM Plex Mono, monospace', color: '#DDD5C8', minHeight: '100vh', background: '#0C0E14' }}>
      {showAdd && <AddUnitModal onClose={() => setShowAdd(false)} onSave={u => setUnits(prev => [u, ...prev])} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, color: '#DDD5C8', marginBottom: 4 }}>Unit Registry</div>
          <div style={{ fontSize: 11, color: '#ffffff33' }}>All ERS-managed properties</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: '#1B4353', border: '1px solid #4F87A033', color: '#4F87A0', borderRadius: 7, padding: '9px 18px', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.08em' }}>
          + Add Unit
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          ['Total Units', stats.total, '#DDD5C8'],
          ['Occupied', stats.occupied, '#C9A84C'],
          ['Vacant', stats.vacant, '#4CAF93'],
          ['Monthly Revenue', `$${stats.monthlyRevenue.toLocaleString()}`, '#4F87A0'],
          ['Monthly Cost', `$${stats.monthlyCost.toLocaleString()}`, '#E84855'],
        ].map(([l, v, c]) => (
          <div key={l as string} style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 9, color: '#ffffff33', letterSpacing: '0.12em', marginBottom: 8 }}>{l}</div>
            <div style={{ fontSize: 22, color: c as string }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all', 'All'], ['vacant', 'Vacant'], ['occupied', 'Occupied'], ['reserved', 'Reserved'], ['maintenance', 'Maintenance']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            background: filter === k ? '#1B4353' : 'transparent',
            border: `1px solid ${filter === k ? '#4F87A066' : '#ffffff15'}`,
            color: filter === k ? '#4F87A0' : '#ffffff44',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.08em',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#ffffff33', padding: 48, fontSize: 12 }}>Loading units...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#ffffff22', padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏘️</div>
          <div style={{ fontSize: 13 }}>No units yet — add your first property</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(unit => {
            const leaseEndDays = daysUntil(unit.lease_end)
            const leaseExpiringSoon = leaseEndDays !== null && leaseEndDays <= 60 && leaseEndDays > 0
            const leaseExpired = leaseEndDays !== null && leaseEndDays <= 0
            return (
              <div key={unit.id} style={{ background: '#13161D', border: `1px solid ${leaseExpired ? '#E8485533' : leaseExpiringSoon ? '#C9A84C33' : '#ffffff0D'}`, borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, color: '#DDD5C8' }}>{unit.address}</div>
                      <div style={{
                        fontSize: 9, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em',
                        background: `${STATUS_COLORS[unit.status]}22`,
                        border: `1px solid ${STATUS_COLORS[unit.status]}44`,
                        color: STATUS_COLORS[unit.status],
                      }}>{STATUS_LABELS[unit.status]}</div>
                      {leaseExpiringSoon && !leaseExpired && (
                        <div style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: '#C9A84C22', border: '1px solid #C9A84C44', color: '#C9A84C', letterSpacing: '0.08em' }}>
                          ⚠ Lease in {leaseEndDays}d
                        </div>
                      )}
                      {leaseExpired && (
                        <div style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: '#E8485522', border: '1px solid #E8485544', color: '#E84855', letterSpacing: '0.08em' }}>
                          ✗ Lease Expired
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {unit.city && <span style={{ fontSize: 11, color: '#ffffff44' }}>{unit.city}, {unit.province}</span>}
                      {unit.bedrooms !== undefined && <span style={{ fontSize: 11, color: '#ffffff44' }}>{unit.bedrooms} bed{unit.bedrooms !== 1 ? 's' : ''}</span>}
                      {unit.landlord_name && <span style={{ fontSize: 11, color: '#ffffff44' }}>Landlord: {unit.landlord_name}</span>}
                      {unit.lease_end && <span style={{ fontSize: 11, color: '#ffffff44' }}>Lease ends: {fmt(unit.lease_end)}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, textAlign: 'right', flexShrink: 0 }}>
                    {unit.monthly_cost && (
                      <div>
                        <div style={{ fontSize: 9, color: '#E84855', letterSpacing: '0.1em', marginBottom: 2 }}>COST/MO</div>
                        <div style={{ fontSize: 16, color: '#DDD5C8' }}>${unit.monthly_cost.toLocaleString()}</div>
                      </div>
                    )}
                    {unit.daily_rate && (
                      <div>
                        <div style={{ fontSize: 9, color: '#4CAF93', letterSpacing: '0.1em', marginBottom: 2 }}>RATE/DAY</div>
                        <div style={{ fontSize: 16, color: '#DDD5C8' }}>${unit.daily_rate}</div>
                      </div>
                    )}
                  </div>
                </div>
                {unit.notes && (
                  <div style={{ marginTop: 10, fontSize: 11, color: '#ffffff33', borderTop: '1px solid #ffffff08', paddingTop: 8 }}>{unit.notes}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
