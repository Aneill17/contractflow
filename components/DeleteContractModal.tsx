'use client'

import { useState } from 'react'

interface Props {
  contractRef: string
  contractId: string
  onDeleted: () => void
  onCancel: () => void
}

export default function DeleteContractModal({ contractRef, contractId, onDeleted, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    try {
      const session = (await import('@/lib/supabase')).supabase.auth.getSession
      const { data: { session: s } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      const token = s?.access_token

      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `${res.status}`)
      }
      onDeleted()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#13161D', border: '1px solid #e74c3c44',
        borderRadius: 12, padding: '32px 28px', width: 380, fontFamily: 'IBM Plex Mono',
      }}>
        <div style={{ fontSize: 16, color: '#DDD5C8', marginBottom: 10, fontFamily: 'Playfair Display, serif' }}>
          Delete Contract
        </div>
        <div style={{ fontSize: 12, color: '#ffffff55', marginBottom: 20, lineHeight: 1.6 }}>
          Are you sure you want to delete <span style={{ color: '#C9A84C' }}>{contractRef}</span>?
          This cannot be undone.
        </div>

        {error && (
          <div style={{ background: '#3a1a1a', border: '1px solid #e74c3c44', color: '#e74c3c', borderRadius: 7, padding: '8px 12px', fontSize: 11, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: 'transparent', border: '1px solid #ffffff22', color: '#ffffff55',
            borderRadius: 7, padding: '8px 18px', fontSize: 11, cursor: 'pointer', fontFamily: 'IBM Plex Mono',
          }}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading} style={{
            background: loading ? '#7f1d1d' : '#ef4444', border: 'none',
            color: '#fff', borderRadius: 7, padding: '8px 18px',
            fontSize: 11, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'IBM Plex Mono', fontWeight: 500,
          }}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
