'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => { window.location.href = '/login' }, 2500)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B2540', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`input { outline: none; width: 100%; } .inp { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; padding: 11px 14px; color: #fff; font-size: 13px; width: 100%; } .inp:focus { border-color: #00BFA6; box-shadow: 0 0 0 3px rgba(0,191,166,0.15); } .lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 7px; display: block; }`}</style>
      <div style={{ width: 420, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: '#fff', padding: '22px 36px 18px', textAlign: 'center', borderBottom: '3px solid #0B2540' }}>
          <img src="/logo.png" alt="Elias Range Stays" style={{ height: 56, width: 'auto' }} />
        </div>
        <div style={{ padding: '32px 36px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Set New Password</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Contract<span style={{ color: '#00BFA6' }}>Flow</span></div>
          </div>
          {done ? (
            <div style={{ background: 'rgba(0,191,166,0.12)', border: '1px solid rgba(0,191,166,0.4)', color: '#00BFA6', borderRadius: 8, padding: '14px', fontSize: 14, textAlign: 'center' }}>
              ✓ Password updated — redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="lbl">New Password</label>
                <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="New password" />
              </div>
              <div>
                <label className="lbl">Confirm Password</label>
                <input className="inp" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Confirm password" />
              </div>
              {error && <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.4)', color: '#e74c3c', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ background: loading ? '#008f7a' : '#00BFA6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
