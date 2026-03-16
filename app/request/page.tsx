'use client'

import { useState } from 'react'

export default function RequestPage() {
  const [step, setStep] = useState<'form' | 'submitted'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    client_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    location: '',
    units: '1',
    start_date: '',
    end_date: '',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          units: parseInt(form.units) || 1,
          price_per_unit: 0, // ERS will set this in the quote
          stage: 0,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Submission failed. Please try again.')
      }

      setStep('submitted')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: '#0C0E14',
    border: '1px solid #ffffff12',
    borderRadius: 7,
    padding: '10px 14px',
    color: '#DDD5C8',
    fontSize: 13,
    fontFamily: 'IBM Plex Mono, monospace',
    width: '100%',
    outline: 'none',
  }

  const labelStyle = {
    fontSize: 10,
    color: '#ffffff44',
    letterSpacing: '0.12em',
    marginBottom: 6,
    display: 'block',
    fontFamily: 'IBM Plex Mono, monospace',
  }

  if (step === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0E14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Playfair+Display:wght@400;600&display=swap');`}</style>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#DDD5C8', marginBottom: 12 }}>
            Request Received
          </div>
          <div style={{ fontSize: 13, color: '#ffffff55', lineHeight: 1.7 }}>
            Thank you. Our team will review your housing request and get back to you with a quote within <strong style={{ color: '#C9A84C' }}>24 hours</strong>.
          </div>
          <div style={{ marginTop: 24, fontSize: 11, color: '#ffffff33' }}>
            Questions? Contact us at{' '}
            <a href="mailto:austin@eliasrangestays.ca" style={{ color: '#C9A84C', textDecoration: 'none' }}>
              austin@eliasrangestays.ca
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0C0E14', padding: '48px 24px', fontFamily: 'IBM Plex Mono' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Playfair+Display:wght@400;600&display=swap');
        input::placeholder, textarea::placeholder { color: #ffffff22; }
      `}</style>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#DDD5C8' }}>
            Contract<span style={{ color: '#C9A84C' }}>Flow</span>
          </div>
          <div style={{ fontSize: 9, color: '#ffffff22', letterSpacing: '0.2em', marginTop: 4 }}>ELIAS RANGE STAYS</div>
          <div style={{ marginTop: 24, fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#DDD5C8' }}>
            Request Workforce Housing
          </div>
          <div style={{ fontSize: 12, color: '#ffffff44', marginTop: 8, lineHeight: 1.6 }}>
            Tell us about your housing needs. We'll have a quote back to you within 24 hours.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Company */}
          <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '20px 20px' }}>
            <div style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.1em', marginBottom: 16 }}>COMPANY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>COMPANY NAME *</label>
                <input style={inputStyle} value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Green Infrastructure Partners Inc." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>CONTACT NAME *</label>
                  <input style={inputStyle} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="John Roxas" required />
                </div>
                <div>
                  <label style={labelStyle}>PHONE</label>
                  <input style={inputStyle} value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="604-555-0100" type="tel" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>EMAIL *</label>
                <input style={inputStyle} value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="j.roxas@company.com" type="email" required />
              </div>
            </div>
          </div>

          {/* Housing */}
          <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '20px 20px' }}>
            <div style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.1em', marginBottom: 16 }}>HOUSING DETAILS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>LOCATION / AREA *</label>
                <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Burnaby, BC — near Metrotown" required />
              </div>
              <div>
                <label style={labelStyle}>NUMBER OF UNITS *</label>
                <input style={inputStyle} value={form.units} onChange={e => set('units', e.target.value)} type="number" min="1" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>START DATE *</label>
                  <input style={inputStyle} value={form.start_date} onChange={e => set('start_date', e.target.value)} type="date" required />
                </div>
                <div>
                  <label style={labelStyle}>END DATE *</label>
                  <input style={inputStyle} value={form.end_date} onChange={e => set('end_date', e.target.value)} type="date" required />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '20px 20px' }}>
            <div style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.1em', marginBottom: 16 }}>ADDITIONAL NOTES</div>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Parking requirements, accessibility needs, preferred floor, anything else we should know..."
            />
          </div>

          {error && (
            <div style={{ background: '#3a1a1a', border: '1px solid #e74c3c44', color: '#e74c3c', borderRadius: 7, padding: '10px 14px', fontSize: 12 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? '#8a7030' : '#C9A84C',
            color: '#0C0E14', border: 'none', borderRadius: 7,
            padding: '14px 20px', fontSize: 12, fontFamily: 'IBM Plex Mono',
            fontWeight: 500, letterSpacing: '0.08em',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST — GET QUOTE WITHIN 24HRS'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 10, color: '#ffffff22', marginTop: -8 }}>
            By submitting you agree to be contacted by Elias Range Stays regarding your housing request.
          </div>
        </form>
      </div>
    </div>
  )
}
