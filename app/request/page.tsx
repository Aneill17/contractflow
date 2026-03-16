'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'

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

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: '#ffffff44',
    letterSpacing: '0.12em',
    marginBottom: 6,
    display: 'block',
    fontFamily: 'IBM Plex Mono, monospace',
  }

  const cardStyle: React.CSSProperties = {
    background: '#13161D',
    border: '1px solid #ffffff0D',
    borderRadius: 10,
    padding: '20px 20px',
  }

  const sectionLabel = (label: string, color = '#C9A84C') => (
    <div style={{ fontSize: 11, color, letterSpacing: '0.1em', marginBottom: 16 }}>{label}</div>
  )

  if (step === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0E14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Playfair+Display:wght@400;600&display=swap');`}</style>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1B435322', border: '2px solid #4F87A0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: '#4F87A0' }}>✓</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#DDD5C8', marginBottom: 12 }}>
            Request Received
          </div>
          <div style={{ fontSize: 13, color: '#ffffff55', lineHeight: 1.8, marginBottom: 24 }}>
            Thank you. Our team will review your housing request and get back to you with a quote within{' '}
            <strong style={{ color: '#4F87A0' }}>24 hours</strong>.
          </div>
          <div style={{ background: '#13161D', borderRadius: 10, padding: '18px 20px', textAlign: 'left' }}>
            <div style={{ fontSize: 10, color: '#ffffff33', letterSpacing: '0.12em', marginBottom: 12 }}>WHAT HAPPENS NEXT</div>
            {[
              ['1', 'Our team reviews your request'],
              ['2', 'We prepare a custom housing quote'],
              ['3', 'You receive a quote link by email'],
              ['4', 'Approve and we prepare your agreement'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1B4353', border: '1px solid #4F87A066', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#4F87A0', flexShrink: 0 }}>{n}</div>
                <div style={{ fontSize: 12, color: '#ffffff66', paddingTop: 2 }}>{t}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, fontSize: 11, color: '#ffffff33' }}>
            Questions?{' '}
            <a href="mailto:austin@eliasrangestays.ca" style={{ color: '#4F87A0', textDecoration: 'none' }}>
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
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.3); }
      `}</style>

      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, color: '#4F87A0', letterSpacing: '0.2em', marginBottom: 8, textTransform: 'uppercase' }}>
            Elias Range Stays
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, color: '#DDD5C8', marginBottom: 10 }}>
            Request Workforce Housing
          </div>
          <div style={{ fontSize: 12, color: '#ffffff44', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
            Professional housing for healthcare & construction teams across BC. We'll have a custom quote back to you within 24 hours.
          </div>
          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            {[['34+', 'Units Managed'], ['6', 'Hospitals Served'], ['24hr', 'Quote Turnaround'], ['24/7', 'Support']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, color: '#4F87A0', fontFamily: 'Playfair Display, serif' }}>{n}</div>
                <div style={{ fontSize: 9, color: '#ffffff33', letterSpacing: '0.1em', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Company */}
          <div style={cardStyle}>
            {sectionLabel('COMPANY INFORMATION')}
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

          {/* Work Site */}
          <div style={cardStyle}>
            {sectionLabel('WORK SITE LOCATION', '#4F87A0')}
            <div style={{ fontSize: 11, color: '#ffffff33', marginBottom: 14, lineHeight: 1.6 }}>
              Where will your team be working? We use this to match you with housing close to your site.
            </div>
            <Suspense fallback={<div style={{ height: 260, background: '#0C0E14', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff33', fontSize: 11 }}>Loading map...</div>}>
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
            {sectionLabel('HOUSING DETAILS')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>PREFERRED AREA / REGION *</label>
                <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Squamish, BC — near hospital" required />
              </div>
              <div>
                <label style={labelStyle}>NUMBER OF UNITS / ROOMS NEEDED *</label>
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

          {/* Benchmark (optional) */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showBenchmark ? 16 : 0 }}>
              <div>
                {sectionLabel('CURRENT HOUSING SOLUTION', '#4CAF93')}
                {!showBenchmark && <div style={{ fontSize: 11, color: '#ffffff33', marginTop: -10 }}>Optional — help us show you the savings</div>}
              </div>
              <button
                type="button"
                onClick={() => setShowBenchmark(b => !b)}
                style={{ background: showBenchmark ? '#4CAF9322' : '#13161D', border: `1px solid ${showBenchmark ? '#4CAF9355' : '#ffffff15'}`, color: showBenchmark ? '#4CAF93' : '#ffffff55', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.08em' }}
              >
                {showBenchmark ? '− Hide' : '+ Add'}
              </button>
            </div>
            {showBenchmark && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 11, color: '#ffffff44', lineHeight: 1.7, marginBottom: 4 }}>
                  If you're currently using hotels or another housing provider, share what you're paying — we'll show you a side-by-side comparison on your quote.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>CURRENT RATE ($/NIGHT PER ROOM)</label>
                    <input style={inputStyle} value={form.current_housing_rate} onChange={e => set('current_housing_rate', e.target.value)} placeholder="e.g. 195" type="number" />
                  </div>
                  <div>
                    <label style={labelStyle}>CURRENT PROVIDER / LOCATION</label>
                    <input style={inputStyle} value={form.current_housing_location} onChange={e => set('current_housing_location', e.target.value)} placeholder="e.g. Hampton Inn, Burnaby" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={cardStyle}>
            {sectionLabel('ADDITIONAL NOTES')}
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Parking, accessibility needs, pet policy, move-in flexibility, anything else we should know..."
            />
          </div>

          {error && (
            <div style={{ background: '#3a1a1a', border: '1px solid #e74c3c44', color: '#e74c3c', borderRadius: 7, padding: '10px 14px', fontSize: 12 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? '#1a3a4a' : '#1B4353',
            color: loading ? '#4F87A055' : '#4F87A0',
            border: '1px solid #4F87A033',
            borderRadius: 8,
            padding: '15px 20px', fontSize: 12, fontFamily: 'IBM Plex Mono',
            fontWeight: 500, letterSpacing: '0.08em',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}>
            {loading ? 'SUBMITTING...' : '→ SUBMIT REQUEST — GET YOUR QUOTE WITHIN 24 HRS'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 10, color: '#ffffff1a', marginTop: -8 }}>
            By submitting you agree to be contacted by Elias Range Stays regarding your housing request.
          </div>
        </form>

        <div style={{ height: 60 }} />
      </div>
    </div>
  )
}
