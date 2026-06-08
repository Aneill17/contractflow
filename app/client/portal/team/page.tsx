'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const N = '#0B2540', T = '#00BFA6'

interface TeamMember {
  id: string
  email: string
  role: 'admin' | 'member'
  invited_by?: string
  created_at: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [myEmail, setMyEmail] = useState('')
  const [myRole, setMyRole] = useState<'admin' | 'member'>('member')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [removeLoading, setRemoveLoading] = useState('')

  const loadTeam = async () => {
    const res = await fetch('/api/client/team')
    if (res.status === 401) { window.location.href = '/client/portal/login'; return }
    if (res.ok) setMembers(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    loadTeam()
    fetch('/api/client/me')
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s) { setMyEmail(s.email); setMyRole(s.role) } })
  }, [])

  const logout = async () => {
    await fetch('/api/client/auth/logout', { method: 'POST' })
    window.location.href = '/client/portal/login'
  }

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    setInviteError('')
    setInviteSuccess('')

    const res = await fetch('/api/client/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    })

    const data = await res.json()
    if (res.ok) {
      setInviteSuccess(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      loadTeam()
    } else {
      setInviteError(data.error || 'Failed to invite member')
    }
    setInviteLoading(false)
  }

  const removeMember = async (email: string) => {
    if (!confirm(`Remove ${email} from your team?`)) return
    setRemoveLoading(email)
    const res = await fetch(`/api/client/team?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
    if (res.ok) loadTeam()
    else { const d = await res.json(); alert(d.error || 'Failed') }
    setRemoveLoading('')
  }

  const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: N, height: 56, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 4, position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginRight: 20 }}>ERS · Client Portal</div>
        {[{ href: '/client/portal', label: 'Overview' }, { href: '/client/portal/contracts', label: 'Contracts' }, { href: '/client/portal/team', label: 'Team' }].map(({ href, label }) => (
          <Link key={href} href={href} style={{ padding: '6px 14px', borderRadius: 7, color: href === '/client/portal/team' ? T : 'rgba(255,255,255,0.55)', fontWeight: href === '/client/portal/team' ? 600 : 400, fontSize: 13, textDecoration: 'none' }}>{label}</Link>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>Logout</button>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 28px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>PORTAL ACCESS</div>
          <div style={{ fontWeight: 700, fontSize: 26, color: N }}>Team</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Manage who has access to your client portal
          </div>
        </div>

        {/* Invite form — admin only */}
        {myRole === 'admin' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', padding: '24px', marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: N, marginBottom: 16 }}>Invite Member</div>
            <form onSubmit={sendInvite} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                style={{
                  flex: 1,
                  minWidth: 240,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}
              />
              <button
                type="submit"
                disabled={inviteLoading}
                style={{
                  background: T,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 8,
                  cursor: inviteLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  opacity: inviteLoading ? 0.7 : 1,
                }}
              >
                {inviteLoading ? 'Sending…' : 'Send Invite →'}
              </button>
            </form>
            {inviteSuccess && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: 7, color: '#22c55e', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
                ✓ {inviteSuccess}
              </div>
            )}
            {inviteError && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 7, color: '#ef4444', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
                {inviteError}
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: N }}>
              {loading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
            </div>
          </div>

          {members.map((m, i) => (
            <div key={m.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: i < members.length - 1 ? '1px solid #f1f5f9' : 'none',
              gap: 12,
            }}>
              {/* Avatar */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: m.role === 'admin' ? 'rgba(0,191,166,0.15)' : 'rgba(11,37,64,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: m.role === 'admin' ? T : N,
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}>
                {m.email.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: N, fontWeight: 500 }}>
                  {m.email}
                  {m.email.toLowerCase() === myEmail.toLowerCase() && (
                    <span style={{ marginLeft: 8, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8' }}>(you)</span>
                  )}
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Joined {fmt(m.created_at)}
                  {m.invited_by && ` · Invited by ${m.invited_by}`}
                </div>
              </div>

              {/* Role badge */}
              <span style={{
                padding: '3px 10px',
                borderRadius: 10,
                background: m.role === 'admin' ? 'rgba(0,191,166,0.1)' : 'rgba(148,163,184,0.1)',
                color: m.role === 'admin' ? T : '#94a3b8',
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {m.role}
              </span>

              {/* Remove button — admin only, not self */}
              {myRole === 'admin' && m.email.toLowerCase() !== myEmail.toLowerCase() && (
                <button
                  onClick={() => removeMember(m.email)}
                  disabled={removeLoading === m.email}
                  style={{
                    background: 'none',
                    border: '1px solid #fecaca',
                    color: '#ef4444',
                    padding: '5px 12px',
                    borderRadius: 7,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'IBM Plex Mono, monospace',
                    opacity: removeLoading === m.email ? 0.5 : 1,
                  }}
                >
                  {removeLoading === m.email ? '…' : 'Remove'}
                </button>
              )}
            </div>
          ))}

          {!loading && members.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#94a3b8' }}>
              No team members found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
