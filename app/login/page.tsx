'use client'

import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email above then click Forgot Password.')
      return
    }
    setResetLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://contractflow-omega.vercel.app/reset-password',
    })
    setResetLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message || 'Invalid email or password.')
        setLoading(false)
        return
      }

      if (!data.session) {
        setError('Login succeeded but no session was created. Please try again.')
        setLoading(false)
        return
      }

      await new Promise(r => setTimeout(r, 200))
      window.location.href = next
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B2540',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        input { outline: none; width: 100%; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        .login-inp {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          padding: 11px 14px;
          color: #ffffff;
          font-size: 13px;
          font-family: 'Segoe UI', system-ui, sans-serif;
          transition: border 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .login-inp:focus {
          border-color: #00BFA6;
          box-shadow: 0 0 0 3px rgba(0,191,166,0.15);
        }
        .login-lbl {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 7px;
          display: block;
        }
      `}</style>

      <div style={{
        width: 420,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>

        {/* Header with logo */}
        <div style={{
          background: '#ffffff',
          padding: '22px 36px 18px',
          textAlign: 'center',
          borderBottom: '3px solid #0B2540',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <img src="/logo.png" alt="Elias Range Stays" style={{ height: 56, width: 'auto' }} />
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.04em' }}>
            Healthy Living · Stronger Communities
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 36px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Contract<span style={{ color: '#00BFA6' }}>Flow</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em', marginTop: 4, textTransform: 'uppercase' }}>
              Team Access
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="login-lbl">Email</label>
              <input
                className="login-inp"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@eliasrangestays.ca"
              />
            </div>

            <div>
              <label className="login-lbl">Password</label>
              <input
                className="login-inp"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(231,76,60,0.12)',
                border: '1px solid rgba(231,76,60,0.4)',
                color: '#e74c3c',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#008f7a' : '#00BFA6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 20px',
                fontSize: 13,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                transition: 'background 0.18s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {resetSent ? (
              <div style={{ background: 'rgba(0,191,166,0.12)', border: '1px solid rgba(0,191,166,0.4)', color: '#00BFA6', borderRadius: 8, padding: '10px 14px', fontSize: 13, textAlign: 'center' }}>
                ✓ Reset link sent — check your email.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                disabled={resetLoading}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', textAlign: 'center', textDecoration: 'underline', fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '4px 0' }}
              >
                {resetLoading ? 'Sending...' : 'Forgot password?'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0B2540', minHeight: '100vh' }} />}>
      <LoginForm />
    </Suspense>
  )
}
