'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/components/UserRoleContext'

interface Check {
  name: string
  status: 'checking' | 'ok' | 'warn' | 'fail'
  message: string
}

const CHECKS = [
  { key: 'supabase', name: 'Supabase DB' },
  { key: 'anthropic', name: 'Claude AI (Contract Generation)' },
  { key: 'docuseal', name: 'Docuseal (E-Signatures)' },
  { key: 'resend', name: 'Resend (Email)' },
  { key: 'auth', name: 'Auth / Session' },
]

export default function DiagnosticsPage() {
  const { role } = useRole()
  const [checks, setChecks] = useState<Record<string, Check>>(
    Object.fromEntries(CHECKS.map(c => [c.key, { name: c.name, status: 'checking', message: 'Checking...' }]))
  )

  const setCheck = (key: string, status: Check['status'], message: string) => {
    setChecks(prev => ({ ...prev, [key]: { name: CHECKS.find(c => c.key === key)!.name, status, message } }))
  }

  const runChecks = async () => {
    // Reset
    CHECKS.forEach(c => setCheck(c.key, 'checking', 'Checking...'))

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    // Auth check
    if (session?.user) {
      setCheck('auth', 'ok', `Signed in as ${session.user.email}`)
    } else {
      setCheck('auth', 'fail', 'No active session')
    }

    // Run all integration checks in parallel
    const res = await fetch('/api/diagnostics', { headers }).catch(() => null)
    if (!res || !res.ok) {
      CHECKS.filter(c => c.key !== 'auth').forEach(c =>
        setCheck(c.key, 'fail', 'Diagnostics API unreachable')
      )
      return
    }

    const data = await res.json()
    for (const [key, result] of Object.entries(data) as [string, { ok: boolean; message: string }][]) {
      setCheck(key, result.ok ? 'ok' : 'fail', result.message)
    }
  }

  useEffect(() => { runChecks() }, [])

  if (role && role !== 'owner') {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0E14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono', color: '#ffffff33', fontSize: 13 }}>
        Access restricted to owners.
      </div>
    )
  }

  const statusColor = (s: Check['status']) => ({ checking: '#ffffff33', ok: '#4CAF93', warn: '#C9A84C', fail: '#e74c3c' }[s])
  const statusIcon = (s: Check['status']) => ({ checking: '○', ok: '✓', warn: '⚠', fail: '✗' }[s])

  return (
    <div style={{ minHeight: '100vh', background: '#0C0E14', fontFamily: 'IBM Plex Mono', padding: '40px 36px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Playfair+Display:wght@400&display=swap');`}</style>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ color: '#ffffff33', fontSize: 11, textDecoration: 'none' }}>← Dashboard</a>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#DDD5C8', marginTop: 12 }}>System Diagnostics</div>
          <div style={{ fontSize: 11, color: '#ffffff33', marginTop: 4 }}>Integration health check — ContractFlow</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {CHECKS.map(({ key }) => {
            const check = checks[key]
            return (
              <div key={key} style={{ background: '#13161D', border: '1px solid #ffffff0D', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 16, color: statusColor(check.status), width: 20, textAlign: 'center', flexShrink: 0 }}>
                  {check.status === 'checking' ? (
                    <span style={{ animation: 'pulse 1s infinite', display: 'inline-block' }}>○</span>
                  ) : statusIcon(check.status)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#DDD5C8', fontWeight: 500 }}>{check.name}</div>
                  <div style={{ fontSize: 11, color: statusColor(check.status), marginTop: 3, opacity: 0.8 }}>{check.message}</div>
                </div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: statusColor(check.status), padding: '3px 8px', border: `1px solid ${statusColor(check.status)}44`, borderRadius: 20 }}>
                  {check.status}
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={runChecks}
          style={{ background: '#C9A84C', color: '#0C0E14', border: 'none', borderRadius: 7, padding: '10px 20px', fontSize: 11, fontFamily: 'IBM Plex Mono', fontWeight: 500, letterSpacing: '0.08em', cursor: 'pointer' }}
        >
          ↺ Re-run Checks
        </button>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
    </div>
  )
}
