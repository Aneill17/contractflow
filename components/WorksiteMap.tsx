'use client'

import { useEffect, useRef, useState } from 'react'

interface WorksiteMapProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void
  initialAddress?: string
}

export default function WorksiteMap({ onLocationSelect, initialAddress }: WorksiteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [search, setSearch] = useState(initialAddress || '')
  const [searching, setSearching] = useState(false)
  const [loaded, setLoaded] = useState(false)

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

      // Custom marker
      const icon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:#1B4353;border:3px solid #4F87A0;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) map.removeLayer(markerRef.current)
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map)

        // Reverse geocode
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const d = await r.json()
          const addr = d.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setSearch(addr.split(',').slice(0, 3).join(',').trim())
          onLocationSelect(addr, lat, lng)
        } catch {
          const addr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setSearch(addr)
          onLocationSelect(addr, lat, lng)
        }
      })

      mapInstance.current = map
      setLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  const geocodeSearch = async () => {
    if (!search.trim() || !mapInstance.current) return
    setSearching(true)
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search + ', BC, Canada')}&format=json&limit=1`)
      const results = await r.json()
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0]
        const L = (window as any).L
        const icon = L.divIcon({
          html: `<div style="width:18px;height:18px;background:#1B4353;border:3px solid #4F87A0;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        })
        if (markerRef.current) mapInstance.current.removeLayer(markerRef.current)
        markerRef.current = L.marker([parseFloat(lat), parseFloat(lon)], { icon }).addTo(mapInstance.current)
        mapInstance.current.setView([parseFloat(lat), parseFloat(lon)], 13)
        setSearch(display_name.split(',').slice(0, 3).join(',').trim())
        onLocationSelect(display_name, parseFloat(lat), parseFloat(lon))
      }
    } catch {}
    setSearching(false)
  }

  const inputStyle: React.CSSProperties = {
    background: '#0C0E14',
    border: '1px solid #ffffff12',
    borderRadius: '6px 0 0 6px',
    padding: '9px 14px',
    color: '#DDD5C8',
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
          placeholder="Search work site address or click map..."
        />
        <button
          onClick={geocodeSearch}
          disabled={searching}
          style={{
            background: '#1B4353', color: '#4F87A0', border: '1px solid #4F87A033',
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
          height: 220, borderRadius: 8,
          border: '1px solid #ffffff10',
          background: '#1a1f2e',
          overflow: 'hidden',
        }}
      />
      <div style={{ fontSize: 10, color: '#ffffff33', marginTop: 6, fontFamily: 'IBM Plex Mono, monospace' }}>
        Search your work site address or click the map to drop a pin
      </div>
    </div>
  )
}
