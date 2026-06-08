'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function VerifyInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      window.location.href = `/api/client/auth/verify?token=${token}`
    } else {
      router.replace('/client/portal/login?error=missing_token')
    }
  }, [token, router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B2540',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid rgba(0,191,166,0.2)',
          borderTopColor: '#00BFA6',
          margin: '0 auto 20px',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
          Verifying…
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0B2540', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
      </div>
    }>
      <VerifyInner />
    </Suspense>
  )
}
