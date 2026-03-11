'use client'

import { useState } from 'react'

const LOCATIONS = [
  'Whistler, BC — Alpine Lodges',
  'Fort McMurray, AB — Riverside Suites',
  'Calgary, AB — Beltline Residences',
  'Edmonton, AB — Downtown Suites',
  'Vancouver, BC — East Side Units',
  'Other — Please specify in notes',
]

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refNumber, setRefNumber] = useState('')
  const [form, setForm] = useState({
    client_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    location: '',
    units: 1,
    start_date: '',
    end_date: '',
    payment_method: 'EFT',
    notes: '',
  })
  const [people, setPeople] = useState<string[]>([''])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const updatePerson = (i: number, val: string) => {
    setPeople(ps => ps.map((p, idx) => idx === i ? val : p))
  }

  const addPerson = () => setPeople(ps => [...ps, ''])
  const removePerson = (i: number) => setPeople(ps => ps.filter((_, idx) => idx !== i))

  const step1Valid = form.client_name && form.contact_name && form.contact_email
  const step2Valid = form.location && form.start_date && form.end_date && form.units > 0
  const step3Valid = people.filter(p => p.trim()).length > 0

  const submit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          occupants: people.filter(p => p.trim()),
        }),
      })
      const data = await res.json()
      if (data.reference) {
        setRefNumber(data.reference)
        setSubmitted(true)
      }
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>🏠</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#1a1a1a', marginBottom: 8 }}>Request Received</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#C9A84C', marginBottom: 20, letterSpacing: '0.1em' }}>{refNumber}</div>
            <div style={{ fontSize: 14, color: '#777', lineHeight: 1.8, marginBottom: 28 }}>
              Thank you, {form.contact_name.split(' ')[0]}. We've received your housing request and will have a formal quote to you within 24 hours at <strong>{form.contact_email}</strong>.
            </div>
            <div style={{ background: '#f9f7f4', borderRadius: 10, padding: '20px 24px', textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Summary</div>
              {[
                ['Company', form.client_name],
                ['Location', form.location],
                ['Units', `${form.units} unit${form.units > 1 ? 's' : ''}`],
                ['Check-in', form.start_date],
                ['Check-out', form.end_date],
                ['Occupants', people.filter(p => p.trim()).join(', ')],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f0ebe4', fontSize: 13 }}>
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</span>
                  <span style={{ color: '#1a1a1a', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#bbb' }}>
              Keep this reference number: <strong style={{ color: '#C9A84C' }}>{refNumber}</strong>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EF', padding: '32px 16px', fontFamily: 'Georgia, serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        .bk-card { background: white; border-radius: 14px; box-shadow: 0 2px 32px rgba(0,0,0,0.07); padding: 36px; margin-bottom: 16px; }
        .bk-inp { background: #f9f7f4; border: 1px solid #e0d9d0; border-radius: 8px; padding: 11px 14px; font-size: 14px; width: 100%; outline: none; font-family: Georgia, serif; color: #1a1a1a; transition: border 0.2s; }
        .bk-inp:focus { border-color: #C9A84C; background: white; }
        .bk-lbl { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #999; margin-bottom: 6px; display: block; }
        .bk-field { margin-bottom: 18px; }
        .bk-btn { border: none; border-radius: 9px; padding: 13px 28px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.07em; transition: all 0.18s; }
        .bk-btn-gold { background: #C9A84C; color: white; font-weight: 500; }
        .bk-btn-gold:hover { background: #B8973B; transform: translateY(-1px); box-shadow: 0 4px 20px #C9A84C33; }
        .bk-btn-gold:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
        .bk-btn-ghost { background: transparent; border: 1px solid #e0d9d0; color: #999; }
        .bk-btn-ghost:hover { border-color: #C9A84C; color: #C9A84C; }
        .bk-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500; transition: all 0.2s; }
        .person-row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
        select.bk-inp { cursor: pointer; }
        textarea.bk-inp { resize: vertical; min-height: 80px; }
        @media (max-width: 600px) { .bk-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: '#1a1a1a', marginBottom: 6 }}>
            Book Workforce Housing
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#999' }}>
            Complete the form below and we'll have a quote to you within 24 hours
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, gap: 0 }}>
          {[['1', 'Your Info'], ['2', 'Housing Needs'], ['3', 'Occupants']].map(([num, label], i) => (
            <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div className="step-dot" style={{
                  background: step > parseInt(num) ? '#4CAF93' : step === parseInt(num) ? '#C9A84C' : '#f0ebe4',
                  color: step >= parseInt(num) ? 'white' : '#bbb',
                }}>
                  {step > parseInt(num) ? '✓' : num}
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: step === parseInt(num) ? '#C9A84C' : '#bbb', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{label}</div>
              </div>
              {i < 2 && <div style={{ width: 60, height: 1, background: step > i + 1 ? '#4CAF9355' : '#e0d9d0', margin: '0 8px', marginBottom: 20 }} />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Company Info */}
        {step === 1 && (
          <div className="bk-card">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 4 }}>Company Information</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#bbb', marginBottom: 24 }}>Tell us about your company and who we'll be in touch with</div>

            <div className="bk-field">
              <label className="bk-lbl">Company Name *</label>
              <input className="bk-inp" placeholder="e.g. Apex Drilling Ltd." value={form.client_name} onChange={e => set('client_name', e.target.value)} />
            </div>
            <div className="bk-grid2">
              <div className="bk-field">
                <label className="bk-lbl">Contact Name *</label>
                <input className="bk-inp" placeholder="Full name" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
              </div>
              <div className="bk-field">
                <label className="bk-lbl">Phone Number</label>
                <input className="bk-inp" placeholder="+1 (000) 000-0000" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
              </div>
            </div>
            <div className="bk-field">
              <label className="bk-lbl">Email Address *</label>
              <input className="bk-inp" type="email" placeholder="you@company.com" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#bbb', marginTop: 5 }}>Your quote and updates will be sent here</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="bk-btn bk-btn-gold" disabled={!step1Valid} onClick={() => setStep(2)}>Next: Housing Needs →</button>
            </div>
          </div>
        )}

        {/* STEP 2 — Housing Details */}
        {step === 2 && (
          <div className="bk-card">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 4 }}>Housing Requirements</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#bbb', marginBottom: 24 }}>Tell us what you need and when</div>

            <div className="bk-field">
              <label className="bk-lbl">Preferred Location *</label>
              <select className="bk-inp" value={form.location} onChange={e => set('location', e.target.value)}>
                <option value="">Select a location...</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="bk-field">
              <label className="bk-lbl">Number of Units Required *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => set('units', Math.max(1, form.units - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e0d9d0', background: 'white', fontSize: 18, cursor: 'pointer', color: '#666' }}>−</button>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 24, color: '#C9A84C', minWidth: 40, textAlign: 'center' }}>{form.units}</span>
                <button onClick={() => set('units', form.units + 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e0d9d0', background: 'white', fontSize: 18, cursor: 'pointer', color: '#666' }}>+</button>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#bbb' }}>unit{form.units > 1 ? 's' : ''} required</span>
              </div>
            </div>

            <div className="bk-grid2">
              <div className="bk-field">
                <label className="bk-lbl">Move-in Date *</label>
                <input className="bk-inp" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
              </div>
              <div className="bk-field">
                <label className="bk-lbl">Move-out Date *</label>
                <input className="bk-inp" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
              </div>
            </div>

            <div className="bk-field">
              <label className="bk-lbl">Preferred Payment Method</label>
              <select className="bk-inp" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                <option value="EFT">EFT / Bank Transfer</option>
                <option value="Wire Transfer">Wire Transfer</option>
                <option value="Certified Cheque">Certified Cheque</option>
              </select>
            </div>

            <div className="bk-field">
              <label className="bk-lbl">Special Requirements or Notes</label>
              <textarea className="bk-inp" placeholder="Parking needs, accessibility requirements, unit preferences..." value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <button className="bk-btn bk-btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="bk-btn bk-btn-gold" disabled={!step2Valid} onClick={() => setStep(3)}>Next: Occupants →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Occupants */}
        {step === 3 && (
          <div className="bk-card">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 4 }}>Occupant Details</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#bbb', marginBottom: 24 }}>List the names of all workers who will be staying</div>

            {people.map((p, i) => (
              <div key={i} className="person-row">
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#C9A84C', minWidth: 20 }}>{i + 1}.</div>
                <input className="bk-inp" placeholder={`Occupant ${i + 1} full name`} value={p} onChange={e => updatePerson(i, e.target.value)} style={{ flex: 1 }} />
                {people.length > 1 && (
                  <button onClick={() => removePerson(i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
                )}
              </div>
            ))}

            <button onClick={addPerson} style={{ background: 'none', border: '1px dashed #C9A84C66', borderRadius: 8, padding: '9px 18px', color: '#C9A84C', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, marginTop: 4, width: '100%' }}>
              + Add Another Occupant
            </button>

            <div style={{ background: '#f9f7f4', borderRadius: 10, padding: '16px 18px', marginTop: 20 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Request Summary</div>
              {[
                ['Company', form.client_name],
                ['Contact', `${form.contact_name} · ${form.contact_email}`],
                ['Location', form.location],
                ['Units', `${form.units} unit${form.units > 1 ? 's' : ''}`],
                ['Dates', `${form.start_date} → ${form.end_date}`],
                ['Occupants', `${people.filter(p => p.trim()).length} listed`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ece7df', fontSize: 13 }}>
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#bbb' }}>{l}</span>
                  <span style={{ color: '#1a1a1a' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button className="bk-btn bk-btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button className="bk-btn bk-btn-gold" disabled={!step3Valid || saving} onClick={submit}>
                {saving ? 'Submitting...' : 'Submit Housing Request →'}
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#ccc', marginTop: 16 }}>
          Your information is secure and will only be used to process your housing request.
        </div>
      </div>
    </div>
  )
}
