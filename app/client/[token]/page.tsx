'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignedContent({ token }: { token: string }) {
  const searchParams = useSearchParams()
  const [contract, setContract] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/client/${token}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setContract(data) })
  }, [token])

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 520, width: '100%', margin: '0 24px' }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#1B4353', padding: '36px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h1 style={{ fontSize: 24, fontWeight: 400, color: 'white', margin: 0 }}>
              You&apos;re all signed up
            </h1>
            {contract && (
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#ffffff66', marginTop: 8, letterSpacing: '0.1em' }}>
                {contract.reference}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '32px 40px' }}>
            {contract ? (
              <>
                <p style={{ fontSize: 15, color: '#444', lineHeight: 1.8, marginTop: 0 }}>
                  Thank you, <strong>{contract.contact_name}</strong>. Your lease agreement for{' '}
                  <strong>{contract.client_name}</strong> has been signed successfully.
                </p>
                <div style={{ background: '#f9f7f4', borderRadius: 10, padding: '20px 24px', margin: '20px 0', fontSize: 13, lineHeight: 2 }}>
                  <div><span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Location</span><br />{contract.location}</div>
                  <div style={{ marginTop: 10 }}><span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Check-in</span><br />{contract.start_date}</div>
                  <div style={{ marginTop: 10 }}><span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Check-out</span><br />{contract.end_date}</div>
                </div>
                <p style={{ fontSize: 13, color: '#777', lineHeight: 1.8 }}>
                  A copy of the fully executed agreement will be emailed to you once all parties have signed.
                  For any questions, contact us at{' '}
                  <a href="mailto:austin@eliasrangestays.ca" style={{ color: '#1B4353' }}>austin@eliasrangestays.ca</a>.
                </p>
              </>
            ) : (
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8 }}>
                Your signature has been received. A copy of the executed agreement will be sent to your email once all parties have signed.
              </p>
            )}

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#bbb', letterSpacing: '0.1em' }}>
                ELIAS RANGE STAYS
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#ccc', marginTop: 2 }}>
                Healthy Living, Stronger Communities
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClientSignedPage({ params }: { params: { token: string } }) {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#999' }}>Loading...</div>
      </div>
    }>
      <SignedContent token={params.token} />
    </Suspense>
  )
}
