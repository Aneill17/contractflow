'use client'

import { useState } from 'react'

// ─── Color constants ─────────────────────────────────────────────────────────
const N = '#0B2540'
const T = '#00BFA6'
const A = '#F59E0B'

// ─── Types ───────────────────────────────────────────────────────────────────
type ContactStatus = 'prospect' | 'quoted' | 'active' | 'inactive'
type ConvType = 'call' | 'text' | 'email' | 'meeting' | 'in_person' | 'voicemail' | 'other'
type ConvDirection = 'outbound' | 'inbound'
type HowMet = 'cold_outreach' | 'in_person' | 'referral_intro' | 'event' | 'existing_relationship' | 'inbound_inquiry'

interface FullConversation {
  id: string
  date: string
  type: ConvType
  direction: ConvDirection
  summary: string
  nextAction?: string
  followUpDate?: string
  followUpOverdue?: boolean
  howMet?: HowMet
  whereMet?: string
  businessCard?: boolean
}

interface Contact {
  id: string
  name: string
  company: string
  role: string
  email: string
  phone: string
  status: ContactStatus
  source: string
  referredBy?: string
  contract?: { ref: string; location: string }
  quoted: boolean
  lastConv?: {
    date: string
    type: ConvType
    summary: string
  }
  nextAction: string
  followUpDate: string
  followUpOverdue: boolean
  followUpToday: boolean
  conversations?: FullConversation[]
}

interface Conversation {
  id: string
  date: string
  type: ConvType
  direction: ConvDirection
  contactName: string
  company: string
  summary: string
  nextAction?: string
  followUpDate?: string
  followUpOverdue?: boolean
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const SANDRA_CONVERSATIONS: FullConversation[] = [
  {
    id: 'sc1',
    date: 'Jun 5, 2026',
    type: 'call',
    direction: 'outbound',
    summary: 'Confirmed extension through September. Will send updated PO by end of week.',
    nextAction: 'Send updated contract addendum',
    followUpDate: 'Jun 12',
    followUpOverdue: true,
    howMet: 'referral_intro',
    whereMet: undefined,
    businessCard: false,
  },
  {
    id: 'sc2',
    date: 'Jun 5, 2026',
    type: 'email',
    direction: 'inbound',
    summary: 'Received updated invoice. Payment processing this week.',
    howMet: undefined,
    businessCard: false,
  },
  {
    id: 'sc3',
    date: 'May 22, 2026',
    type: 'call',
    direction: 'outbound',
    summary: 'Discussed Q3 headcount increase — 4 more staff from Aug 1.',
    howMet: undefined,
    businessCard: false,
  },
  {
    id: 'sc4',
    date: 'Jun 8, 2026',
    type: 'in_person',
    direction: 'outbound',
    summary: 'Met Sandra at Toastmasters Monday. Great conversation about scaling the DC Hub project. She mentioned interest in a larger master lease arrangement.',
    nextAction: 'Send DC Hub master lease proposal',
    followUpDate: 'Jun 15',
    followUpOverdue: false,
    howMet: 'in_person',
    whereMet: 'Toastmasters Monday June 8',
    businessCard: true,
  },
]

const CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Sandra Leigh',
    company: 'Meridian Construction Group',
    role: 'Director of Procurement',
    email: 'sandra.leigh@meridiancg.com',
    phone: '(604) 555-0182',
    status: 'active',
    source: 'referral',
    referredBy: 'John Dyak',
    contract: { ref: 'CF-2024-0089', location: 'Whistler' },
    quoted: true,
    lastConv: {
      date: 'Jun 8',
      type: 'in_person',
      summary: 'Met at Toastmasters Monday. Interested in DC Hub master lease.',
    },
    nextAction: 'Send DC Hub master lease proposal',
    followUpDate: 'Jun 15',
    followUpOverdue: false,
    followUpToday: false,
    conversations: SANDRA_CONVERSATIONS,
  },
  {
    id: '2',
    name: 'Kelly Marsh',
    company: 'Maxwell Floors',
    role: 'Operations Manager',
    email: 'kelly@maxwellfloors.com',
    phone: '(250) 555-0144',
    status: 'active',
    source: 'direct',
    contract: { ref: 'CF-2024-0012', location: 'Couch Bay' },
    quoted: true,
    lastConv: {
      date: 'Jun 7',
      type: 'text',
      summary: 'Asked about adding 3 more people in July. Need to confirm unit availability.',
    },
    nextAction: 'Check unit availability, send options',
    followUpDate: 'Jun 9',
    followUpOverdue: true,
    followUpToday: false,
  },
  {
    id: '3',
    name: 'Tony Fulmer',
    company: 'Fulmer & Co Capital',
    role: 'Managing Partner',
    email: 'tony@fulmerco.com',
    phone: '(416) 555-0291',
    status: 'prospect',
    source: 'referral',
    referredBy: 'Dr. Rob Johnson',
    quoted: false,
    lastConv: {
      date: 'Jun 6',
      type: 'meeting',
      summary: 'Coffee meeting. Interested in DC Hub investment. Wants to see full deck + pro forma.',
    },
    nextAction: 'Send DC Hub investor deck',
    followUpDate: 'Jun 10',
    followUpOverdue: true,
    followUpToday: false,
  },
  {
    id: '4',
    name: 'Dr. Patricia Yuen',
    company: 'Northern Health',
    role: 'Director of Workforce Housing',
    email: 'pyuen@northernhealth.bc.ca',
    phone: '(250) 555-0337',
    status: 'prospect',
    source: 'referral',
    referredBy: 'Dr. Rob Johnson',
    quoted: false,
    lastConv: {
      date: 'May 28',
      type: 'email',
      summary: 'Initial outreach re: Dawson Creek Hub master lease. Expressed interest, forwarded to her team.',
    },
    nextAction: 'Follow up — check if team has reviewed',
    followUpDate: 'Jun 3',
    followUpOverdue: true,
    followUpToday: false,
  },
  {
    id: '5',
    name: 'Mark Osei',
    company: 'Green Infrastructure Partners',
    role: 'Site Manager',
    email: 'm.osei@greeninfra.ca',
    phone: '(778) 555-0219',
    status: 'quoted',
    source: 'direct',
    quoted: true,
    lastConv: {
      date: 'Jun 4',
      type: 'call',
      summary: 'Reviewed quote for Campbell River. Wants to negotiate on rate — counter at $98/night.',
    },
    nextAction: 'Discuss rate with Austin, respond with final offer',
    followUpDate: 'Jun 8',
    followUpOverdue: false,
    followUpToday: true,
  },
  {
    id: '6',
    name: 'Raj Patel',
    company: 'Waterloo Research Institute',
    role: 'Research Director',
    email: 'r.patel@waterloo.ca',
    phone: '(519) 555-0088',
    status: 'prospect',
    source: 'event',
    referredBy: 'Waterloo PhD meetup',
    quoted: false,
    lastConv: {
      date: 'Jun 3',
      type: 'email',
      summary: 'Met at Vancouver tech event. Sent intro email about ERS research housing program.',
    },
    nextAction: 'Schedule intro call',
    followUpDate: 'Jun 11',
    followUpOverdue: false,
    followUpToday: false,
  },
  {
    id: '7',
    name: 'Angela Burnett',
    company: 'Interior Health Authority',
    role: 'Housing Coordinator',
    email: 'a.burnett@interiorhealth.bc.ca',
    phone: '(250) 555-0412',
    status: 'prospect',
    source: 'cold',
    quoted: false,
    lastConv: {
      date: 'May 15',
      type: 'call',
      summary: 'Cold outreach. Mentioned they have 8 nurses needing housing in Kamloops through August.',
    },
    nextAction: 'Send Kamloops unit availability + rates',
    followUpDate: 'May 20',
    followUpOverdue: true,
    followUpToday: false,
  },
  {
    id: '8',
    name: 'Bryce Holloway',
    company: 'Squamish Infrastructure Group',
    role: 'Project Lead',
    email: 'b.holloway@squamishig.ca',
    phone: '(604) 555-0561',
    status: 'quoted',
    source: 'direct',
    quoted: true,
    lastConv: {
      date: 'Jun 7',
      type: 'meeting',
      summary: 'Site visit to proposed Squamish units. Liked the setup. Ready to sign pending legal review.',
    },
    nextAction: 'Send contract for review',
    followUpDate: 'Jun 10',
    followUpOverdue: true,
    followUpToday: false,
  },
]

const CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    date: 'Jun 8',
    type: 'in_person',
    direction: 'outbound',
    contactName: 'Sandra Leigh',
    company: 'Meridian Construction Group',
    summary: 'Met at Toastmasters Monday. Interested in DC Hub master lease.',
    nextAction: 'Send DC Hub proposal',
    followUpDate: 'Jun 15',
    followUpOverdue: false,
  },
  {
    id: 'c2',
    date: 'Jun 8',
    type: 'text',
    direction: 'outbound',
    contactName: 'Kelly Marsh',
    company: 'Maxwell Floors',
    summary: 'Following up on July unit request — checking availability now',
    nextAction: 'Confirm availability and send options',
    followUpDate: 'Jun 9',
    followUpOverdue: true,
  },
  {
    id: 'c3',
    date: 'Jun 7',
    type: 'email',
    direction: 'inbound',
    contactName: 'Sandra Leigh',
    company: 'Meridian Construction Group',
    summary: 'Received updated invoice. Payment processing this week.',
    nextAction: 'Send contract addendum',
    followUpDate: 'Jun 12',
    followUpOverdue: true,
  },
  {
    id: 'c4',
    date: 'Jun 7',
    type: 'meeting',
    direction: 'outbound',
    contactName: 'Bryce Holloway',
    company: 'Squamish Infrastructure Group',
    summary: 'Site visit to proposed Squamish units. Liked the setup. Ready to sign pending legal review.',
    nextAction: 'Send contract for review',
    followUpDate: 'Jun 10',
    followUpOverdue: true,
  },
  {
    id: 'c5',
    date: 'Jun 6',
    type: 'meeting',
    direction: 'outbound',
    contactName: 'Tony Fulmer',
    company: 'Fulmer & Co Capital',
    summary: 'Coffee at Revolver. 45 min. Great energy — he\'s done deals like this before.',
    nextAction: 'Send DC Hub investor deck',
    followUpDate: 'Jun 10',
    followUpOverdue: true,
  },
  {
    id: 'c6',
    date: 'Jun 5',
    type: 'call',
    direction: 'outbound',
    contactName: 'Sandra Leigh',
    company: 'Meridian Construction Group',
    summary: 'Confirmed extension through September. Will send updated PO by end of week.',
    nextAction: 'Send updated contract addendum',
    followUpDate: 'Jun 12',
    followUpOverdue: true,
  },
  {
    id: 'c7',
    date: 'Jun 5',
    type: 'email',
    direction: 'outbound',
    contactName: 'Dr. Patricia Yuen',
    company: 'Northern Health',
    summary: 'Sent intro package re: Dawson Creek Hub master lease opportunity',
    nextAction: 'Follow up — check if team reviewed',
    followUpDate: 'Jun 3',
    followUpOverdue: true,
  },
  {
    id: 'c8',
    date: 'Jun 4',
    type: 'call',
    direction: 'inbound',
    contactName: 'Mark Osei',
    company: 'Green Infrastructure Partners',
    summary: 'Called to discuss Campbell River quote — wants to negotiate',
    nextAction: 'Respond with final offer',
    followUpDate: 'Jun 8',
    followUpOverdue: false,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<ContactStatus, { label: string; color: string; bg: string }> = {
  prospect: { label: 'Prospect',  color: '#F59E0B',  bg: 'rgba(245,158,11,0.12)' },
  quoted:   { label: 'Quoted',    color: '#6366f1',  bg: 'rgba(99,102,241,0.12)' },
  active:   { label: 'Active',    color: '#00BFA6',  bg: 'rgba(0,191,166,0.12)'  },
  inactive: { label: 'Inactive',  color: '#94a3b8',  bg: 'rgba(148,163,184,0.12)'},
}

const TYPE_ICON: Record<ConvType, string> = {
  call:      '📞',
  text:      '💬',
  email:     '📧',
  meeting:   '🤝',
  in_person: '🤝',
  voicemail: '📱',
  other:     '📝',
}

const TYPE_LABEL: Record<ConvType, string> = {
  call:      'Call',
  text:      'Text',
  email:     'Email',
  meeting:   'Meeting',
  in_person: 'In Person',
  voicemail: 'Voicemail',
  other:     'Other',
}

const HOW_MET_LABELS: Record<HowMet, string> = {
  cold_outreach:         'Cold Outreach',
  in_person:             'In Person',
  referral_intro:        'Referral Intro',
  event:                 'Event',
  existing_relationship: 'Existing Relationship',
  inbound_inquiry:       'Inbound Inquiry',
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ContactStatus }) {
  const m = STATUS_META[status]
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: m.color,
      background: m.bg,
      border: `1px solid ${m.color}44`,
      borderRadius: 4,
      padding: '2px 7px',
    }}>
      {m.label}
    </span>
  )
}

function FollowUpChip({ date, overdue, today }: { date: string; overdue: boolean; today: boolean }) {
  const color = overdue ? '#ef4444' : today ? '#F59E0B' : '#64748b'
  const bg = overdue ? 'rgba(239,68,68,0.08)' : today ? 'rgba(245,158,11,0.08)' : 'rgba(100,116,139,0.06)'
  const label = overdue ? `⚠ ${date}` : today ? `⏰ ${date}` : `📅 ${date}`
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${color}33`,
      borderRadius: 4,
      padding: '2px 7px',
    }}>
      {label}
    </span>
  )
}

function AvatarCircle({ name, size = 36 }: { name: string; size?: number }) {
  const colors = [T, A, '#6366f1', '#ec4899', '#14b8a6', '#f97316']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: colors[idx],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 700,
      fontSize: size * 0.36,
      flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  )
}

// ─── Contact Card ─────────────────────────────────────────────────────────────
function ContactCard({
  contact,
  expanded,
  onClick,
  onLog,
}: {
  contact: Contact
  expanded: boolean
  onClick: () => void
  onLog: (contactId: string) => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 12,
        border: `2px solid ${expanded ? T : '#e8edf2'}`,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: expanded ? `0 0 0 3px ${T}22` : '0 1px 4px rgba(11,37,64,0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <AvatarCircle name={contact.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: N }}>{contact.name}</span>
            <StatusBadge status={contact.status} />
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{contact.company}</div>
        </div>
      </div>

      {/* Role + contact */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 12, color: '#475569' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8', marginRight: 4 }}>ROLE</span>
          {contact.role}
        </div>
        <div style={{ fontSize: 12, color: '#475569' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8', marginRight: 4 }}>EMAIL</span>
          {contact.email}
        </div>
        {contact.referredBy && (
          <div style={{ fontSize: 11, color: '#6366f1', marginTop: 1 }}>
            👤 Referred by: {contact.referredBy}
          </div>
        )}
      </div>

      {/* Contract badge */}
      {contact.contract && (
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: N,
            background: 'rgba(11,37,64,0.07)',
            border: '1px solid rgba(11,37,64,0.15)',
            borderRadius: 4,
            padding: '2px 7px',
          }}>
            📋 {contact.contract.ref} · {contact.contract.location}
          </span>
        </div>
      )}

      {/* Last conversation */}
      {contact.lastConv && (
        <div style={{
          background: '#f8f9fb',
          borderRadius: 8,
          padding: '8px 10px',
          fontSize: 12,
          color: '#475569',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8' }}>LAST</span>
            <span style={{ color: '#64748b', fontSize: 11 }}>{contact.lastConv.date}</span>
            <span>{TYPE_ICON[contact.lastConv.type]}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8' }}>
              {TYPE_LABEL[contact.lastConv.type].toUpperCase()}
            </span>
          </div>
          <div style={{ color: '#374151', lineHeight: 1.4 }}>
            &ldquo;{truncate(contact.lastConv.summary, 72)}&rdquo;
          </div>
        </div>
      )}

      {/* Follow-up + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <FollowUpChip date={contact.followUpDate} overdue={contact.followUpOverdue} today={contact.followUpToday} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={e => e.stopPropagation()}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: `1px solid ${N}22`,
              background: '#f8f9fb',
              color: N,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onLog(contact.id) }}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: `1px solid ${T}55`,
              background: `${T}11`,
              color: T,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            💬 Log
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Detail Panel (slide-in) ─────────────────────────────────────────
function ContactDetailPanel({
  contact,
  onClose,
  onLog,
}: {
  contact: Contact
  onClose: () => void
  onLog: (contactId: string) => void
}) {
  const sm = STATUS_META[contact.status]
  const convs = contact.conversations ?? []

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: `2px solid ${T}`,
      padding: '20px 22px',
      boxShadow: `0 0 0 4px ${T}18, 0 4px 24px rgba(11,37,64,0.10)`,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'sticky',
      top: 20,
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AvatarCircle name={contact.name} size={48} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 17, color: N }}>{contact.name}</span>
              <StatusBadge status={contact.status} />
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{contact.role} · {contact.company}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: 20, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          ×
        </button>
      </div>

      {/* Edit contact button */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${N}22`,
          background: '#f8f9fb', color: N, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ✏️ Edit Contact
        </button>
        <button
          onClick={() => onLog(contact.id)}
          style={{
            flex: 1, padding: '8px', borderRadius: 8, border: 'none',
            background: T, color: '#fff', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          💬 Log Conversation
        </button>
      </div>

      {/* Contact details */}
      <div style={{
        background: '#f8f9fb',
        borderRadius: 8,
        padding: '12px 14px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px 16px',
        fontSize: 12,
      }}>
        <div><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8' }}>EMAIL </span>{contact.email}</div>
        <div><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8' }}>PHONE </span>{contact.phone}</div>
        <div><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8' }}>SOURCE </span>{contact.source}</div>
        {contact.referredBy && (
          <div><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8' }}>REF BY </span>{contact.referredBy}</div>
        )}
        {contact.contract && (
          <div style={{ gridColumn: '1/-1' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8' }}>CONTRACT </span>
            <span style={{ color: N, fontWeight: 600 }}>{contact.contract.ref}</span>
            <span style={{ color: '#64748b' }}> · {contact.contract.location}</span>
          </div>
        )}
      </div>

      {/* Next action */}
      <div style={{
        background: `${A}12`,
        border: `1px solid ${A}44`,
        borderRadius: 8,
        padding: '10px 14px',
      }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: A, fontWeight: 700, marginBottom: 4 }}>NEXT ACTION</div>
        <div style={{ fontSize: 13, color: N, fontWeight: 600 }}>{contact.nextAction}</div>
        <div style={{ marginTop: 6 }}>
          <FollowUpChip date={contact.followUpDate} overdue={contact.followUpOverdue} today={contact.followUpToday} />
        </div>
      </div>

      {/* Full conversation timeline */}
      <div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: '#94a3b8',
          fontWeight: 700,
          letterSpacing: '0.06em',
          marginBottom: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>CONVERSATION TIMELINE ({convs.length})</span>
          <span style={{ fontSize: 9, color: '#cbd5e1' }}>newest first</span>
        </div>

        {convs.length === 0 && (
          <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
            No conversations logged yet.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...convs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((conv) => (
            <div key={conv.id} style={{
              display: 'flex',
              gap: 10,
              padding: '12px 14px',
              background: '#f8f9fb',
              borderRadius: 8,
              borderLeft: `3px solid ${conv.direction === 'inbound' ? T : A}`,
            }}>
              <div style={{ fontSize: 16, flexShrink: 0 }}>{TYPE_ICON[conv.type]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#94a3b8' }}>{conv.date}</span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9, fontWeight: 700,
                    color: conv.direction === 'inbound' ? T : A,
                    background: conv.direction === 'inbound' ? `${T}15` : `${A}15`,
                    padding: '1px 5px', borderRadius: 3,
                  }}>
                    {conv.direction === 'inbound' ? '← IN' : '→ OUT'}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>
                    {TYPE_LABEL[conv.type]}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.45, marginBottom: conv.nextAction || conv.followUpDate || conv.howMet ? 6 : 0 }}>
                  &ldquo;{conv.summary}&rdquo;
                </div>
                {conv.nextAction && (
                  <div style={{ fontSize: 11, color: T, marginBottom: 3 }}>→ {conv.nextAction}</div>
                )}
                {conv.followUpDate && (
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: conv.followUpOverdue ? '#ef4444' : '#94a3b8', marginBottom: 4 }}>
                    {conv.followUpOverdue ? '⚠ OVERDUE — ' : '📅 '}Follow up: {conv.followUpDate}
                  </div>
                )}
                {/* New fields display */}
                {(conv.howMet || conv.whereMet || conv.businessCard) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {conv.howMet && (
                      <span style={{ fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '2px 7px', borderRadius: 10 }}>
                        {HOW_MET_LABELS[conv.howMet]}
                      </span>
                    )}
                    {conv.whereMet && (
                      <span style={{ fontSize: 10, color: '#64748b', background: '#f0f2f5', border: '1px solid #e2e8f0', padding: '2px 7px', borderRadius: 10 }}>
                        📍 {conv.whereMet}
                      </span>
                    )}
                    {conv.businessCard && (
                      <span style={{ fontSize: 10, color: T, background: `${T}10`, border: `1px solid ${T}33`, padding: '2px 7px', borderRadius: 10 }}>
                        📇 Card received
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Conversations Tab ────────────────────────────────────────────────────────
function ConversationsTab() {
  const [typeFilter, setTypeFilter] = useState<'all' | ConvType>('all')

  const filters: { key: 'all' | ConvType; label: string }[] = [
    { key: 'all', label: 'All Types' },
    { key: 'call', label: '📞 Calls' },
    { key: 'text', label: '💬 Texts' },
    { key: 'email', label: '📧 Emails' },
    { key: 'meeting', label: '🤝 Meetings' },
    { key: 'in_person', label: '🤝 In Person' },
  ]

  const filtered = typeFilter === 'all' ? CONVERSATIONS : CONVERSATIONS.filter(c => c.type === typeFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: `1.5px solid ${typeFilter === f.key ? T : '#e2e8f0'}`,
              background: typeFilter === f.key ? `${T}15` : '#fff',
              color: typeFilter === f.key ? T : '#64748b',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(conv => (
          <div
            key={conv.id}
            style={{
              background: '#fff',
              borderRadius: 10,
              border: '1.5px solid #e8edf2',
              padding: '12px 16px',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              borderLeft: conv.followUpOverdue ? '4px solid #ef4444' : '4px solid transparent',
            }}
          >
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10, fontWeight: 700, color: '#94a3b8',
              minWidth: 38, paddingTop: 2, textAlign: 'center', lineHeight: 1.3,
            }}>
              {conv.date.split(' ')[0]}<br />
              <span style={{ fontSize: 9 }}>{conv.date.split(' ')[1]}</span>
            </div>
            <div style={{ fontSize: 18, paddingTop: 1, flexShrink: 0 }}>{TYPE_ICON[conv.type]}</div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, fontWeight: 700,
              color: conv.direction === 'inbound' ? T : A,
              paddingTop: 3, flexShrink: 0,
            }}>
              {conv.direction === 'inbound' ? '←' : '→'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: N }}>{conv.contactName}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{conv.company}</span>
                {conv.followUpOverdue && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                )}
              </div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4, marginBottom: 6 }}>
                {conv.summary}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {conv.nextAction && (
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    color: '#6366f1', background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)', borderRadius: 4, padding: '2px 7px',
                  }}>
                    → {truncate(conv.nextAction, 48)}
                  </span>
                )}
                {conv.followUpDate && (
                  <FollowUpChip
                    date={conv.followUpDate}
                    overdue={conv.followUpOverdue ?? false}
                    today={conv.followUpDate === 'Jun 8'}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Log Conversation Modal ───────────────────────────────────────────────────
function LogConvModal({ onClose, prefillContactId }: { onClose: () => void; prefillContactId?: string }) {
  const [recording, setRecording] = useState(false)
  const [convType, setConvType] = useState<ConvType>('in_person')
  const [howMet, setHowMet] = useState<HowMet | ''>('in_person')
  const [whereMet, setWhereMet] = useState('Toastmasters Monday June 8')
  const [businessCard, setBusinessCard] = useState(true)
  const [summary, setSummary] = useState(
    prefillContactId === '1'
      ? 'Met Sandra at Toastmasters Monday. Great conversation about scaling the DC Hub project. She mentioned interest in a larger master lease arrangement.'
      : ''
  )

  const contactName = prefillContactId
    ? CONTACTS.find(c => c.id === prefillContactId)?.name ?? 'Contact'
    : 'Kelly Marsh'
  const contactCompany = prefillContactId
    ? CONTACTS.find(c => c.id === prefillContactId)?.company ?? ''
    : 'Maxwell Floors'

  const showWhereMet = howMet === 'in_person' || howMet === 'event'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(11,37,64,0.55)', backdropFilter: 'blur(3px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(11,37,64,0.22)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px', borderBottom: '1px solid #e8edf2',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: N }}>💬 Log Conversation</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{contactName} · {contactCompany}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#f1f5f9', color: '#64748b', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
            }}
          >×</button>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Voice button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setRecording(!recording)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 20, border: 'none',
                background: recording ? '#fee2e2' : `${T}15`,
                color: recording ? '#ef4444' : T,
                fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                position: 'relative',
              }}
            >
              {recording && (
                <span style={{
                  position: 'absolute', inset: -2, borderRadius: 22,
                  border: '2px solid #ef4444', animation: 'pulse 1.2s ease-in-out infinite',
                  opacity: 0.6, pointerEvents: 'none',
                }} />
              )}
              🎤 {recording ? 'Recording...' : 'Record Voice Note'}
            </button>
            {recording && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#ef4444' }}>
                ● 0:12
              </span>
            )}
          </div>

          {/* Type + Direction */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>TYPE</label>
              <select
                value={convType}
                onChange={e => setConvType(e.target.value as ConvType)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: N, background: '#fff', fontFamily: 'inherit', outline: 'none' }}
              >
                <option value="call">📞 Call</option>
                <option value="text">💬 Text</option>
                <option value="email">📧 Email</option>
                <option value="meeting">🤝 Meeting</option>
                <option value="in_person">🤝 In Person</option>
                <option value="voicemail">📱 Voicemail</option>
                <option value="other">📝 Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>DIRECTION</label>
              <select style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: N, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
                <option value="outbound">→ Outbound</option>
                <option value="inbound">← Inbound</option>
              </select>
            </div>
          </div>

          {/* How you met */}
          <div style={{ display: 'grid', gridTemplateColumns: showWhereMet ? '1fr 1fr' : '1fr', gap: 12 }}>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>HOW YOU MET</label>
              <select
                value={howMet}
                onChange={e => setHowMet(e.target.value as HowMet | '')}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: N, background: '#fff', fontFamily: 'inherit', outline: 'none' }}
              >
                <option value="">— Select —</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="in_person">In Person</option>
                <option value="referral_intro">Referral Intro</option>
                <option value="event">Event</option>
                <option value="existing_relationship">Existing Relationship</option>
                <option value="inbound_inquiry">Inbound Inquiry</option>
              </select>
            </div>
            {showWhereMet && (
              <div>
                <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  WHERE / EVENT NAME
                </label>
                <input
                  type="text"
                  value={whereMet}
                  onChange={e => setWhereMet(e.target.value)}
                  placeholder={howMet === 'event' ? 'e.g. Vancouver Real Estate Mixer' : 'e.g. Tim Hortons on Main St'}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: N, background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>SUMMARY</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: '1.5px solid #e2e8f0', fontSize: 13, color: N,
                background: '#fff', fontFamily: 'inherit', resize: 'vertical',
                outline: 'none', lineHeight: 1.5, boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Business card checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="bcard-preview"
              checked={businessCard}
              onChange={e => setBusinessCard(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: T, cursor: 'pointer' }}
            />
            <label htmlFor="bcard-preview" style={{ fontSize: 13, color: N, cursor: 'pointer', fontWeight: businessCard ? 600 : 400 }}>
              📇 Business card received
            </label>
            {businessCard && (
              <span style={{ fontSize: 11, color: T, background: `${T}12`, border: `1px solid ${T}33`, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                ✓ logged
              </span>
            )}
          </div>

          {/* Next action */}
          <div>
            <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>NEXT ACTION</label>
            <input
              type="text"
              defaultValue="Send DC Hub master lease proposal"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: N, background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Follow-up + Contract */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>FOLLOW-UP DATE</label>
              <input
                type="date"
                defaultValue="2026-06-15"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: N, background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>CONTRACT</label>
              <select style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: N, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
                <option value="CF-2024-0089">CF-2024-0089</option>
                <option value="CF-2024-0012">CF-2024-0012</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: T, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CRMPreviewPage() {
  const [activeTab, setActiveTab] = useState<'contacts' | 'conversations'>('contacts')
  const [statusFilter, setStatusFilter] = useState<'all' | ContactStatus>('all')
  const [expandedId, setExpandedId] = useState<string | null>('1') // Sandra open by default
  const [showModal, setShowModal] = useState(true)
  const [showOverdue, setShowOverdue] = useState(false)
  const [logContactId, setLogContactId] = useState<string | undefined>(undefined)

  const filterButtons: { key: 'all' | ContactStatus; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: CONTACTS.length },
    { key: 'prospect', label: 'Prospect', count: CONTACTS.filter(c => c.status === 'prospect').length },
    { key: 'quoted',   label: 'Quoted',   count: CONTACTS.filter(c => c.status === 'quoted').length },
    { key: 'active',   label: 'Active',   count: CONTACTS.filter(c => c.status === 'active').length },
    { key: 'inactive', label: 'Inactive', count: CONTACTS.filter(c => c.status === 'inactive').length },
  ]

  const filteredContacts = statusFilter === 'all'
    ? CONTACTS
    : CONTACTS.filter(c => c.status === statusFilter)

  const displayedContacts = showOverdue
    ? filteredContacts.filter(c => c.followUpOverdue || c.followUpToday)
    : filteredContacts

  const overdueContacts = CONTACTS.filter(c => c.followUpOverdue)
  const overdueNames = overdueContacts.map(c => c.name.split(' ')[0]).join(', ')

  const handleLog = (contactId: string) => {
    setLogContactId(contactId)
    setShowModal(true)
  }

  const handleCardClick = (id: string) => {
    // clicking a card opens its detail panel; clicking again or on a different one switches
    setExpandedId(prev => prev === id ? null : id)
    setShowModal(false) // close modal if open
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.18); opacity: 0.9; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {/* ── Preview Banner ── */}
        <div style={{
          background: '#fef08a', color: '#713f12',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12, fontWeight: 700, textAlign: 'center',
          padding: '8px 16px', letterSpacing: '0.04em',
          borderBottom: '2px solid #fbbf24',
        }}>
          ⚡ PREVIEW MODE — No live data · All information is hardcoded mock data
        </div>

        {/* ── Page Header ── */}
        <div style={{ background: N, color: '#fff', padding: '20px 24px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>
                  🗒️ Contacts &amp; Conversations
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: "'IBM Plex Mono', monospace" }}>
                  CRM — Client Relationship Management
                </p>
              </div>
              <button
                onClick={() => { setLogContactId(undefined); setShowModal(true) }}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: T, color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit', marginBottom: 4,
                }}
              >
                + Log Conversation
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
              {(['contacts', 'conversations'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 22px', border: 'none', background: 'transparent',
                    color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontWeight: activeTab === tab ? 700 : 500,
                    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    borderBottom: activeTab === tab ? `3px solid ${T}` : '3px solid transparent',
                    transition: 'all 0.15s', textTransform: 'capitalize',
                  }}
                >
                  {tab === 'contacts' ? `👥 Contacts` : `💬 Conversations`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Follow-up Alert Banner ── */}
        <div
          onClick={() => setShowOverdue(!showOverdue)}
          style={{
            background: showOverdue ? '#fef3c7' : '#fff7ed',
            borderBottom: `1px solid ${A}44`,
            padding: '10px 24px', cursor: 'pointer', transition: 'background 0.15s',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#92400e' }}>
              {overdueContacts.length} follow-ups overdue
            </span>
            <span style={{ fontSize: 12, color: '#92400e', opacity: 0.8 }}>—</span>
            <span style={{ fontSize: 12, color: '#b45309' }}>{overdueNames}</span>
            <span style={{
              marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10, color: '#b45309', fontWeight: 600,
            }}>
              {showOverdue ? 'Show all →' : 'Filter overdue →'}
            </span>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 40px' }}>

          {activeTab === 'contacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Search + Filters */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="search"
                  placeholder="🔍  Search contacts..."
                  style={{
                    flex: '1 1 200px', padding: '9px 14px', borderRadius: 8,
                    border: '1.5px solid #e2e8f0', fontSize: 13, color: N,
                    background: '#fff', fontFamily: 'inherit', outline: 'none', minWidth: 180,
                  }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {filterButtons.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      style={{
                        padding: '6px 14px', borderRadius: 20,
                        border: `1.5px solid ${statusFilter === f.key ? (f.key === 'all' ? N : STATUS_META[f.key as ContactStatus]?.color ?? N) : '#e2e8f0'}`,
                        background: statusFilter === f.key
                          ? (f.key === 'all' ? `${N}12` : STATUS_META[f.key as ContactStatus]?.bg ?? `${N}12`)
                          : '#fff',
                        color: statusFilter === f.key
                          ? (f.key === 'all' ? N : STATUS_META[f.key as ContactStatus]?.color ?? N)
                          : '#64748b',
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {f.label} <span style={{ opacity: 0.7 }}>({f.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact grid + detail panel */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: expandedId ? 'minmax(0,1.1fr) minmax(0,420px)' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
                alignItems: 'start',
              }}>
                {/* Left: cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: expandedId ? '1fr 1fr' : 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: 14,
                  alignItems: 'start',
                }}>
                  {displayedContacts.map(contact => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      expanded={expandedId === contact.id}
                      onClick={() => handleCardClick(contact.id)}
                      onLog={handleLog}
                    />
                  ))}
                </div>

                {/* Right: detail panel */}
                {expandedId && (() => {
                  const c = CONTACTS.find(x => x.id === expandedId)
                  return c ? (
                    <ContactDetailPanel
                      contact={c}
                      onClose={() => setExpandedId(null)}
                      onLog={handleLog}
                    />
                  ) : null
                })()}
              </div>
            </div>
          )}

          {activeTab === 'conversations' && <ConversationsTab />}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <LogConvModal
          onClose={() => setShowModal(false)}
          prefillContactId={logContactId}
        />
      )}
    </>
  )
}
