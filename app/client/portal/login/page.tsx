'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: 'Invalid login link.',
  invalid_token: 'This login link is invalid.',
  token_used: 'This login link has already been used. Request a new one.',
  token_expired: 'This login link has expired. Request a new one.',
  user_not_found: 'No account found for this email.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const errorKey = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(errorKey ? (ERROR_MESSAGES[errorKey] || 'Something went wrong.') : '')

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: '13px 16px',
    color: '#fff',
    fontSize: 15,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/client/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong.')
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError('Network error — please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 16,
      padding: '44px 40px',
      maxWidth: 420,
      width: '100%',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: 'rgba(0,191,166,0.15)',
          border: '1px solid rgba(0,191,166,0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          fontSize: 22,
        }}>🏠</div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#00BFA6', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          Elias Range Stays
        </div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 24, letterSpacing: '-0.01em', marginBottom: 6 }}>
          Client Portal
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.5 }}>
          Enter your email to receive a secure login link
        </div>
      </div>

      {sent ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'rgba(0,191,166,0.12)',
            border: '1px solid rgba(0,191,166,0.3)',
            borderRadius: 12,
            padding: '24px 20px',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📧</div>
            <div style={{ color: '#00BFA6', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Check your email</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>
              We&apos;ve sent a login link to <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{email}</strong>.
              The link expires in 1 hour.
            </div>
          </div>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.4)',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.05em',
            }}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Email Address
            </div>
            <input
              style={inp}
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16,
              padding: '11px 14px',
              background: 'rgba(226,88,88,0.15)',
              border: '1px solid rgba(226,88,88,0.25)',
              borderRadius: 8,
              color: '#e25858',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(0,191,166,0.6)' : '#00BFA6',
              border: 'none',
              color: '#fff',
              padding: '14px',
              borderRadius: 10,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'Sending…' : 'Send Login Link →'}
          </button>
        </form>
      )}

      <div style={{
        marginTop: 28,
        paddingTop: 20,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 11,
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center',
      }}>
        Passwordless login — no password required
      </div>
    </div>
  )
}

export default function ClientPortalLoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B2540',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: '20px',
    }}>
      <Suspense fallback={
        <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>Loading…</div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
