'use client'

import { useEffect, useState } from 'react'

interface ProximityUnit {
  id: string
  address: string
  city?: string
  province: string
  lat: number
  lng: number
  bedrooms: number
  daily_rate?: number
  status: string
  distance_km: number
  drive_min: number
}

const STATUS_COLOR: Record<string, string> = {
  vacant: '#4CAF93',
  occupied: '#C9A84C',
  reserved: '#4F87A0',
  maintenance: '#E84855',
}

interface Props {
  lat: number
  lng: number
  worksiteLabel?: string
  embed?: boolean
}

export default function ProximityResults({ lat, lng, worksiteLabel, embed = false }: Props) {
  const [units, setUnits] = useState<ProximityUnit[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!lat || !lng) return
    setLoading(true)
    fetch(`/api/units/proximity?lat=${lat}&lng=${lng}&limit=6`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUnits(data)
      })
      .finally(() => setLoading(false))
  }, [lat, lng])

  if (!lat || !lng) return null

  const dark = embed

  const cardBg = dark ? 'rgba(255,255,255,0.04)' : 'white'
  const border = dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E8E8E6'
  const textPrimary = dark ? '#DDD5C8' : '#1A1A1A'
  const textMuted = dark ? 'rgba(168,209,231,0.6)' : '#6B7280'
  const rowBg = dark ? 'rgba(255,255,255,0.03)' : '#F7F7F5'

  if (loading) {
    return (
      <div style={{ background: cardBg, border, borderRadius: 10, padding: '20px 24px', marginTop: 12 }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: textMuted, letterSpacing: '0.12em' }}>
          SCANNING NEARBY UNITS...
        </div>
      </div>
    )
  }

  if (units.length === 0) {
    return (
      <div style={{ background: cardBg, border, borderRadius: 10, padding: '20px 24px', marginTop: 12 }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: textMuted, letterSpacing: '0.12em' }}>
          No units with map coordinates yet. Add units in the dashboard to see proximity.
        </div>
      </div>
    )
  }

  const vacantUnits = units.filter(u => u.status === 'vacant')

  return (
    <div style={{ marginTop: 12 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
          color: '#4F87A0', letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          📍 Nearest ERS Units
          {worksiteLabel && (
            <span style={{ color: textMuted, marginLeft: 8, fontWeight: 400 }}>
              — near {worksiteLabel.split(',')[0]}
            </span>
          )}
        </div>
        {vacantUnits.length > 0 && (
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 9,
            color: '#4CAF93', letterSpacing: '0.1em',
            background: 'rgba(76,175,147,0.12)', border: '1px solid rgba(76,175,147,0.3)',
            borderRadius: 4, padding: '2px 8px',
          }}>
            {vacantUnits.length} VACANT
          </div>
        )}
      </div>

      {/* Unit rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {units.map((unit, i) => (
          <div key={unit.id} style={{
            background: i === 0 ? (dark ? 'rgba(79,135,160,0.1)' : '#EBF4F8') : rowBg,
            border: i === 0
              ? (dark ? '1px solid rgba(79,135,160,0.3)' : '1px solid #4F87A033')
              : (dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #ECECEC'),
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            {/* Rank */}
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: i === 0 ? '#4F87A0' : (dark ? 'rgba(255,255,255,0.08)' : '#E8E8E6'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
              color: i === 0 ? 'white' : textMuted, fontWeight: 600,
            }}>
              {i + 1}
            </div>

            {/* Address */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {unit.address}
              </div>
              {unit.city && (
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: textMuted, marginTop: 2 }}>
                  {unit.city}, {unit.province} · {unit.bedrooms} bed{unit.bedrooms !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Distance */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, fontWeight: 600,
                color: i === 0 ? '#4F87A0' : textPrimary,
              }}>
                {unit.distance_km} km
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: textMuted }}>
                ~{unit.drive_min} min
              </div>
            </div>

            {/* Rate */}
            {unit.daily_rate && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 600,
                  color: '#C9A84C',
                }}>
                  ${unit.daily_rate}/day
                </div>
              </div>
            )}

            {/* Status badge */}
            <div style={{
              fontSize: 8, padding: '2px 8px', borderRadius: 4,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: `${STATUS_COLOR[unit.status] || '#888'}22`,
              border: `1px solid ${STATUS_COLOR[unit.status] || '#888'}44`,
              color: STATUS_COLOR[unit.status] || '#888',
              flexShrink: 0,
            }}>
              {unit.status}
            </div>
          </div>
        ))}
      </div>

      {units.length > 0 && (
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 9,
          color: textMuted, marginTop: 8, textAlign: 'right',
        }}>
          Sorted by distance from your work site · Drive times estimated
        </div>
      )}
    </div>
  )
}
