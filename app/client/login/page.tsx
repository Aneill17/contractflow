'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ClientLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (!data.session) throw new Error('Login failed — no session.')

      // Check if client portal user
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role_type')
        .eq('id', data.user.id)
        .single()

      await new Promise(r => setTimeout(r, 200))
      window.location.href = '/client/dashboard'
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: '11px 14px',
    color: '#fff',
    fontSize: 14,
    fontFamily: 'IBM Plex Mono',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B2540', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '40px 36px', maxWidth: 400, width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00BFA6', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
            Elias Range Stays
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em' }}>
            Client Portal
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Sign in to your account</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Email</div>
              <input style={inp} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
            </div>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Password</div>
              <input style={inp} type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(226,88,88,0.15)', borderRadius: 7, color: '#e25858', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 20,
              width: '100%',
              background: '#00BFA6',
              border: 'none',
              color: '#fff',
              padding: '13px',
              borderRadius: 8,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/client/register" style={{ color: '#00BFA6' }}>Register</Link>
        </div>
      </div>
    </div>
  )
}
