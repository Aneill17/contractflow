'use client'

import { useState } from 'react'

interface Props {
  onSave: (data: any) => Promise<void>
}

export default function NewContract({ onSave }: Props) {
  const [form, setForm] = useState({
    client_name: '', contact_name: '', contact_email: '',
    location: '', units: 1, price_per_unit: 2800,
    start_date: '', end_date: '', payment_due: '',
    payment_method: 'EFT', notes: '',
  })
  const [people, setPeople] = useState<string[]>([])
  const [newPerson, setNewPerson] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.client_name && form.contact_name && form.contact_email && form.location && form.start_date && form.end_date

  const save = async () => {
    setSaving(true)
    await onSave({ ...form, occupants: people })
    setSaving(false)
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: 860, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        .nc-card {
          background: #ffffff;
          border: 1px solid #e8ecf0;
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(11,37,64,0.05);
        }
        .nc-inp {
          background: #f8f9fb;
          border: 1px solid #e8ecf0;
          border-radius: 7px;
          padding: 9px 13px;
          color: #334155;
          font-size: 13px;
          font-family: 'Segoe UI', system-ui, sans-serif;
          outline: none;
          transition: border 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .nc-inp:focus {
          border-color: #00BFA6;
          box-shadow: 0 0 0 3px rgba(0,191,166,0.1);
          background: #ffffff;
        }
        textarea.nc-inp { resize: vertical; min-height: 80px; }
        .nc-lbl {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 6px;
          display: block;
        }
        .nc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .nc-section-title {
          font-size: 12px;
          font-weight: 700;
          color: #0B2540;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(0,191,166,0.2);
        }
        .nc-field { margin-bottom: 14px; }
        .nc-btn {
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 9px 18px;
          transition: all 0.18s;
        }
        .nc-btn-primary { background: #00BFA6; color: #ffffff; }
        .nc-btn-primary:hover { background: #00a892; transform: translateY(-1px); }
        .nc-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .nc-btn-outline { background: transparent; color: #00BFA6; border: 1.5px solid #00BFA6; }
        .nc-btn-outline:hover { background: rgba(0,191,166,0.08); }
        .nc-btn-sm { padding: 5px 13px; font-size: 11px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#0B2540', letterSpacing: '-0.02em' }}>New Contract</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Create a new housing request</div>
      </div>

      {/* Top two cards */}
      <div className="nc-grid2" style={{ marginBottom: 14 }}>
        <div className="nc-card" style={{ padding: 22 }}>
          <div className="nc-section-title">Client Info</div>
          {[['client_name','Company Name'],['contact_name','Contact Person'],['contact_email','Email Address']].map(([k,l]) => (
            <div key={k} className="nc-field">
              <label className="nc-lbl">{l}</label>
              <input className="nc-inp" type={k === 'contact_email' ? 'email' : 'text'} value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={l} />
            </div>
          ))}
        </div>
        <div className="nc-card" style={{ padding: 22 }}>
          <div className="nc-section-title">Booking Details</div>
          <div className="nc-field">
            <label className="nc-lbl">Location</label>
            <input className="nc-inp" value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Province — Property Name" />
          </div>
          <div className="nc-grid2">
            <div className="nc-field">
              <label className="nc-lbl">Start Date</label>
              <input className="nc-inp" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="nc-field">
              <label className="nc-lbl">End Date</label>
              <input className="nc-inp" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="nc-grid2">
            <div className="nc-field">
              <label className="nc-lbl">Units</label>
              <input className="nc-inp" type="number" min={1} value={form.units} onChange={e => set('units', parseInt(e.target.value) || 1)} />
            </div>
            <div className="nc-field">
              <label className="nc-lbl">Rate / Unit / Mo</label>
              <input className="nc-inp" type="number" value={form.price_per_unit} onChange={e => set('price_per_unit', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      </div>

      {/* Occupants */}
      <div className="nc-card" style={{ padding: 22, marginBottom: 14 }}>
        <div className="nc-section-title">Occupants</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {people.map((p, i) => (
            <div key={i} style={{
              background: 'rgba(0,191,166,0.08)',
              border: '1px solid rgba(0,191,166,0.3)',
              borderRadius: 20,
              padding: '4px 12px 4px 14px',
              fontSize: 12,
              color: '#0B2540',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {p}
              <button onClick={() => setPeople(ps => ps.filter((_,j) => j !== i))} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="nc-inp"
            placeholder="Occupant name..."
            value={newPerson}
            onChange={e => setNewPerson(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newPerson.trim()) { setPeople(p => [...p, newPerson.trim()]); setNewPerson('') } }}
            style={{ maxWidth: 280 }}
          />
          <button
            className="nc-btn nc-btn-outline nc-btn-sm"
            onClick={() => { if (newPerson.trim()) { setPeople(p => [...p, newPerson.trim()]); setNewPerson('') } }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Payment & Notes */}
      <div className="nc-card" style={{ padding: 22, marginBottom: 24 }}>
        <div className="nc-section-title">Payment & Notes</div>
        <div className="nc-grid2" style={{ marginBottom: 14 }}>
          <div className="nc-field">
            <label className="nc-lbl">Payment Due Date</label>
            <input className="nc-inp" type="date" value={form.payment_due} onChange={e => set('payment_due', e.target.value)} />
          </div>
          <div className="nc-field">
            <label className="nc-lbl">Payment Method</label>
            <select className="nc-inp" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option>EFT</option><option>Wire Transfer</option><option>Certified Cheque</option>
            </select>
          </div>
        </div>
        <div className="nc-field">
          <label className="nc-lbl">Special Notes</label>
          <textarea className="nc-inp" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Parking requirements, preferences..." />
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, alignItems: 'center' }}>
        {valid && (
          <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace' }}>
            Est. total: ${(form.units * form.price_per_unit * 3).toLocaleString()}
          </div>
        )}
        <button className="nc-btn nc-btn-primary" disabled={!valid || saving} onClick={save}>
          {saving ? 'Creating...' : 'Create Contract →'}
        </button>
      </div>
    </div>
  )
}
