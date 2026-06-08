'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const N = '#0B2540'
const T = '#00BFA6'
const T2 = '#009793'
const A = '#F59E0B'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  contacted: { label: 'Contacted', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  converted: { label: 'Converted', color: '#00BFA6', bg: 'rgba(0,191,166,0.12)'  },
  dead:      { label: 'No Fit',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

interface Referral {
  id: string
  referee_name: string
  referee_email: string
  referee_company: string
  referee_need?: string
  status: string
  referral_code: string
  sent_at: string
}

interface SessionInfo {
  email: string
  company_name: string
}

export default function ClientReferralsPage() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    referee_name: '',
    referee_email: '',
    referee_company: '',
    referee_need: '',
    referring_name: '',
    personal_note: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([
      fetch('/api/client/me').then(r => r.ok ? r.json() : null),
      fetch('/api/client/referrals').then(r => r.ok ? r.json() : []),
    ]).then(([s, refs]) => {
      if (s) {
        setSession(s)
        setForm(f => ({ ...f, referring_name: s.company_name || '' }))
      }
      if (Array.isArray(refs)) setReferrals(refs)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const logout = async () => {
    await fetch('/api/client/auth/logout', { method: 'POST' })
    window.location.href = '/client/portal/login'
  }

  const valid = form.referee_name.trim() && form.referee_email.trim() && form.referee_company.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/client/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Something went wrong.')
        setSubmitting(false)
        return
      }
      setSuccess(true)
      setForm(f => ({ ...f, referee_name: '', referee_email: '', referee_company: '', referee_need: '', personal_note: '' }))
      // Reload referrals
      const r = await fetch('/api/client/referrals').then(r => r.ok ? r.json() : [])
      if (Array.isArray(r)) setReferrals(r)
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: N, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
          Loading...
        </div>
      </div>
    )
  }

  const companyName = session?.company_name || 'Your Company'

  const navLinks = [
    { href: '/client/portal', label: 'Overview' },
    { href: '/client/portal/contracts', label: 'Contracts' },
    { href: '/client/portal/referrals', label: 'Referrals' },
    { href: '/client/portal/team', label: 'Team' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Nunito Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=Nunito+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        .ref-inp {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 9px;
          padding: 11px 14px;
          font-size: 14px;
          width: 100%;
          outline: none;
          font-family: 'Nunito Sans', system-ui, sans-serif;
          color: #1a1a1a;
          transition: border 0.18s, box-shadow 0.18s;
        }
        .ref-inp:focus { border-color: ${T}; box-shadow: 0 0 0 3px rgba(0,191,166,0.12); background: #fff; }
        .ref-lbl { font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; display: block; }
        .ref-lbl .opt { font-weight: 400; color: #94a3b8; font-size: 11px; margin-left: 4px; }
        .ref-field { margin-bottom: 18px; }
        .ref-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        textarea.ref-inp { resize: vertical; min-height: 80px; line-height: 1.6; }
        .nav-link { padding: 7px 14px; border-radius: 8px; color: rgba(255,255,255,0.55); font-weight: 600; font-size: 13px; text-decoration: none; transition: all 0.15s; background: transparent; font-family: 'Nunito Sans', sans-serif; }
        .nav-link:hover { color: white; }
        .nav-link.active { color: ${T}; background: rgba(0,191,166,0.12); }
        @media (max-width: 600px) { .ref-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      {/* NAV */}
      <nav style={{
        background: N,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 4,
        position: 'sticky',
        top: 0,
        zIndex: 200,
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
      }}>
        <div style={{ marginRight: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '0.01em', lineHeight: 1 }}>ELIAS RANGE STAYS</div>
          <div style={{ fontSize: 9, color: T, letterSpacing: '0.12em', fontWeight: 600 }}>Healthy Living · Stronger Communities</div>
        </div>
        {navLinks.map(({ href, label }) => {
          const active = typeof window !== 'undefined' && window.location.pathname === href
          return (
            <Link key={href} href={href} className={`nav-link${active ? ' active' : ''}`}>{label}</Link>
          )
        })}
        <div style={{ flex: 1 }} />
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${T} 0%, #006b6b 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {initials(companyName)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{companyName}</div>
          </div>
        )}
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.45)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'Nunito Sans, sans-serif', fontWeight: 600 }}>
          Logout
        </button>
      </nav>

      {/* HERO BANNER */}
      <div style={{
        background: `linear-gradient(135deg, ${N} 0%, #0d3567 60%, #004d4d 100%)`,
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            Refer a Colleague
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Know someone who needs workforce housing? Send them a referral — we'll take it from there.
            <br />
            <span style={{ color: T, fontWeight: 600 }}>Help a colleague, support your industry.</span>
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* FORM CARD */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', padding: '32px 36px', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: N, marginBottom: 4 }}>Send a Referral</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Fill in their details and we'll reach out to them directly with a personal introduction.</div>

          {success && (
            <div style={{ background: 'rgba(0,191,166,0.08)', border: '1px solid rgba(0,191,166,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T2 }}>Referral sent!</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>We've reached out to them and they'll hear from us within 24 hours.</div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Referee info */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />About Them<div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              <div className="ref-grid2">
                <div className="ref-field">
                  <label className="ref-lbl">Their Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="ref-inp" placeholder="Full name" value={form.referee_name} onChange={e => set('referee_name', e.target.value)} required />
                </div>
                <div className="ref-field">
                  <label className="ref-lbl">Their Company <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="ref-inp" placeholder="Company name" value={form.referee_company} onChange={e => set('referee_company', e.target.value)} required />
                </div>
              </div>
              <div className="ref-field">
                <label className="ref-lbl">Their Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="ref-inp" type="email" placeholder="colleague@company.com" value={form.referee_email} onChange={e => set('referee_email', e.target.value)} required />
              </div>
              <div className="ref-field">
                <label className="ref-lbl">What do they need? <span className="opt">(optional — helps us personalize our outreach)</span></label>
                <textarea className="ref-inp" placeholder="e.g. 8 nurses in Kamloops through August, or crew housing for a construction project in Fort St. John" value={form.referee_need} onChange={e => set('referee_need', e.target.value)} />
              </div>
            </div>

            {/* From you */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />From You<div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              <div className="ref-field">
                <label className="ref-lbl">Your name (as it appears in the referral email)</label>
                <input className="ref-inp" placeholder="Your name or company name" value={form.referring_name} onChange={e => set('referring_name', e.target.value)} />
              </div>
              <div className="ref-field">
                <label className="ref-lbl">Personal note <span className="opt">(optional — added to the email we send them)</span></label>
                <textarea className="ref-inp" placeholder={`e.g. "Hey, I've been using ERS for my Fort McMurray crew — they've been great. Highly recommend giving them a call."`} value={form.personal_note} onChange={e => set('personal_note', e.target.value)} />
              </div>
            </div>

            <button
              type="submit"
              disabled={!valid || submitting}
              style={{
                background: valid && !submitting ? `linear-gradient(135deg, ${N} 0%, #0d3567 100%)` : '#e2e8f0',
                color: valid && !submitting ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: 10,
                padding: '13px 28px',
                fontSize: 14,
                fontWeight: 700,
                cursor: valid && !submitting ? 'pointer' : 'not-allowed',
                width: '100%',
                fontFamily: 'Nunito Sans, sans-serif',
                transition: 'all 0.18s',
                letterSpacing: '0.02em',
              }}
            >
              {submitting ? 'Sending referral...' : '🤝 Send Referral Email →'}
            </button>
          </form>
        </div>

        {/* REFERRALS SENT */}
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: N, marginBottom: 14 }}>
            Referrals You've Sent
          </div>

          {referrals.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: N, marginBottom: 6 }}>No referrals yet</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Send your first referral above — it only takes a minute.</div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Name', 'Company', 'Sent', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r, i) => {
                    const sm = STATUS_META[r.status] || STATUS_META.pending
                    return (
                      <tr key={r.id} style={{ borderBottom: i < referrals.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: N }}>{r.referee_name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{r.referee_email}</div>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 13, color: '#334155' }}>{r.referee_company}</td>
                        <td style={{ padding: '14px 18px', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                          {new Date(r.sent_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ background: sm.bg, color: sm.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 10px' }}>
                            {sm.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
