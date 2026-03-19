import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Public endpoint — returns only non-sensitive unit fields for proximity display
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') || '')
  const lng = parseFloat(searchParams.get('lng') || '')
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20)

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('units')
    .select('id, address, city, province, lat, lng, bedrooms, daily_rate, status')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calculate distances and sort
  const withDistance = (data || [])
    .map((unit: any) => {
      const distance_km = haversineKm(lat, lng, unit.lat, unit.lng)
      const drive_min = Math.round((distance_km / 50) * 60) // ~50 km/h avg
      return { ...unit, distance_km: Math.round(distance_km * 10) / 10, drive_min }
    })
    .sort((a: any, b: any) => a.distance_km - b.distance_km)
    .slice(0, limit)

  return NextResponse.json(withDistance)
}
