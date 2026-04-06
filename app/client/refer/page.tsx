'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export default function ClientReferPage() {
  const [clientSince, setClientSince] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/client/login'
        return
      }

      try {
        const res = await fetch('/api/client-portal/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setCompanyName(data.account?.company_name || '')

          // Find earliest contract start_date
          const contracts = data.contracts || []
          if (contracts.length > 0) {
            const dates = contracts
              .map((c: any) => c.start_date)
              .filter(Boolean)
              .sort()
            if (dates.length > 0) {
              const earliest = new Date(dates[0])
              setClientSince(earliest.toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }))
            }
          }
        }
      } catch (err) {
        console.error('Failed to load refer page data:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B2540', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B2540',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 18,
        padding: '48px 44px',
        maxWidth: 520,
        width: '100%',
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <Image
            src="/logo.png"
            alt="Elias Range Stays"
            width={160}
            height={60}
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            onError={(e: any) => { e.target.style.display = 'none' }}
          />
        </div>

        {/* Heading */}
        <div style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: 10,
          color: '#00BFA6',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          Refer a Colleague
        </div>
        <h1 style={{
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: '-0.01em',
          margin: '0 0 20px',
        }}>
          Help a colleague find the perfect housing solution
        </h1>

        {/* Body */}
        <p style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: 15,
          lineHeight: 1.75,
          marginBottom: 24,
        }}>
          Elias Range Stays provides professional workforce housing for healthcare and construction workers across British Columbia.
        </p>

        {/* Dynamic client-since text */}
        {clientSince && (
          <div style={{
            background: 'rgba(0,191,166,0.1)',
            border: '1px solid rgba(0,191,166,0.25)',
            borderRadius: 10,
            padding: '14px 20px',
            marginBottom: 32,
            fontFamily: 'IBM Plex Mono',
            fontSize: 12,
            color: '#00BFA6',
          }}>
            {companyName ? `${companyName} has` : 'You&apos;ve'} been a client since {clientSince}
          </div>
        )}

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a
            href="https://www.eliasrangestays.ca"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              background: '#00BFA6',
              color: '#ffffff',
              padding: '14px 24px',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            🌐 Visit Our Website
          </a>

          <Link
            href="/client/dashboard"
            style={{
              display: 'block',
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              padding: '14px 24px',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              border: '1px solid rgba(255,255,255,0.15)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
          >
            ✦ Request a Quote
          </Link>

          <a
            href="https://g.page/r/PLACEHOLDER/review"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              background: 'rgba(196,121,58,0.15)',
              color: '#C4793A',
              padding: '14px 24px',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              border: '1px solid rgba(196,121,58,0.3)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            ⭐ Leave Us a Google Review
          </a>
        </div>

        {/* Back link */}
        <div style={{ marginTop: 32 }}>
          <Link href="/client/dashboard" style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            textDecoration: 'none',
          }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
