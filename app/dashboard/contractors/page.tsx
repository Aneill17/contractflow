'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/auth'

interface Contractor {
  id: string
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  type: 'individual' | 'company'
  status: 'active' | 'inactive' | 'onboarding'
  specialty?: string
  notes?: string
  onboarded_at?: string
  created_at: string
}

interface ContractorMessage {
  id: string
  contractor_id: string
  direction: 'outbound' | 'inbound'
  channel: 'email' | 'sms' | 'whatsapp' | 'manual'
  subject?: string
  body: string
  sent_by?: string
  sent_at: string
}

const STATUS_COLORS: Record<string, string> = {
  active: '#4CAF93',
  onboarding: '#C9A84C',
  inactive: '#666666',
}

const CHANNEL_LABELS: Record<string, string> = {
  email: 'EMAIL',
  sms: 'SMS',
  whatsapp: 'WHATSAPP',
  manual: 'NOTE',
}

function AddContractorModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Contractor) => void }) {
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', phone: '', type: 'individual', specialty: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.company_name.trim()) return
    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/contractors', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (r.ok) { const data = await r.json(); onSave(data); onClose() }
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
      <div style={{ background: '#13161D', border: '1px solid #ffffff10', borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ffffff0D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: '#DDD5C8', fontFamily: 'IBM Plex Mono, monospace' }}>Add Contractor</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff44', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>COMPANY NAME *</label>
            <input style={inputStyle} value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Contractor Co. Ltd." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>CONTACT NAME</label>
              <input style={inputStyle} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Jane Smith" />
            </div>
            <div>
              <label style={labelStyle}>TYPE</label>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label style={labelStyle}>PHONE</label>
              <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(250) 555-0100" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>SPECIALTY</label>
            <input style={inputStyle} value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="Plumbing, Electrical, Cleaning..." />
          </div>
          <div>
            <label style={labelStyle}>NOTES</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.company_name.trim()}
            style={{
              background: saving || !form.company_name.trim() ? '#ffffff11' : '#C9A84C',
              color: saving || !form.company_name.trim() ? '#ffffff33' : '#0C0E14',
              border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: 12,
              fontFamily: 'IBM Plex Mono, monospace', cursor: saving || !form.company_name.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 700, marginTop: 4,
            }}
          >
            {saving ? 'Saving...' : 'Add Contractor'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [messages, setMessages] = useState<ContractorMessage[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Message form
  const [msgChannel, setMsgChannel] = useState<'email' | 'sms' | 'manual'>('email')
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [sending, setSending] = useState(false)

  const loadContractors = useCallback(async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/contractors', { headers })
      if (r.ok) setContractors(await r.json())
    } finally { setLoading(false) }
  }, [])

  const loadMessages = useCallback(async (id: string) => {
    setLoadingMessages(true)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch(`/api/contractors/${id}/messages`, { headers })
      if (r.ok) setMessages(await r.json())
    } finally { setLoadingMessages(false) }
  }, [])

  useEffect(() => { loadContractors() }, [loadContractors])

  useEffect(() => {
    if (selectedContractor) {
      loadMessages(selectedContractor.id)
      setMsgChannel('email')
      setMsgSubject('')
      setMsgBody('')
    } else {
      setMessages([])
    }
  }, [selectedContractor, loadMessages])

  const updateStatus = async (contractor: Contractor, status: string) => {
    const headers = await getAuthHeaders()
    const r = await fetch(`/api/contractors/${contractor.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (r.ok) {
      const updated = await r.json()
      setContractors(cs => cs.map(c => c.id === updated.id ? updated : c))
      setSelectedContractor(updated)
    }
  }

  const sendMessage = async () => {
    if (!selectedContractor || !msgBody.trim()) return
    setSending(true)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch(`/api/contractors/${selectedContractor.id}/messages`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'outbound', channel: msgChannel, subject: msgSubject || null, body: msgBody }),
      })
      if (r.ok) {
        const msg = await r.json()
        setMessages(ms => [...ms, msg])
        setMsgSubject('')
        setMsgBody('')
      }
    } finally { setSending(false) }
  }

  const fillTemplate = (type: string) => {
    const name = selectedContractor?.contact_name || 'there'
    const templates: Record<string, string> = {
      welcome: `Hi ${name}, Welcome to the Elias Range Stays contractor network. We're excited to work with you. Please don't hesitate to reach out with any questions about onboarding or our processes. — ERS Team`,
      assignment: `Hi ${name}, We have an upcoming unit assignment we'd like to discuss with you. Please reach out at your earliest convenience so we can coordinate. — ERS Team`,
      policy: `Hi ${name}, This is a reminder about our contractor policies. Please ensure all work orders are documented, all access is coordinated 24 hours in advance, and all issues are reported immediately. — ERS Team`,
      general: `Hi ${name}, I hope this message finds you well. I wanted to reach out regarding `,
    }
    setMsgBody(templates[type] || '')
  }

  const total = contractors.length
  const active = contractors.filter(c => c.status === 'active').length
  const onboarding = contractors.filter(c => c.status === 'onboarding').length

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
    <div style={{ display: 'flex', height: '100vh', background: '#0C0E14', color: '#DDD5C8', fontFamily: 'IBM Plex Mono, monospace', overflow: 'hidden' }}>
      {showAddModal && (
        <AddContractorModal
          onClose={() => setShowAddModal(false)}
          onSave={c => { setContractors(cs => [...cs, c]); setShowAddModal(false) }}
        />
      )}

      {/* Left panel */}
      <div style={{ width: 280, borderRight: '1px solid #ffffff08', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #ffffff08' }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', color: '#ffffff33', cursor: 'pointer', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', padding: 0, marginBottom: 8, display: 'block' }}>← Dashboard</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Contractors</div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#C9A84C', border: 'none', borderRadius: 6, padding: '6px 12px',
                color: '#0C0E14', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace',
                cursor: 'pointer', fontWeight: 700,
              }}
            >
              + Add
            </button>
          </div>
          <div style={{ fontSize: 9, color: '#ffffff33' }}>
            {total} total · {active} active · {onboarding} onboarding
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
          {loading ? (
            <div style={{ fontSize: 10, color: '#ffffff22', padding: '12px 6px' }}>Loading...</div>
          ) : contractors.length === 0 ? (
            <div style={{ fontSize: 10, color: '#ffffff22', padding: '12px 6px' }}>No contractors yet.</div>
          ) : contractors.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedContractor(selectedContractor?.id === c.id ? null : c)}
              style={{
                background: selectedContractor?.id === c.id ? '#13161D' : 'transparent',
                border: selectedContractor?.id === c.id ? '1px solid #ffffff12' : '1px solid transparent',
                borderRadius: 8, padding: '10px 12px', marginBottom: 4, cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#DDD5C8', marginBottom: 3 }}>{c.company_name}</div>
              {c.contact_name && <div style={{ fontSize: 10, color: '#ffffff44', marginBottom: 5 }}>{c.contact_name}</div>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                  color: STATUS_COLORS[c.status] || '#888',
                  background: (STATUS_COLORS[c.status] || '#888') + '22',
                  borderRadius: 4, padding: '2px 7px',
                }}>
                  {c.status.toUpperCase()}
                </span>
                {c.specialty && (
                  <span style={{ fontSize: 9, color: '#ffffff33', background: '#ffffff08', borderRadius: 4, padding: '2px 7px' }}>
                    {c.specialty}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedContractor ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#ffffff22' }}>
            <div style={{ fontSize: 32 }}>🤝</div>
            <div style={{ fontSize: 12 }}>Select a contractor to view details</div>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #ffffff08' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selectedContractor.company_name}</div>
                  {selectedContractor.contact_name && <div style={{ fontSize: 12, color: '#ffffff66', marginBottom: 6 }}>{selectedContractor.contact_name}</div>}
                  <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#ffffff44' }}>
                    {selectedContractor.email && <span>✉ {selectedContractor.email}</span>}
                    {selectedContractor.phone && <span>📞 {selectedContractor.phone}</span>}
                    <span style={{
                      background: '#ffffff08', color: '#ffffff55', borderRadius: 4, padding: '1px 8px',
                      fontSize: 9, letterSpacing: '0.06em',
                    }}>
                      {selectedContractor.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['onboarding', 'active', 'inactive'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedContractor, s)}
                      style={{
                        background: selectedContractor.status === s ? STATUS_COLORS[s] + '33' : '#ffffff08',
                        border: selectedContractor.status === s ? `1px solid ${STATUS_COLORS[s]}66` : '1px solid transparent',
                        color: selectedContractor.status === s ? STATUS_COLORS[s] : '#ffffff44',
                        borderRadius: 6, padding: '5px 12px', fontSize: 10,
                        fontFamily: 'IBM Plex Mono, monospace', cursor: 'pointer',
                        fontWeight: selectedContractor.status === s ? 700 : 400,
                      }}
                    >
                      {selectedContractor.status === s ? '✓ ' : '→ '}{s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Message log */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#ffffff44', marginBottom: 12 }}>
                MESSAGE LOG
              </div>
              {loadingMessages ? (
                <div style={{ fontSize: 10, color: '#ffffff22' }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ fontSize: 10, color: '#ffffff22', padding: '12px 0' }}>No messages yet. Send the first one below.</div>
              ) : messages.map(m => (
                <div
                  key={m.id}
                  style={{
                    borderLeft: `3px solid ${m.direction === 'outbound' ? '#C9A84C' : '#4C7BC9'}`,
                    paddingLeft: 12, marginBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
                      color: m.direction === 'outbound' ? '#C9A84C' : '#4C7BC9',
                      background: (m.direction === 'outbound' ? '#C9A84C' : '#4C7BC9') + '22',
                      borderRadius: 3, padding: '1px 6px',
                    }}>
                      {CHANNEL_LABELS[m.channel] || m.channel.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 9, color: '#ffffff33' }}>{m.direction}</span>
                    {m.subject && <span style={{ fontSize: 10, color: '#DDD5C8', fontWeight: 600 }}>· {m.subject}</span>}
                    <span style={{ fontSize: 9, color: '#ffffff22', marginLeft: 'auto' }}>
                      {new Date(m.sent_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#DDD5C8', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.body}</div>
                </div>
              ))}
            </div>

            {/* Send message form */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #ffffff08', background: '#13161D' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#ffffff44', marginBottom: 12 }}>SEND MESSAGE</div>

              {/* Channel radio */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {(['email', 'sms', 'manual'] as const).map(ch => (
                  <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 10, color: msgChannel === ch ? '#C9A84C' : '#ffffff44' }}>
                    <input
                      type="radio"
                      name="channel"
                      value={ch}
                      checked={msgChannel === ch}
                      onChange={() => setMsgChannel(ch)}
                      style={{ accentColor: '#C9A84C' }}
                    />
                    {ch === 'manual' ? 'Manual Note' : ch.toUpperCase()}
                  </label>
                ))}
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 8 }}>
                <input
                  style={inputStyle}
                  placeholder="Subject (optional)"
                  value={msgSubject}
                  onChange={e => setMsgSubject(e.target.value)}
                />
              </div>

              {/* Body */}
              <div style={{ marginBottom: 8 }}>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  placeholder="Message body..."
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                />
              </div>

              {/* Templates + Send */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['welcome', 'assignment', 'policy', 'general'].map(t => (
                    <button
                      key={t}
                      onClick={() => fillTemplate(t)}
                      style={{
                        background: '#ffffff08', border: '1px solid #ffffff0D', borderRadius: 5,
                        color: '#ffffff55', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace',
                        cursor: 'pointer', padding: '4px 10px', letterSpacing: '0.04em',
                      }}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={sendMessage}
                  disabled={sending || !msgBody.trim()}
                  style={{
                    background: sending || !msgBody.trim() ? '#ffffff11' : '#C9A84C',
                    color: sending || !msgBody.trim() ? '#ffffff33' : '#0C0E14',
                    border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 11,
                    fontFamily: 'IBM Plex Mono, monospace', cursor: sending || !msgBody.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
