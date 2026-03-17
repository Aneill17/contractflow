'use client'

import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

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

      // Small delay to let the cookie settle before redirect
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
      background: '#0C0E14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <style>{`
        input { outline: none; width: 100%; }
        input::placeholder { color: #ffffff22; }
      `}</style>

      <div style={{
        width: 400,
        background: '#13161D',
        border: '1px solid #ffffff0D',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {/* ERS Brand Header */}
        <div style={{
          background: '#1B4353',
          padding: '24px 36px 20px',
          textAlign: 'center',
          borderBottom: '1px solid #ffffff0D',
        }}>
          <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Elias Range Stays
          </div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, letterSpacing: '0.02em' }}>
            Healthy Living, Stronger Communities
          </div>
        </div>

        {/* Form area */}
        <div style={{ padding: '32px 36px 40px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 22, fontWeight: 700, color: '#DDD5C8', letterSpacing: '-0.01em' }}>
            Contract<span style={{ color: '#C9A84C' }}>Flow</span>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#ffffff22', letterSpacing: '0.2em', marginTop: 4 }}>
            TEAM ACCESS
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: '#ffffff33', letterSpacing: '0.12em', marginBottom: 6 }}>EMAIL</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                background: '#0C0E14',
                border: '1px solid #ffffff12',
                borderRadius: 7,
                padding: '10px 14px',
                color: '#DDD5C8',
                fontSize: 13,
                fontFamily: 'IBM Plex Mono',
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 10, color: '#ffffff33', letterSpacing: '0.12em', marginBottom: 6 }}>PASSWORD</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                background: '#0C0E14',
                border: '1px solid #ffffff12',
                borderRadius: 7,
                padding: '10px 14px',
                color: '#DDD5C8',
                fontSize: 13,
                fontFamily: 'IBM Plex Mono',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#3a1a1a',
              border: '1px solid #e74c3c44',
              color: '#e74c3c',
              borderRadius: 7,
              padding: '10px 14px',
              fontSize: 12,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#8a7030' : '#C9A84C',
              color: '#0C0E14',
              border: 'none',
              borderRadius: 7,
              padding: '12px 20px',
              fontSize: 12,
              fontFamily: 'IBM Plex Mono',
              fontWeight: 500,
              letterSpacing: '0.08em',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              transition: 'background 0.18s',
            }}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0C0E14', minHeight: '100vh' }} />}>
      <LoginForm />
    </Suspense>
  )
}
