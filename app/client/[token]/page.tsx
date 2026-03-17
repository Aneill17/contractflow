'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import ClientLayout from '@/components/ClientLayout'

function SignedContent({ token }: { token: string }) {
  const searchParams = useSearchParams()
  const [contract, setContract] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/client/${token}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setContract(data) })
  }, [token])

  return (
    <ClientLayout>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#1B4353', padding: '36px 40px', textAlign: 'center' }}>
            <img src="/logo-v2.png" alt="Elias Range Stays" style={{ height: 36, marginBottom: 16, display: 'inline-block' }} />
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#2D5A3D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <span style={{ color: 'white', fontSize: 26 }}>✓</span>
            </div>
            <h1 style={{
              fontFamily: "'League Spartan', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              color: 'white',
              margin: 0,
            }}>
              You&apos;re all signed up
            </h1>
            {contract && (
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8, letterSpacing: '0.1em' }}>
                {contract.reference}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '32px 40px' }}>
            {contract ? (
              <>
                <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 15, color: '#444', lineHeight: 1.8, marginTop: 0 }}>
                  Thank you, <strong>{contract.contact_name}</strong>. Your lease agreement for{' '}
                  <strong>{contract.client_name}</strong> has been signed successfully.
                </p>
                <div style={{ background: '#F7F7F5', borderRadius: 10, padding: '20px 24px', margin: '20px 0' }}>
                  {[
                    ['Location', contract.location],
                    ['Check-in', contract.start_date],
                    ['Check-out', contract.end_date],
                  ].map(([label, value]) => (
                    <div key={label} style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 14, color: '#1A1A1A', lineHeight: 1.6 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: '#6B7280', lineHeight: 1.8 }}>
                  A copy of the fully executed agreement will be emailed to you once all parties have signed.
                  For any questions, contact us at{' '}
                  <a href="mailto:austin@eliasrangestays.ca" style={{ color: '#1B4353', textDecoration: 'none' }}>
                    austin@eliasrangestays.ca
                  </a>.
                </p>
              </>
            ) : (
              <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 14, color: '#6B7280', lineHeight: 1.8 }}>
                Your signature has been received. A copy of the executed agreement will be sent to your email once all parties have signed.
              </p>
            )}

            <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid #F0EDE8' }}>
              <div style={{ fontFamily: "'League Spartan', sans-serif", fontSize: 11, fontWeight: 600, color: '#1B4353', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Elias Range Stays
              </div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontStyle: 'italic', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                Healthy Living, Stronger Communities
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

export default function ClientSignedPage({ params }: { params: { token: string } }) {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#9CA3AF' }}>Loading...</div>
      </div>
    }>
      <SignedContent token={params.token} />
    </Suspense>
  )
}
