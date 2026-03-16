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
    <div style={{ padding: '32px 36px', maxWidth: 800 }}>
      <style>{`
        .card { background: #13161D; border: 1px solid #ffffff0D; border-radius: 10px; }
        .btn { border: none; border-radius: 7px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.07em; padding: 10px 20px; transition: all 0.18s; }
        .btn-gold { background: #C9A84C; color: #0C0E14; font-weight: 500; }
        .btn-gold:hover { background: #DDB85C; }
        .btn-gold:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: #C9A84C; border: 1px solid #C9A84C44; }
        .btn-ghost:hover { background: #C9A84C11; }
        .btn-sm { padding: 6px 14px; font-size: 11px; }
        .inp { background: #0C0E14; border: 1px solid #ffffff15; border-radius: 7px; padding: 9px 13px; color: #DDD5C8; font-size: 13px; font-family: 'IBM Plex Mono', monospace; outline: none; transition: border 0.2s; width: 100%; }
        .inp:focus { border-color: #C9A84C55; }
        textarea.inp { resize: vertical; min-height: 72px; }
        .lbl { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #ffffff33; margin-bottom: 5px; display: block; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 13px; font-style: italic; color: #C9A84C88; margin-bottom: 16px; }
        .field { margin-bottom: 14px; }
      `}</style>

      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 4 }}>New Contract</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#ffffff33', marginBottom: 28 }}>Create a new housing request</div>

      <div className="grid2" style={{ marginBottom: 14 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="section-title">Client Info</div>
          {[['client_name','Company Name'],['contact_name','Contact Person'],['contact_email','Email Address']].map(([k,l]) => (
            <div key={k} className="field">
              <label className="lbl">{l}</label>
              <input className="inp" type={k === 'contact_email' ? 'email' : 'text'} value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={l} />
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="section-title">Booking Details</div>
          <div className="field">
            <label className="lbl">Location</label>
            <input className="inp" value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Province — Property Name" />
          </div>
          <div className="grid2">
            <div className="field">
              <label className="lbl">Start Date</label>
              <input className="inp" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl">End Date</label>
              <input className="inp" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label className="lbl">Units</label>
              <input className="inp" type="number" min={1} value={form.units} onChange={e => set('units', parseInt(e.target.value) || 1)} />
            </div>
            <div className="field">
              <label className="lbl">Rate / Unit / Mo</label>
              <input className="inp" type="number" value={form.price_per_unit} onChange={e => set('price_per_unit', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <div className="section-title">Occupants</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {people.map((p, i) => (
            <div key={i} style={{ background: '#C9A84C18', border: '1px solid #C9A84C33', borderRadius: 20, padding: '4px 12px 4px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {p}
              <button onClick={() => setPeople(ps => ps.filter((_,j) => j !== i))} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="inp" placeholder="Occupant name..." value={newPerson} onChange={e => setNewPerson(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newPerson.trim()) { setPeople(p => [...p, newPerson.trim()]); setNewPerson('') } }}
            style={{ maxWidth: 260 }} />
          <button className="btn btn-ghost btn-sm" onClick={() => { if (newPerson.trim()) { setPeople(p => [...p, newPerson.trim()]); setNewPerson('') } }}>+ Add</button>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <div className="section-title">Payment & Notes</div>
        <div className="grid2" style={{ marginBottom: 14 }}>
          <div className="field">
            <label className="lbl">Payment Due Date</label>
            <input className="inp" type="date" value={form.payment_due} onChange={e => set('payment_due', e.target.value)} />
          </div>
          <div className="field">
            <label className="lbl">Payment Method</label>
            <select className="inp" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option>EFT</option><option>Wire Transfer</option><option>Certified Cheque</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="lbl">Special Notes</label>
          <textarea className="inp" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Parking requirements, preferences..." />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
        {valid && (
          <div className="mono" style={{ fontSize: 11, color: '#ffffff33' }}>
            Est. total: ${(form.units * form.price_per_unit * 3).toLocaleString()}
          </div>
        )}
        <button className="btn btn-gold" disabled={!valid || saving} onClick={save}>
          {saving ? 'Creating...' : 'Create Contract →'}
        </button>
      </div>
    </div>
  )
}
