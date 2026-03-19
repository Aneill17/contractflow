'use client'

import { useEffect, useRef, useState } from 'react'

interface ERSUnit {
  id: string
  address: string
  city?: string
  lat: number
  lng: number
  status: string
  daily_rate?: number
  distance_km?: number
  drive_min?: number
}

interface WorksiteMapProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void
  initialAddress?: string
  ersUnits?: ERSUnit[]
  showUnits?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  vacant: '#4CAF93',
  occupied: '#C9A84C',
  reserved: '#4F87A0',
  maintenance: '#E84855',
}

export default function WorksiteMap({
  onLocationSelect,
  initialAddress,
  ersUnits = [],
  showUnits = false,
}: WorksiteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const worksiteMarkerRef = useRef<any>(null)
  const unitMarkersRef = useRef<any[]>([])
  const [search, setSearch] = useState(initialAddress || '')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    const script = document.createElement('script')
    script.id = 'leaflet-js'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      if (!mapRef.current || mapInstance.current) return
      const L = (window as any).L

      const map = L.map(mapRef.current, {
        center: [49.8, -123.1], // BC centre
        zoom: 7,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const worksiteIcon = L.divIcon({
        html: `<div style="width:20px;height:20px;background:#C9A84C;border:3px solid #FFF8E1;border-radius:50%;box-shadow:0 2px 8px rgba(201,168,76,0.6)"></div>`,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        if (worksiteMarkerRef.current) map.removeLayer(worksiteMarkerRef.current)
        worksiteMarkerRef.current = L.marker([lat, lng], { icon: worksiteIcon })
          .addTo(map)
          .bindPopup('<b style="font-family:IBM Plex Mono,monospace;font-size:11px">📍 Work Site</b>')

        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const d = await r.json()
          const addr = d.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          const short = addr.split(',').slice(0, 3).join(',').trim()
          setSearch(short)
          onLocationSelect(addr, lat, lng)
        } catch {
          const addr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setSearch(addr)
          onLocationSelect(addr, lat, lng)
        }
      })

      mapInstance.current = map
    }

    if (!document.getElementById('leaflet-js')) {
      document.head.appendChild(script)
    } else {
      // Script already loaded, just fire onload manually if L is available
      if ((window as any).L && mapRef.current && !mapInstance.current) {
        script.onload?.(new Event('load'))
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // Add/update ERS unit pins when units change
  useEffect(() => {
    if (!mapInstance.current || !showUnits) return
    const L = (window as any).L
    if (!L) return

    // Remove old unit markers
    unitMarkersRef.current.forEach(m => mapInstance.current.removeLayer(m))
    unitMarkersRef.current = []

    ersUnits.forEach(unit => {
      if (!unit.lat || !unit.lng) return
      const color = STATUS_COLORS[unit.status] || '#888'
      const icon = L.divIcon({
        html: `<div style="width:14px;height:14px;background:${color};border:2px solid rgba(255,255,255,0.8);border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      const label = unit.address.split(',')[0]
      const popup = `
        <div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:#1A1A1A;min-width:140px">
          <b>${label}</b><br/>
          ${unit.city ? `<span style="color:#666">${unit.city}</span><br/>` : ''}
          ${unit.daily_rate ? `<span style="color:#C9A84C">$${unit.daily_rate}/day</span><br/>` : ''}
          ${unit.distance_km ? `<span style="color:#4F87A0">${unit.distance_km} km away</span>` : ''}
        </div>
      `
      const marker = L.marker([unit.lat, unit.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(popup)
      unitMarkersRef.current.push(marker)
    })

    // If we have units and a worksite marker, fit bounds to show both
    if (ersUnits.length > 0 && worksiteMarkerRef.current) {
      try {
        const allLatLngs = [
          worksiteMarkerRef.current.getLatLng(),
          ...ersUnits.filter(u => u.lat && u.lng).map(u => L.latLng(u.lat, u.lng)),
        ]
        mapInstance.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [30, 30] })
      } catch {}
    }
  }, [ersUnits, showUnits])

  const geocodeSearch = async () => {
    if (!search.trim() || !mapInstance.current) return
    setSearching(true)
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search + ', BC, Canada')}&format=json&limit=1`
      )
      const results = await r.json()
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0]
        const L = (window as any).L
        const icon = L.divIcon({
          html: `<div style="width:20px;height:20px;background:#C9A84C;border:3px solid #FFF8E1;border-radius:50%;box-shadow:0 2px 8px rgba(201,168,76,0.6)"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        if (worksiteMarkerRef.current) mapInstance.current.removeLayer(worksiteMarkerRef.current)
        worksiteMarkerRef.current = L.marker([parseFloat(lat), parseFloat(lon)], { icon })
          .addTo(mapInstance.current)
          .bindPopup('<b style="font-family:IBM Plex Mono,monospace;font-size:11px">📍 Work Site</b>')
        mapInstance.current.setView([parseFloat(lat), parseFloat(lon)], 13)
        const short = display_name.split(',').slice(0, 3).join(',').trim()
        setSearch(short)
        onLocationSelect(display_name, parseFloat(lat), parseFloat(lon))
      }
    } catch {}
    setSearching(false)
  }

  const inputStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #D5D5D5',
    borderRadius: '6px 0 0 6px',
    padding: '9px 14px',
    color: '#1A1A1A',
    fontSize: 12,
    fontFamily: 'IBM Plex Mono, monospace',
    width: '100%',
    outline: 'none',
    flex: 1,
  }

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 8 }}>
        <input
          style={inputStyle}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && geocodeSearch()}
          placeholder="Search your work site address or click map..."
        />
        <button
          onClick={geocodeSearch}
          disabled={searching}
          style={{
            background: '#1B4353', color: 'white', border: '1px solid #1B4353',
            borderLeft: 'none', borderRadius: '0 6px 6px 0',
            padding: '9px 16px', cursor: 'pointer',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
            whiteSpace: 'nowrap',
          }}
        >
          {searching ? '...' : 'Search'}
        </button>
      </div>
      <div
        ref={mapRef}
        style={{
          height: 240, borderRadius: 8,
          border: '1px solid #D5D5D5',
          background: '#f0f0f0',
          overflow: 'hidden',
        }}
      />
      <div style={{
        display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap',
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#9CA3AF',
      }}>
        <span>🟡 Work site pin</span>
        {showUnits && (
          <>
            <span><span style={{ color: '#4CAF93' }}>●</span> Vacant unit</span>
            <span><span style={{ color: '#C9A84C' }}>●</span> Occupied</span>
            <span><span style={{ color: '#4F87A0' }}>●</span> Reserved</span>
          </>
        )}
        <span style={{ marginLeft: 'auto' }}>Click map or search to drop a pin</span>
      </div>
    </div>
  )
}
