'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import ClientLayout from '@/components/ClientLayout'

const WorksiteMap = dynamic(() => import('@/components/WorksiteMap'), { ssr: false })

export default function RequestPage() {
  const [step, setStep] = useState<'form' | 'submitted'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBenchmark, setShowBenchmark] = useState(false)
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
    work_site_address: '',
    work_site_lat: '',
    work_site_lng: '',
    current_housing_rate: '',
    current_housing_location: '',
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
          client_name: form.client_name,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          location: form.location,
          units: parseInt(form.units) || 1,
          start_date: form.start_date,
          end_date: form.end_date,
          notes: form.notes,
          work_site_address: form.work_site_address || null,
          work_site_lat: form.work_site_lat ? parseFloat(form.work_site_lat) : null,
          work_site_lng: form.work_site_lng ? parseFloat(form.work_site_lng) : null,
          current_housing_rate: form.current_housing_rate ? parseFloat(form.current_housing_rate) : null,
          current_housing_location: form.current_housing_location || null,
          price_per_unit: 0,
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

  const inputStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #D5D5D5',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#1A1A1A',
    fontSize: 14,
    fontFamily: "'Source Serif 4', serif",
    width: '100%',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: '0.12em',
    marginBottom: 6,
    display: 'block',
    fontFamily: 'sans-serif',
    textTransform: 'uppercase',
  }

  const cardStyle: React.CSSProperties = {
    background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: '28px',
  }

  const sectionLabel = (label: string) => (
    <div style={{
      fontFamily: "'League Spartan', sans-serif",
      fontWeight: 600,
      fontSize: 13,
      color: '#1B4353',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: 16,
    }}>{label}</div>
  )

  if (step === 'submitted') {
    return (
      <ClientLayout>
        <style>{`input::placeholder, textarea::placeholder { color: #aaa; }`}</style>
        <div style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#2D5A3D',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <span style={{ color: 'white', fontSize: 28 }}>✓</span>
          </div>
          <h2 style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 24, color: '#1A1A1A', marginBottom: 12 }}>
            Request Submitted
          </h2>
          <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 15, color: '#555', marginTop: 12, lineHeight: 1.8 }}>
            Thank you. Our team will review your request and respond within 24 hours.<br />
            Questions?{' '}
            <a href="mailto:austin@eliasrangestays.ca" style={{ color: '#1B4353' }}>
              austin@eliasrangestays.ca
            </a>
          </p>

          <div style={{ background: 'white', borderRadius: 12, padding: '24px 28px', marginTop: 32, textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 600, fontSize: 11, color: '#1B4353', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>What Happens Next</div>
            {[
              ['1', 'Our team reviews your request'],
              ['2', 'We prepare a custom housing quote'],
              ['3', 'You receive a quote link by email'],
              ['4', 'Approve and we prepare your agreement'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#1B4353',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: 'white',
                  flexShrink: 0,
                  fontFamily: "'League Spartan', sans-serif",
                  fontWeight: 600,
                }}>{n}</div>
                <div style={{ fontSize: 14, color: '#555', fontFamily: "'Source Serif 4', serif", paddingTop: 3 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <style>{`
        input::placeholder, textarea::placeholder { color: #aaa; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0); }
      `}</style>

      {/* Hero */}
      <div style={{ background: '#1B4353', borderRadius: '12px 12px 0 0', padding: '32px 40px' }}>
        <img src="/logo-v1.png" alt="Elias Range Stays" style={{ height: 52, marginBottom: 16 }} />
        <h1 style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 28, fontWeight: 700, color: 'white', margin: 0 }}>
          Request Workforce Housing
        </h1>
        <p style={{ fontFamily: "'Source Serif 4', serif", fontStyle: 'italic', fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
          Tell us about your team&apos;s needs — we&apos;ll respond within 24 hours.
        </p>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
          {[['34+', 'Units Managed'], ['6', 'Hospitals Served'], ['24hr', 'Quote Turnaround'], ['24/7', 'Support']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, color: '#A8D1E7', fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}>{n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', marginTop: 2, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div style={{ background: 'white', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '32px 40px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Company */}
          <div style={cardStyle}>
            {sectionLabel('Company Information')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input style={inputStyle} value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Green Infrastructure Partners Inc." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Contact Name *</label>
                  <input style={inputStyle} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="John Roxas" required />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="604-555-0100" type="tel" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="j.roxas@company.com" type="email" required />
              </div>
            </div>
          </div>

          {/* Work Site */}
          <div style={cardStyle}>
            {sectionLabel('Work Site Location')}
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 1.6, fontFamily: "'Source Serif 4', serif" }}>
              Where will your team be working? We use this to match you with housing close to your site.
            </div>
            <Suspense fallback={
              <div style={{ height: 260, background: '#F7F7F5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 12 }}>
                Loading map...
              </div>
            }>
              <WorksiteMap
                onLocationSelect={(address, lat, lng) => {
                  set('work_site_address', address)
                  set('work_site_lat', lat.toString())
                  set('work_site_lng', lng.toString())
                }}
                initialAddress={form.work_site_address}
              />
            </Suspense>
          </div>

          {/* Housing Details */}
          <div style={cardStyle}>
            {sectionLabel('Housing Details')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Preferred Area / Region *</label>
                <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Squamish, BC — near hospital" required />
              </div>
              <div>
                <label style={labelStyle}>Number of Units / Rooms Needed *</label>
                <input style={inputStyle} value={form.units} onChange={e => set('units', e.target.value)} type="number" min="1" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <input style={{ ...inputStyle, colorScheme: 'light' }} value={form.start_date} onChange={e => set('start_date', e.target.value)} type="date" required />
                </div>
                <div>
                  <label style={labelStyle}>End Date *</label>
                  <input style={{ ...inputStyle, colorScheme: 'light' }} value={form.end_date} onChange={e => set('end_date', e.target.value)} type="date" required />
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark (optional) */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showBenchmark ? 16 : 0 }}>
              <div>
                {sectionLabel('Current Housing Solution')}
                {!showBenchmark && (
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: -10, fontFamily: "'Source Serif 4', serif" }}>
                    Optional — help us show you the savings
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowBenchmark(b => !b)}
                style={{
                  background: showBenchmark ? '#EBF4F8' : '#F7F7F5',
                  border: `1px solid ${showBenchmark ? '#4F87A0' : '#D5D5D5'}`,
                  color: showBenchmark ? '#1B4353' : '#6B7280',
                  borderRadius: 6,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontFamily: 'sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                }}
              >
                {showBenchmark ? '− Hide' : '+ Add'}
              </button>
            </div>
            {showBenchmark && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, marginBottom: 4, fontFamily: "'Source Serif 4', serif" }}>
                  If you're currently using hotels or another housing provider, share what you're paying — we'll show you a side-by-side comparison on your quote.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Current Rate ($/Night Per Room)</label>
                    <input style={inputStyle} value={form.current_housing_rate} onChange={e => set('current_housing_rate', e.target.value)} placeholder="e.g. 195" type="number" />
                  </div>
                  <div>
                    <label style={labelStyle}>Current Provider / Location</label>
                    <input style={inputStyle} value={form.current_housing_location} onChange={e => set('current_housing_location', e.target.value)} placeholder="e.g. Hampton Inn, Burnaby" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={cardStyle}>
            {sectionLabel('Additional Notes')}
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Parking, accessibility needs, pet policy, move-in flexibility, anything else we should know..."
            />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#4F87A0' : '#1B4353',
              color: 'white',
              fontFamily: "'League Spartan', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '14px 32px',
              borderRadius: 8,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              height: 52,
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Submitting...' : 'Request a Quote →'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: -8, fontFamily: 'sans-serif' }}>
            By submitting you agree to be contacted by Elias Range Stays regarding your housing request.
          </div>
        </form>
      </div>
    </ClientLayout>
  )
}
