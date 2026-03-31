'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ClientRegisterPage() {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { name: form.contact_name },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Registration failed — no user returned.')

      const userId = authData.user.id

      // 2. Create user_profiles row with role='client'
      const { error: profileError } = await supabase.from('user_profiles').insert([{
        id: userId,
        name: form.contact_name,
        role: 'staff', // internal role
        role_type: 'client', // client portal flag
      }])
      // Ignore duplicate errors (profile may already exist)
      if (profileError && !profileError.message.includes('duplicate')) {
        console.warn('Profile insert:', profileError.message)
      }

      // 3. Create client_accounts row
      const { error: accountError } = await supabase.from('client_accounts').insert([{
        user_id: userId,
        company_name: form.company_name,
        contact_name: form.contact_name,
        contact_email: form.email,
      }])
      if (accountError) {
        console.warn('Client account insert:', accountError.message)
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Registration failed.')
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

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B2540', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '40px 36px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <div style={{ color: '#00BFA6', fontFamily: 'IBM Plex Mono', fontSize: 14, marginBottom: 8 }}>Account Created!</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 24 }}>
            Check your email to confirm your account, then log in to access your client dashboard.
          </div>
          <Link href="/client/login" style={{ color: '#00BFA6', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
            → Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B2540', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '40px 36px', maxWidth: 420, width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00BFA6', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
            Elias Range Stays
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em' }}>
            Client Portal
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Create your account</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Company Name</div>
              <input style={inp} required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Your company or organization" />
            </div>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Contact Name</div>
              <input style={inp} required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Your full name" />
            </div>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Email</div>
              <input style={inp} type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" />
            </div>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Password</div>
              <input style={inp} type="password" required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" />
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
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          Already have an account?{' '}
          <Link href="/client/login" style={{ color: '#00BFA6' }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
