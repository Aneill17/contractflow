'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getAuthHeaders } from '@/lib/auth'

// ─── Types ──────────────────────────────────────────────────────────────────

type ContactStatus = 'prospect' | 'quoted' | 'active' | 'inactive'
type ContactSource = 'direct' | 'referral' | 'event' | 'cold'
type ConvType = 'call' | 'text' | 'email' | 'meeting' | 'voicemail' | 'other'
type ConvDirection = 'outbound' | 'inbound'

interface Conversation {
  id: string
  contact_id: string
  contract_id: string | null
  type: ConvType
  direction: ConvDirection
  summary: string
  next_action: string | null
  follow_up_date: string | null
  actor: string
  created_at: string
  contacts?: { id: string; name: string; company: string | null; status: ContactStatus }
  contracts?: { id: string; reference: string; client_name: string } | null
}

interface Contact {
  id: string
  name: string
  company: string | null
  role: string | null
  email: string | null
  phone: string | null
  source: ContactSource
  referred_by: string | null
  contract_id: string | null
  quoted: boolean
  status: ContactStatus
  notes: string | null
  created_at: string
  updated_at: string
  contracts?: { id: string; reference: string; client_name: string; stage: number } | null
  conversations?: Conversation[]
  latest_conversation?: Conversation | null
}

interface ContractRef {
  id: string
  reference: string
  client_name: string
  stage: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const N = '#0B2540', T = '#00BFA6', A = '#F59E0B'

const STATUS_META: Record<ContactStatus, { label: string; color: string; bg: string }> = {
  prospect:  { label: 'Prospect',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  quoted:    { label: 'Quoted',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  active:    { label: 'Active',    color: '#00BFA6', bg: 'rgba(0,191,166,0.12)'  },
  inactive:  { label: 'Inactive',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

const CONV_ICONS: Record<ConvType, string> = {
  call:      '📞',
  text:      '💬',
  email:     '📧',
  meeting:   '🤝',
  voicemail: '📳',
  other:     '📝',
}

const CONV_TYPE_LABELS: Record<ConvType, string> = {
  call: 'Call', text: 'Text', email: 'Email',
  meeting: 'Meeting', voicemail: 'Voicemail', other: 'Other',
}

const SOURCE_LABELS: Record<ContactSource, string> = {
  direct: 'Direct', referral: 'Referral', event: 'Event', cold: 'Cold Outreach',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  return new Date(date) <= new Date()
}

// ─── Voice-to-text hook ─────────────────────────────────────────────────────

function useVoiceTranscribe(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Speech recognition not supported in this browser.'); return }
    const rec = new SR()
    recRef.current = rec
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-CA'
    let final = ''
    rec.onresult = (e: any) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      final = transcript
      onTranscript(final)
    }
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
  }, [onTranscript])

  const stop = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, start, stop }
}

// ─── Parse transcript for hints ─────────────────────────────────────────────

function parseTranscript(text: string): { type?: ConvType; contactHint?: string; nextAction?: string } {
  const t = text.toLowerCase()
  let type: ConvType | undefined
  if (/\bcalled?\b|\bphone call\b/.test(t)) type = 'call'
  else if (/\btext(ed|ing)?\b|\bsms\b/.test(t)) type = 'text'
  else if (/\bemail(ed|ing)?\b/.test(t)) type = 'email'
  else if (/\bmet with\b|\bmeeting\b|\bsit down\b/.test(t)) type = 'meeting'
  else if (/\bvoicemail\b/.test(t)) type = 'voicemail'

  // Extract "follow up" or "call back" as next action
  const naMatch = text.match(/(?:follow up|call back|send|email|reach out)[^.,]*/i)
  const nextAction = naMatch ? naMatch[0].trim() : undefined

  return { type, nextAction }
}

// ─── Add/Edit Contact Modal ──────────────────────────────────────────────────

interface ContactFormData {
  name: string; company: string; role: string; email: string; phone: string
  source: ContactSource; referred_by: string; contract_id: string
  quoted: boolean; status: ContactStatus; notes: string
}

function ContactModal({
  initial, contracts, onClose, onSave,
}: {
  initial?: Contact | null
  contracts: ContractRef[]
  onClose: () => void
  onSave: (c: Contact) => void
}) {
  const [form, setForm] = useState<ContactFormData>({
    name: initial?.name ?? '',
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    source: initial?.source ?? 'direct',
    referred_by: initial?.referred_by ?? '',
    contract_id: initial?.contract_id ?? '',
    quoted: initial?.quoted ?? false,
    status: initial?.status ?? 'prospect',
    notes: initial?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: keyof ContactFormData, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('Name is required'); return }
    setSaving(true)
    setErr('')
    try {
      const headers = await getAuthHeaders()
      const url = initial ? `/api/contacts/${initial.id}` : '/api/contacts'
      const method = initial ? 'PATCH' : 'POST'
      const body = { ...form, contract_id: form.contract_id || null, referred_by: form.referred_by || null }
      const r = await fetch(url, { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) { const d = await r.json(); setErr(d.error || 'Save failed'); return }
      const data = await r.json()
      onSave(data)
    } catch { setErr('Network error') }
    finally { setSaving(false) }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeader}>
          <span style={{ fontSize: 15, fontWeight: 700, color: N }}>{initial ? 'Edit Contact' : 'Add Contact'}</span>
          <button style={closeBtnStyle} onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
          {err && <div style={errStyle}>{err}</div>}

          <div style={grid2}>
            <div>
              <div style={lbl}>Name *</div>
              <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <div style={lbl}>Company</div>
              <input style={inp} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company name" />
            </div>
            <div>
              <div style={lbl}>Role / Title</div>
              <input style={inp} value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Project Manager" />
            </div>
            <div>
              <div style={lbl}>Email</div>
              <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@company.com" />
            </div>
            <div>
              <div style={lbl}>Phone</div>
              <input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="604-555-0100" />
            </div>
            <div>
              <div style={lbl}>Source</div>
              <select style={inp} value={form.source} onChange={e => set('source', e.target.value as ContactSource)}>
                {(Object.entries(SOURCE_LABELS) as [ContactSource, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={lbl}>Referred By</div>
              <input style={inp} value={form.referred_by} onChange={e => set('referred_by', e.target.value)} placeholder="Who sent them?" />
            </div>
            <div>
              <div style={lbl}>Status</div>
              <select style={inp} value={form.status} onChange={e => set('status', e.target.value as ContactStatus)}>
                {(Object.keys(STATUS_META) as ContactStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={lbl}>Link to Contract</div>
              <select style={inp} value={form.contract_id} onChange={e => set('contract_id', e.target.value)}>
                <option value="">— None —</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>{c.reference} · {c.client_name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="quoted-cb" checked={form.quoted} onChange={e => set('quoted', e.target.checked)} style={{ width: 16, height: 16, accentColor: T }} />
              <label htmlFor="quoted-cb" style={{ ...lbl, marginBottom: 0, cursor: 'pointer' }}>Quoted</label>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={lbl}>Notes</div>
            <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Background, context, anything useful..." />
          </div>
        </div>

        <div style={modalFooter}>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Log Conversation Modal ──────────────────────────────────────────────────

function ConversationModal({
  contacts, contracts, prefillContactId, prefillContractId,
  onClose, onSave,
}: {
  contacts: Contact[]
  contracts: ContractRef[]
  prefillContactId?: string
  prefillContractId?: string
  onClose: () => void
  onSave: (conv: Conversation) => void
}) {
  const [contactId, setContactId] = useState(prefillContactId ?? '')
  const [contactSearch, setContactSearch] = useState('')
  const [showContactDrop, setShowContactDrop] = useState(false)
  const [contractId, setContractId] = useState(prefillContractId ?? '')
  const [type, setType] = useState<ConvType>('call')
  const [direction, setDirection] = useState<ConvDirection>('outbound')
  const [summary, setSummary] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [actor] = useState('Austin')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // Set display name when prefilling
  const prefillContact = contacts.find(c => c.id === prefillContactId)
  const [selectedContactName, setSelectedContactName] = useState(
    prefillContact ? `${prefillContact.name}${prefillContact.company ? ` · ${prefillContact.company}` : ''}` : ''
  )

  const filteredContacts = contactSearch
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(contactSearch.toLowerCase()))
      )
    : contacts.slice(0, 12)

  const handleVoiceTranscript = useCallback((text: string) => {
    setSummary(text)
    const hints = parseTranscript(text)
    if (hints.type) setType(hints.type)
    if (hints.nextAction) setNextAction(hints.nextAction)
  }, [])

  const { listening, start, stop } = useVoiceTranscribe(handleVoiceTranscript)

  const handleSave = async () => {
    if (!contactId) { setErr('Select a contact'); return }
    if (!summary.trim()) { setErr('Summary is required'); return }
    setSaving(true); setErr('')
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/conversations', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          contract_id: contractId || null,
          type, direction, summary,
          next_action: nextAction || null,
          follow_up_date: followUpDate || null,
          actor,
        }),
      })
      if (!r.ok) { const d = await r.json(); setErr(d.error || 'Failed'); return }
      const data = await r.json()
      onSave(data)
    } catch { setErr('Network error') }
    finally { setSaving(false) }
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 560 }}>
        <div style={modalHeader}>
          <span style={{ fontSize: 15, fontWeight: 700, color: N }}>Log Conversation</span>
          <button style={closeBtnStyle} onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
          {err && <div style={errStyle}>{err}</div>}

          {/* Voice to text */}
          <div style={{ marginBottom: 18, padding: '12px 16px', background: listening ? 'rgba(239,68,68,0.06)' : 'rgba(0,191,166,0.04)', border: `1px solid ${listening ? 'rgba(239,68,68,0.25)' : 'rgba(0,191,166,0.15)'}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{ ...btnGhost, padding: '7px 14px', fontSize: 12, borderColor: listening ? 'rgba(239,68,68,0.4)' : 'rgba(0,191,166,0.3)', color: listening ? '#ef4444' : T, display: 'flex', alignItems: 'center', gap: 7 }}
              onClick={listening ? stop : start}
            >
              {listening ? (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'crm-pulse 1s infinite' }} />
                  Stop Recording
                </>
              ) : (
                <>🎤 Voice to Text</>
              )}
            </button>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace' }}>
              {listening ? 'Listening... speak now' : 'Tap to transcribe directly into Summary'}
            </span>
          </div>

          {/* Contact picker */}
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <div style={lbl}>Contact *</div>
            {prefillContactId ? (
              <div style={{ ...inp, color: '#334155', cursor: 'default' }}>{selectedContactName || 'Selected'}</div>
            ) : (
              <>
                <input
                  style={inp}
                  placeholder="Search contacts..."
                  value={showContactDrop ? contactSearch : selectedContactName}
                  onFocus={() => { setShowContactDrop(true); setContactSearch('') }}
                  onBlur={() => setTimeout(() => setShowContactDrop(false), 150)}
                  onChange={e => { setContactSearch(e.target.value); setShowContactDrop(true) }}
                />
                {showContactDrop && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 220, overflowY: 'auto' }}>
                    {filteredContacts.length === 0 && (
                      <div style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>No contacts found</div>
                    )}
                    {filteredContacts.map(c => (
                      <div
                        key={c.id}
                        style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f1f4f8' }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8f9fb'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                        onMouseDown={() => {
                          setContactId(c.id)
                          setSelectedContactName(`${c.name}${c.company ? ` · ${c.company}` : ''}`)
                          setShowContactDrop(false)
                        }}
                      >
                        <div style={{ fontWeight: 500, color: N }}>{c.name}</div>
                        {c.company && <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.company}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={grid2}>
            {/* Type */}
            <div>
              <div style={lbl}>Type</div>
              <select style={inp} value={type} onChange={e => setType(e.target.value as ConvType)}>
                {(Object.entries(CONV_TYPE_LABELS) as [ConvType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{CONV_ICONS[v]} {l}</option>
                ))}
              </select>
            </div>
            {/* Direction */}
            <div>
              <div style={lbl}>Direction</div>
              <select style={inp} value={direction} onChange={e => setDirection(e.target.value as ConvDirection)}>
                <option value="outbound">→ Outbound</option>
                <option value="inbound">← Inbound</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div style={{ marginTop: 14 }}>
            <div style={lbl}>Summary *</div>
            <textarea
              style={{ ...inp, minHeight: 90, resize: 'vertical' }}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="What was discussed? Key points, decisions made, tone of call..."
            />
          </div>

          <div style={{ ...grid2, marginTop: 14 }}>
            {/* Next action */}
            <div>
              <div style={lbl}>Next Action</div>
              <input style={inp} value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="e.g. Send quote by Friday" />
            </div>
            {/* Follow-up date */}
            <div>
              <div style={lbl}>Follow-Up Date</div>
              <input style={{ ...inp, colorScheme: 'light' }} type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
            </div>
          </div>

          {/* Contract link */}
          <div style={{ marginTop: 14 }}>
            <div style={lbl}>Link to Contract <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></div>
            <select style={inp} value={contractId} onChange={e => setContractId(e.target.value)}>
              <option value="">— None —</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>{c.reference} · {c.client_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={modalFooter}>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Log Conversation'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Card ────────────────────────────────────────────────────────────

function ContactCard({
  contact, onLogConversation, onEdit, onClick,
}: {
  contact: Contact
  onLogConversation: (id: string) => void
  onEdit: (c: Contact) => void
  onClick: (c: Contact) => void
}) {
  const sm = STATUS_META[contact.status]
  const latest = contact.latest_conversation
  const hasFollowUp = latest?.follow_up_date && isOverdue(latest.follow_up_date)

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${hasFollowUp ? 'rgba(245,158,11,0.4)' : '#e8ecf0'}`,
        borderRadius: 10,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        boxShadow: hasFollowUp ? '0 2px 12px rgba(245,158,11,0.08)' : '0 1px 4px rgba(11,37,64,0.05)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,191,166,0.1)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,191,166,0.35)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = hasFollowUp ? '0 2px 12px rgba(245,158,11,0.08)' : '0 1px 4px rgba(11,37,64,0.05)'; (e.currentTarget as HTMLDivElement).style.borderColor = hasFollowUp ? 'rgba(245,158,11,0.4)' : '#e8ecf0' }}
      onClick={() => onClick(contact)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: N, marginBottom: 2 }}>{contact.name}</div>
          {contact.company && <div style={{ fontSize: 12, color: '#64748b' }}>{contact.company}</div>}
          {contact.role && <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>{contact.role}</div>}
        </div>
        <span style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.color}44`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {sm.label}
        </span>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        {contact.email && (
          <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: T, textDecoration: 'none' }}>
            📧 {contact.email}
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: T, textDecoration: 'none' }}>
            📞 {contact.phone}
          </a>
        )}
        {contact.referred_by && (
          <span style={{ fontSize: 11, color: '#94a3b8' }}>👤 via {contact.referred_by}</span>
        )}
      </div>

      {/* Latest conversation snippet */}
      {latest ? (
        <div style={{ background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 7, padding: '8px 12px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {CONV_ICONS[latest.type]} {CONV_TYPE_LABELS[latest.type]} · {fmtDateTime(latest.created_at)}
            </span>
            {latest.follow_up_date && (
              <span style={{ fontSize: 11, color: isOverdue(latest.follow_up_date) ? '#F59E0B' : '#94a3b8', fontFamily: 'IBM Plex Mono, monospace' }}>
                {isOverdue(latest.follow_up_date) ? '⚠ ' : ''}Follow up {fmtDate(latest.follow_up_date)}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {latest.summary || <em style={{ color: '#94a3b8' }}>No summary</em>}
          </div>
          {latest.next_action && (
            <div style={{ fontSize: 11, color: T, marginTop: 4 }}>→ {latest.next_action}</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10, fontStyle: 'italic' }}>No conversations logged yet</div>
      )}

      {/* Contract link + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {contact.contracts && (
            <span style={{ fontSize: 11, color: T, fontFamily: 'IBM Plex Mono, monospace' }}>
              🔗 {contact.contracts.reference}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            style={{ ...btnGhost, fontSize: 11, padding: '5px 11px' }}
            onClick={e => { e.stopPropagation(); onEdit(contact) }}
          >✎ Edit</button>
          <button
            style={{ background: T, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}
            onClick={e => { e.stopPropagation(); onLogConversation(contact.id) }}
          >+ Log</button>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Detail Panel ────────────────────────────────────────────────────

function ContactDetail({
  contact, contracts, onClose, onUpdate,
  onLogConversation,
}: {
  contact: Contact
  contracts: ContractRef[]
  onClose: () => void
  onUpdate: () => void
  onLogConversation: (id: string) => void
}) {
  const sm = STATUS_META[contact.status]
  const [deleting, setDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDeleteConv = async (id: string) => {
    setDeleteId(id)
    setDeleting(true)
    try {
      const headers = await getAuthHeaders()
      await fetch(`/api/conversations/${id}`, { method: 'DELETE', headers })
      onUpdate()
    } finally { setDeleting(false); setDeleteId(null) }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: '24px', boxShadow: '0 2px 12px rgba(11,37,64,0.06)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: N, marginBottom: 3 }}>{contact.name}</div>
          {contact.company && <div style={{ fontSize: 14, color: '#64748b' }}>{contact.company}</div>}
          {contact.role && <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{contact.role}</div>}
          <span style={{ marginTop: 8, display: 'inline-block', background: sm.bg, color: sm.color, border: `1px solid ${sm.color}44`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
            {sm.label}
          </span>
        </div>
        <button style={closeBtnStyle} onClick={onClose}>×</button>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid #e8ecf0' }}>
        {[
          ['Email', contact.email ? <a href={`mailto:${contact.email}`} style={{ color: T }}>{contact.email}</a> : '—'],
          ['Phone', contact.phone || '—'],
          ['Source', SOURCE_LABELS[contact.source]],
          ['Referred By', contact.referred_by || '—'],
          ['Contract', contact.contracts ? `${contact.contracts.reference} · ${contact.contracts.client_name}` : '—'],
          ['Quoted', contact.quoted ? '✓ Yes' : 'No'],
        ].map(([label, val]) => (
          <div key={String(label)}>
            <div style={lbl}>{label}</div>
            <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>{val as any}</div>
          </div>
        ))}
      </div>

      {contact.notes && (
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid #e8ecf0' }}>
          <div style={lbl}>Notes</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginTop: 4 }}>{contact.notes}</div>
        </div>
      )}

      {/* Conversations */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Conversations ({contact.conversations?.length ?? 0})
          </div>
          <button
            style={{ background: T, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => onLogConversation(contact.id)}
          >+ Log Conversation</button>
        </div>

        {(!contact.conversations || contact.conversations.length === 0) && (
          <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '16px 0' }}>No conversations logged yet.</div>
        )}

        {contact.conversations?.map((conv) => (
          <div key={conv.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f4f8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 16 }}>{CONV_ICONS[conv.type]}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: N }}>{CONV_TYPE_LABELS[conv.type]}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{conv.direction === 'outbound' ? '→ Out' : '← In'}</span>
                {conv.contracts && (
                  <span style={{ fontSize: 11, color: T, fontFamily: 'IBM Plex Mono, monospace' }}>🔗 {conv.contracts.reference}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace' }}>{fmtDateTime(conv.created_at)}</span>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: 15, padding: '0 4px' }}
                  onClick={() => handleDeleteConv(conv.id)}
                  disabled={deleting && deleteId === conv.id}
                  title="Delete"
                >×</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, marginBottom: conv.next_action || conv.follow_up_date ? 6 : 0 }}>
              {conv.summary}
            </div>
            {conv.next_action && (
              <div style={{ fontSize: 12, color: T, marginTop: 4 }}>→ <strong>Next:</strong> {conv.next_action}</div>
            )}
            {conv.follow_up_date && (
              <div style={{ fontSize: 11, color: isOverdue(conv.follow_up_date) ? A : '#94a3b8', marginTop: 3, fontFamily: 'IBM Plex Mono, monospace' }}>
                {isOverdue(conv.follow_up_date) ? '⚠ OVERDUE — ' : '📅 '}Follow up: {fmtDate(conv.follow_up_date)}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>— {conv.actor}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Conversations Feed Tab ──────────────────────────────────────────────────

function ConversationsFeed({
  conversations, contacts, contracts, onLogConversation,
}: {
  conversations: Conversation[]
  contacts: Contact[]
  contracts: ContractRef[]
  onLogConversation: () => void
}) {
  const [filterContact, setFilterContact] = useState('')
  const [filterContract, setFilterContract] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const filtered = conversations.filter(c => {
    if (filterContact && c.contact_id !== filterContact) return false
    if (filterContract && c.contract_id !== filterContract) return false
    if (filterType && c.type !== filterType) return false
    if (filterFrom && new Date(c.created_at) < new Date(filterFrom)) return false
    if (filterTo && new Date(c.created_at) > new Date(filterTo + 'T23:59:59')) return false
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, padding: '14px 18px', background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 8 }}>
        <select style={{ ...inp, flex: '1 1 160px', maxWidth: 220 }} value={filterContact} onChange={e => setFilterContact(e.target.value)}>
          <option value="">All Contacts</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}
        </select>
        <select style={{ ...inp, flex: '1 1 160px', maxWidth: 220 }} value={filterContract} onChange={e => setFilterContract(e.target.value)}>
          <option value="">All Contracts</option>
          {contracts.map(c => <option key={c.id} value={c.id}>{c.reference} · {c.client_name}</option>)}
        </select>
        <select style={{ ...inp, flex: '0 0 130px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {(Object.entries(CONV_TYPE_LABELS) as [ConvType, string][]).map(([v, l]) => (
            <option key={v} value={v}>{CONV_ICONS[v]} {l}</option>
          ))}
        </select>
        <input style={{ ...inp, flex: '0 0 130px', colorScheme: 'light' }} type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} placeholder="From" title="From date" />
        <input style={{ ...inp, flex: '0 0 130px', colorScheme: 'light' }} type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} placeholder="To" title="To date" />
        {(filterContact || filterContract || filterType || filterFrom || filterTo) && (
          <button style={{ ...btnGhost, padding: '7px 14px', fontSize: 11 }} onClick={() => { setFilterContact(''); setFilterContract(''); setFilterType(''); setFilterFrom(''); setFilterTo('') }}>
            Clear Filters
          </button>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button style={{ ...btnPrimary, padding: '7px 16px', fontSize: 12 }} onClick={onLogConversation}>
            + Log Conversation
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
          No conversations yet. <button style={{ background: 'none', border: 'none', color: T, cursor: 'pointer', fontSize: 13, padding: 0 }} onClick={onLogConversation}>Log the first one →</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {filtered.map((conv, i) => (
          <div key={conv.id} style={{ padding: '16px 0', borderBottom: i < filtered.length - 1 ? '1px solid #f1f4f8' : 'none', display: 'flex', gap: 16 }}>
            {/* Date column */}
            <div style={{ flexShrink: 0, width: 100, paddingTop: 2 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8' }}>
                {new Date(conv.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8' }}>
                {new Date(conv.created_at).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Icon */}
            <div style={{ fontSize: 20, flexShrink: 0, width: 32, paddingTop: 1 }}>{CONV_ICONS[conv.type]}</div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: N }}>{conv.contacts?.name ?? '—'}</span>
                {conv.contacts?.company && <span style={{ fontSize: 12, color: '#94a3b8' }}>{conv.contacts.company}</span>}
                <span style={{ fontSize: 11, color: '#64748b' }}>{CONV_TYPE_LABELS[conv.type]} · {conv.direction === 'outbound' ? '→ Out' : '← In'}</span>
                {conv.contracts && (
                  <span style={{ fontSize: 11, color: T, fontFamily: 'IBM Plex Mono, monospace' }}>🔗 {conv.contracts.reference}</span>
                )}
                {conv.contacts && (
                  <span style={{ background: STATUS_META[conv.contacts.status]?.bg, color: STATUS_META[conv.contacts.status]?.color, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
                    {STATUS_META[conv.contacts.status]?.label}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, marginBottom: 4 }}>{conv.summary}</div>
              {conv.next_action && (
                <div style={{ fontSize: 12, color: T }}>→ <strong>Next:</strong> {conv.next_action}</div>
              )}
              {conv.follow_up_date && (
                <div style={{ fontSize: 11, color: isOverdue(conv.follow_up_date) ? A : '#94a3b8', marginTop: 3, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {isOverdue(conv.follow_up_date) ? '⚠ OVERDUE — ' : '📅 '}Follow up: {fmtDate(conv.follow_up_date)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Shared style tokens ─────────────────────────────────────────────────────

const lbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#94a3b8', marginBottom: 5,
  fontFamily: 'IBM Plex Mono, monospace',
}
const inp: React.CSSProperties = {
  width: '100%', background: '#f8f9fb', border: '1px solid #e8ecf0',
  borderRadius: 7, padding: '8px 12px', fontSize: 13, color: '#334155',
  fontFamily: "'Segoe UI', system-ui, sans-serif", outline: 'none',
  boxSizing: 'border-box',
}
const grid2: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
}
const btnPrimary: React.CSSProperties = {
  background: T, color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#64748b', border: '1px solid #e8ecf0',
  borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
}
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(11,37,64,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 20,
}
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(11,37,64,0.15)',
  width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
}
const modalHeader: React.CSSProperties = {
  padding: '18px 24px 14px', borderBottom: '1px solid #e8ecf0',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}
const modalFooter: React.CSSProperties = {
  padding: '14px 24px', borderTop: '1px solid #e8ecf0',
  display: 'flex', justifyContent: 'flex-end', gap: 10,
}
const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 22, color: '#94a3b8',
  cursor: 'pointer', lineHeight: 1, padding: '0 4px',
}
const errStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
  color: '#ef4444', padding: '10px 14px', borderRadius: 7,
  fontSize: 13, marginBottom: 14,
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [tab, setTab] = useState<'contacts' | 'conversations'>('contacts')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [contracts, setContracts] = useState<ContractRef[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddContact, setShowAddContact] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [showLogConv, setShowLogConv] = useState(false)
  const [prefillContactId, setPrefillContactId] = useState<string | undefined>()
  const [prefillContractId] = useState<string | undefined>()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [filterStatus, setFilterStatus] = useState<ContactStatus | 'all'>('all')
  const [filterFollowUpDue, setFilterFollowUpDue] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [searchQ, setSearchQ] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const [cr, convR, ctR] = await Promise.all([
        fetch('/api/contacts', { headers }),
        fetch('/api/conversations', { headers }),
        fetch('/api/contracts', { headers }),
      ])
      if (cr.ok) setContacts(await cr.json())
      if (convR.ok) setConversations(await convR.json())
      if (ctR.ok) {
        const data = await ctR.json()
        setContracts(Array.isArray(data) ? data.map((c: any) => ({ id: c.id, reference: c.reference, client_name: c.client_name, stage: c.stage })) : [])
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Refresh selected contact detail when data reloads
  useEffect(() => {
    if (selectedContact) {
      const updated = contacts.find(c => c.id === selectedContact.id)
      if (updated) setSelectedContact(updated)
    }
  }, [contacts])

  // Follow-up due count
  const today = new Date().toISOString().split('T')[0]
  const followUpDue = contacts.filter(c =>
    c.latest_conversation?.follow_up_date &&
    c.latest_conversation.follow_up_date <= today
  )

  // Filtered contacts
  const filteredContacts = contacts.filter(c => {
    if (filterFollowUpDue) {
      if (!c.latest_conversation?.follow_up_date || c.latest_conversation.follow_up_date > today) return false
    }
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      )
    }
    return true
  })

  const handleLogConv = (contactId?: string) => {
    setPrefillContactId(contactId)
    setShowLogConv(true)
  }

  const handleContactSaved = (c: Contact) => {
    setShowAddContact(false)
    setEditContact(null)
    load()
    showToast(editContact ? 'Contact updated' : 'Contact added')
  }

  const handleConvSaved = (conv: Conversation) => {
    setShowLogConv(false)
    load()
    showToast('Conversation logged')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes crm-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .crm-nav-link { text-decoration: none; }
      `}</style>

      {/* ── Sidebar ── */}
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ width: 230, background: N, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, minHeight: '100vh', position: 'sticky', top: 0 }}>
          <a href="/" style={{ display: 'block', textDecoration: 'none', marginBottom: 20 }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '8px 12px' }}>
              <img src="/logo.png" alt="ERS" style={{ height: 44, width: 'auto', display: 'block' }} />
            </div>
          </a>
          <div style={{ padding: '0 10px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              Contract<span style={{ color: T }}>Flow</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginTop: 2 }}>HOUSING MGMT</div>
          </div>

          {[
            { href: '/', icon: '▦', label: 'Dashboard' },
            { href: '/dashboard/contacts', icon: '👥', label: 'CRM / Contacts', active: true },
            { href: '/dashboard/kpi', icon: '📊', label: 'KPI' },
            { href: '/dashboard/pipeline', icon: '🚀', label: 'Pipeline' },
            { href: '/dashboard/units', icon: '🏘️', label: 'Units' },
            { href: '/dashboard/ap-ar', icon: '💰', label: 'AP / AR' },
            { href: '/dashboard/sourcing', icon: '🔍', label: 'Sourcing' },
          ].map(n => (
            <a key={n.href} href={n.href} className="crm-nav-link" style={{
              padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              color: n.active ? T : 'rgba(255,255,255,0.55)',
              background: n.active ? 'rgba(0,191,166,0.18)' : 'transparent',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
            </a>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', paddingLeft: 10, fontFamily: 'IBM Plex Mono, monospace' }}>
              CRM v1
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, padding: '36px 40px', overflow: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: N, letterSpacing: '-0.02em' }}>CRM · Contacts</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                {contacts.length} contacts · {conversations.length} conversations logged
              </div>
            </div>
            <button style={{ ...btnPrimary, padding: '10px 22px', fontSize: 13 }} onClick={() => { setEditContact(null); setShowAddContact(true) }}>
              + Add Contact
            </button>
          </div>

          {/* Follow-up due banner */}
          {followUpDue.length > 0 && (
            <div
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 9, padding: '12px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => { setFilterFollowUpDue(!filterFollowUpDue); setTab('contacts') }}
            >
              <div>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, fontWeight: 600, color: A }}>
                  ⚠ {followUpDue.length} follow-up{followUpDue.length !== 1 ? 's' : ''} due or overdue
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 10 }}>
                  {followUpDue.slice(0, 3).map(c => c.name).join(', ')}{followUpDue.length > 3 ? ` +${followUpDue.length - 3} more` : ''}
                </span>
              </div>
              <button style={{ ...btnGhost, fontSize: 11, padding: '5px 12px', borderColor: 'rgba(245,158,11,0.4)', color: A }}>
                {filterFollowUpDue ? 'Show All' : 'Filter →'}
              </button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e8ecf0', marginBottom: 24 }}>
            {([
              ['contacts', '👥 Contacts'],
              ['conversations', '💬 Conversations'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{ background: 'none', border: 'none', borderBottom: tab === key ? `2px solid ${T}` : '2px solid transparent', color: tab === key ? T : '#94a3b8', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: tab === key ? 600 : 400, padding: '8px 18px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: -1, transition: 'all 0.15s' }}
              >
                {label}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          )}

          {/* ── Contacts Tab ── */}
          {!loading && tab === 'contacts' && (
            <div>
              {/* Filters row */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  style={{ ...inp, flex: '1 1 200px', maxWidth: 280 }}
                  placeholder="Search contacts..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  {([['all', 'All'], ['prospect', 'Prospect'], ['quoted', 'Quoted'], ['active', 'Active'], ['inactive', 'Inactive']] as [ContactStatus | 'all', string][]).map(([s, l]) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      style={{
                        background: filterStatus === s ? (s === 'all' ? N : STATUS_META[s as ContactStatus]?.color ?? N) : 'transparent',
                        color: filterStatus === s ? '#fff' : '#64748b',
                        border: `1px solid ${filterStatus === s ? 'transparent' : '#e8ecf0'}`,
                        borderRadius: 20, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontWeight: 500,
                        transition: 'all 0.15s',
                      }}
                    >{l} {s !== 'all' ? `(${contacts.filter(c => c.status === s).length})` : `(${contacts.length})`}</button>
                  ))}
                </div>
              </div>

              {filteredContacts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>
                  {contacts.length === 0
                    ? <span>No contacts yet. <button style={{ background: 'none', border: 'none', color: T, cursor: 'pointer', fontSize: 13, padding: 0 }} onClick={() => setShowAddContact(true)}>Add your first contact →</button></span>
                    : 'No contacts match the current filters.'
                  }
                </div>
              )}

              {/* Two-column layout: cards + detail */}
              <div style={{ display: 'grid', gridTemplateColumns: selectedContact ? '1fr 1.1fr' : '1fr', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: selectedContact ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, alignContent: 'start' }}>
                  {filteredContacts.map(contact => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onLogConversation={(id) => handleLogConv(id)}
                      onEdit={(c) => { setEditContact(c); setShowAddContact(true) }}
                      onClick={(c) => setSelectedContact(prev => prev?.id === c.id ? null : c)}
                    />
                  ))}
                </div>

                {selectedContact && (
                  <div style={{ position: 'sticky', top: 20, height: 'fit-content' }}>
                    <ContactDetail
                      contact={selectedContact}
                      contracts={contracts}
                      onClose={() => setSelectedContact(null)}
                      onUpdate={() => load()}
                      onLogConversation={(id) => handleLogConv(id)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Conversations Tab ── */}
          {!loading && tab === 'conversations' && (
            <ConversationsFeed
              conversations={conversations}
              contacts={contacts}
              contracts={contracts}
              onLogConversation={() => handleLogConv(undefined)}
            />
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showAddContact && (
        <ContactModal
          initial={editContact}
          contracts={contracts}
          onClose={() => { setShowAddContact(false); setEditContact(null) }}
          onSave={handleContactSaved}
        />
      )}

      {showLogConv && (
        <ConversationModal
          contacts={contacts}
          contracts={contracts}
          prefillContactId={prefillContactId}
          prefillContractId={prefillContractId}
          onClose={() => setShowLogConv(false)}
          onSave={handleConvSaved}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, background: '#f0fdf9', border: '1px solid #00BFA655', color: '#00a892', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
