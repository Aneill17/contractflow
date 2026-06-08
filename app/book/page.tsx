'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const N = '#0B2540'
const T = '#00BFA6'
const A = '#F59E0B'

const HOW_HEARD_OPTIONS = [
  { value: 'Referral', label: 'Referral' },
  { value: 'Google', label: 'Google' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Word of Mouth', label: 'Word of Mouth' },
  { value: 'Other', label: 'Other' },
]

function BookingForm() {
  const searchParams = useSearchParams()
  const urlRef = searchParams.get('ref') || ''
  const urlType = searchParams.get('type') || ''

  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    housing_need: '',
    preferred_location: '',
    num_people: 1,
    preferred_call_time: '',
    how_heard: '',
    referral_code: urlRef,
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const showReferralCode = form.how_heard === 'Referral'

  const valid =
    form.name.trim() &&
    form.company.trim() &&
    form.email.trim() &&
    form.email.includes('@') &&
    form.how_heard

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          {/* Header */}
          <div style={{ background: N, borderRadius: '16px 16px 0 0', padding: '28px 32px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, Arial Black, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '0.06em', marginBottom: 6 }}>ELIAS RANGE STAYS</div>
            <div style={{ fontSize: 11, color: T, letterSpacing: '0.16em', fontWeight: 600 }}>Healthy Living · Stronger Communities</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '40px 36px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: 'Syne, Arial Black, sans-serif', fontWeight: 800, fontSize: 24, color: N, marginBottom: 10 }}>Request Received!</div>
            <div style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginBottom: 24 }}>
              We'll be in touch within 24 hours. Check your email for confirmation.
            </div>
            <div style={{ background: '#f0faf8', border: '1px solid rgba(0,191,166,0.2)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                A confirmation has been sent to <strong style={{ color: N }}>{form.email}</strong>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              Questions? Call Austin: <strong>(250) 719-8085</strong>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Nunito Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=Nunito+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        .bk-inp {
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
        .bk-inp:focus {
          border-color: ${T};
          box-shadow: 0 0 0 3px rgba(0,191,166,0.12);
          background: #fff;
        }
        .bk-lbl {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
          display: block;
          letter-spacing: 0.01em;
        }
        .bk-lbl .opt {
          font-weight: 400;
          color: #94a3b8;
          font-size: 11px;
          margin-left: 4px;
        }
        .bk-field { margin-bottom: 20px; }
        .bk-btn-primary {
          background: linear-gradient(135deg, ${N} 0%, #0d3567 100%);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px 32px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          font-family: 'Nunito Sans', system-ui, sans-serif;
          transition: all 0.18s;
          letter-spacing: 0.02em;
        }
        .bk-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(11,37,64,0.3);
        }
        .bk-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .bk-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        select.bk-inp { cursor: pointer; }
        textarea.bk-inp { resize: vertical; min-height: 90px; line-height: 1.6; }
        @media (max-width: 600px) { .bk-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      {/* NAV */}
      <nav style={{
        background: N,
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontFamily: 'Syne, Arial Black, sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>
            ELIAS RANGE STAYS
          </div>
          <div style={{ fontSize: 9, color: T, letterSpacing: '0.14em', fontWeight: 600 }}>
            Healthy Living · Stronger Communities
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <a href="https://eliasrangestays.ca" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600 }}>
          eliasrangestays.ca
        </a>
      </nav>

      {/* HERO */}
      <div style={{
        background: `linear-gradient(135deg, ${N} 0%, #0d3567 60%, #004d4d 100%)`,
        padding: '56px 24px 48px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,191,166,0.15)', borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: T, fontWeight: 700, letterSpacing: '0.1em' }}>WORKFORCE HOUSING SPECIALISTS</span>
          </div>
          <h1 style={{ fontFamily: 'Syne, Arial Black, sans-serif', fontWeight: 800, fontSize: 'clamp(28px,5vw,44px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 16px' }}>
            {urlType === 'quote' ? 'Request a Housing Quote' : 'Book a Discovery Call'}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
            Tell us what you need — we'll get back to you within 24 hours with a plan and pricing tailored to your project.
          </p>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            {['34+ Units Active', '6+ Hospital Regions', 'BC & Canada-Wide', 'Single Invoice'].map(badge => (
              <div key={badge} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: T }}>✓</span> {badge}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORM CARD */}
      <div style={{ maxWidth: 620, margin: '-1px auto 60px', padding: '0 16px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          padding: '40px 40px 36px',
          border: '1px solid #e2e8f0',
          borderTop: 'none',
        }}>
          <form onSubmit={submit}>

            {/* Section: About You */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                About You
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              <div className="bk-grid2">
                <div className="bk-field">
                  <label className="bk-lbl">Your Name <span style={{ color: '#ef4444', fontSize: 13 }}>*</span></label>
                  <input className="bk-inp" placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="bk-field">
                  <label className="bk-lbl">Company Name <span style={{ color: '#ef4444', fontSize: 13 }}>*</span></label>
                  <input className="bk-inp" placeholder="e.g. Northern Health Authority" value={form.company} onChange={e => set('company', e.target.value)} required />
                </div>
              </div>

              <div className="bk-grid2">
                <div className="bk-field">
                  <label className="bk-lbl">Email <span style={{ color: '#ef4444', fontSize: 13 }}>*</span></label>
                  <input className="bk-inp" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div className="bk-field">
                  <label className="bk-lbl">Phone <span className="opt">(optional)</span></label>
                  <input className="bk-inp" type="tel" placeholder="+1 (250) 000-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section: Your Housing Need */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                Your Housing Need
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              <div className="bk-field">
                <label className="bk-lbl">What do you need housing for?</label>
                <textarea
                  className="bk-inp"
                  placeholder="e.g. 8 nurses rotating through Kamloops Hospital, August through November. Need furnished suites near the hospital."
                  value={form.housing_need}
                  onChange={e => set('housing_need', e.target.value)}
                />
              </div>

              <div className="bk-grid2">
                <div className="bk-field">
                  <label className="bk-lbl">Preferred Location</label>
                  <input className="bk-inp" placeholder="e.g. Kamloops, BC" value={form.preferred_location} onChange={e => set('preferred_location', e.target.value)} />
                </div>
                <div className="bk-field">
                  <label className="bk-lbl">Number of People</label>
                  <input
                    className="bk-inp"
                    type="number"
                    min={1}
                    max={500}
                    placeholder="e.g. 12"
                    value={form.num_people}
                    onChange={e => set('num_people', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="bk-field">
                <label className="bk-lbl">Best time to call you back</label>
                <input className="bk-inp" placeholder="e.g. Tuesday afternoon, anytime this week, mornings preferred" value={form.preferred_call_time} onChange={e => set('preferred_call_time', e.target.value)} />
              </div>
            </div>

            {/* Section: How did you hear */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                One More Thing
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              <div className="bk-field">
                <label className="bk-lbl">How did you hear about us? <span style={{ color: '#ef4444', fontSize: 13 }}>*</span></label>
                <select className="bk-inp" value={form.how_heard} onChange={e => set('how_heard', e.target.value)} required>
                  <option value="">Select one...</option>
                  {HOW_HEARD_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Referral code — shown when Referral selected */}
              {showReferralCode && (
                <div className="bk-field" style={{
                  background: 'rgba(0,191,166,0.06)',
                  border: '1px solid rgba(0,191,166,0.2)',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}>
                  <label className="bk-lbl">Referral Code <span className="opt">(if you have one)</span></label>
                  <input
                    className="bk-inp"
                    placeholder="e.g. a1b2c3d4"
                    value={form.referral_code}
                    onChange={e => set('referral_code', e.target.value)}
                    style={{ background: '#fff' }}
                  />
                  {form.referral_code && (
                    <div style={{ fontSize: 11, color: T, marginTop: 6, fontWeight: 600 }}>
                      ✓ Referral code applied
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#ef4444' }}>
                {error}
              </div>
            )}

            <button className="bk-btn-primary" type="submit" disabled={!valid || submitting}>
              {submitting ? 'Sending your request...' : urlType === 'quote' ? '🏠 Request Housing Quote →' : '📞 Book a Discovery Call →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#94a3b8' }}>
              We typically respond within a few hours during business hours
            </div>
          </form>
        </div>

        {/* Footer trust row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 28, flexWrap: 'wrap' }}>
          {[
            { icon: '🔒', text: 'Your info stays private' },
            { icon: '⚡', text: 'Response within 24h' },
            { icon: '📞', text: '(250) 719-8085' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f0f4f8' }} />}>
      <BookingForm />
    </Suspense>
  )
}
