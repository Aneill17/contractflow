import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

// ─── Region definitions ──────────────────────────────────────────────────────

interface CraigslistRegion {
  key: string
  label: string
  subdomain: string
  lat: number
  lng: number
  kijiji_slug: string
  fb_city: string
}

const CRAIGSLIST_REGIONS: CraigslistRegion[] = [
  { key: 'vancouver',    label: 'Vancouver',     subdomain: 'vancouver',    lat: 49.2827, lng: -123.1207, kijiji_slug: 'k0c37l1700281', fb_city: 'vancouver' },
  { key: 'fraser',       label: 'Fraser Valley', subdomain: 'fraser',       lat: 49.1042, lng: -122.2965, kijiji_slug: 'k0c37l1700049', fb_city: 'abbotsford-bc' },
  { key: 'victoria',     label: 'Victoria',      subdomain: 'victoria',     lat: 48.4284, lng: -123.3656, kijiji_slug: 'k0c37l1700274', fb_city: 'victoria-bc' },
  { key: 'kelowna',      label: 'Kelowna',       subdomain: 'kelowna',      lat: 49.8880, lng: -119.4960, kijiji_slug: 'k0c37l1700228', fb_city: 'kelowna-bc' },
  { key: 'prncegeorge',  label: 'Prince George', subdomain: 'prncegeorge',  lat: 53.9171, lng: -122.7497, kijiji_slug: 'k0c37l1700265', fb_city: 'prince-george-bc' },
  { key: 'kamloops',     label: 'Kamloops',      subdomain: 'kamloops',     lat: 50.6745, lng: -120.3273, kijiji_slug: 'k0c37l1700218', fb_city: 'kamloops-bc' },
  { key: 'nanaimo',      label: 'Nanaimo',       subdomain: 'nanaimo',      lat: 49.1659, lng: -123.9401, kijiji_slug: 'k0c37l1700281', fb_city: 'nanaimo-bc' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function selectRegions(lat: number, lng: number, radiusKm: number): CraigslistRegion[] {
  // Sort by distance and pick regions whose city centre is within radius * 3 (broad net)
  const sorted = CRAIGSLIST_REGIONS
    .map(r => ({ ...r, dist: haversineKm(lat, lng, r.lat, r.lng) }))
    .sort((a, b) => a.dist - b.dist)

  // Always include closest, then add any within 3x the radius
  const threshold = Math.max(radiusKm * 3, 100)
  return sorted.filter(r => r.dist <= threshold).slice(0, 3)
}

interface ParsedListing {
  id: string
  source: 'craigslist'
  title: string
  url: string
  price: number | null
  bedrooms: number | null
  posted_date: string
  thumbnail: string | null
  description: string
  score: number
  score_reasons: string[]
}

function extractPrice(text: string): number | null {
  const m = text.match(/\$\s*([\d,]+)/)
  if (!m) return null
  return parseInt(m[1].replace(/,/g, ''), 10)
}

function extractBedrooms(text: string): number | null {
  const patterns = [
    /(\d+)\s*(?:br|bed|bedroom)/i,
    /(\d+)\s*bdrm/i,
    /(\d+)\s*bd\b/i,
    /\b(studio)\b/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      if (m[1].toLowerCase() === 'studio') return 0
      return parseInt(m[1], 10)
    }
  }
  return null
}

function scoreListingServer(
  title: string,
  description: string,
  price: number | null,
  bedrooms: number | null,
  hasPic: boolean,
  params: {
    bedroomsMin: number
    bedroomsMax: number
    maxMonthlyRent: number
    requireParking: boolean
    requireModern: boolean
    excludeKeywords: string[]
    unitTypes: string[]
  }
): { score: number; reasons: string[] } {
  const combined = `${title} ${description}`.toLowerCase()
  let score = 0
  const reasons: string[] = []

  // +20 bedroom match
  if (bedrooms !== null && bedrooms >= params.bedroomsMin && bedrooms <= params.bedroomsMax) {
    score += 20
    reasons.push('bedroom match')
  }

  // +15 within budget
  if (price !== null && price <= params.maxMonthlyRent) {
    score += 15
    reasons.push('within budget')
  }

  // +15 has photos
  if (hasPic) {
    score += 15
    reasons.push('has photos')
  }

  // +10 modern keywords
  const modernWords = ['modern', 'new', 'renovated', 'updated', 'bright', 'clean', 'fresh', 'luxury']
  if (modernWords.some(w => combined.includes(w))) {
    score += 10
    reasons.push('modern/updated')
  }

  // +10 no exclude keywords
  const hasExclude = params.excludeKeywords.some(kw => combined.includes(kw.toLowerCase()))
  if (!hasExclude) {
    score += 10
    reasons.push('quality listing')
  }

  // +10 parking
  if (combined.includes('parking') || combined.includes('garage') || combined.includes('stall')) {
    score += 10
    reasons.push('has parking')
  }

  // +10 unit type match
  const unitTypeWords: Record<string, string[]> = {
    apartment: ['apartment', 'apt', 'condo', 'flat'],
    house: ['house', 'home', 'detached'],
    townhouse: ['townhouse', 'townhome', 'town house'],
    'basement suite': ['basement', 'suite', 'lower level', 'lower suite'],
    'garden suite': ['garden suite', 'garden level', 'carriage'],
  }
  const typeMatch = params.unitTypes.some(type => {
    const words = unitTypeWords[type] || [type]
    return words.some(w => combined.includes(w))
  })
  if (typeMatch) {
    score += 10
    reasons.push('unit type match')
  }

  // -30 exclude keywords hit
  if (hasExclude) {
    score -= 30
  }

  // -20 over budget by 10%
  if (price !== null && price > params.maxMonthlyRent * 1.1) {
    score -= 20
    reasons.push('over budget')
  }

  return { score: Math.max(0, Math.min(100, score)), reasons }
}

async function fetchCraigslistRegion(
  region: CraigslistRegion,
  params: {
    bedroomsMin: number
    bedroomsMax: number
    maxMonthlyRent: number
    requireParking: boolean
    requireModern: boolean
    excludeKeywords: string[]
    unitTypes: string[]
  }
): Promise<{ listings: ParsedListing[]; regionKey: string; regionLabel: string; error?: string }> {
  const clUrl = `https://${region.subdomain}.craigslist.org/search/apa?format=rss&hasPic=1&availabilityMode=0&housing_type=1,2,3,6`
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(clUrl)}`

  try {
    const resp = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'ContractFlow/1.0' },
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const xml = await resp.text()

    // Parse RSS XML
    const listings: ParsedListing[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1]
      const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
      const title = titleMatch ? titleMatch[1].trim() : ''
      const link = item.match(/<link[^>]*>\s*(https?:\/\/[^\s<]+)/)?.[1]?.trim() || ''
      const pubDateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : ''
      const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)
      const description = descMatch ? descMatch[1] : ''
      const enclosure = item.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] || null

      const cleanTitle = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      const cleanDesc = description.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')

      const price = extractPrice(cleanTitle) || extractPrice(cleanDesc)
      const bedrooms = extractBedrooms(cleanTitle) || extractBedrooms(cleanDesc)

      // Generate ID from URL
      const idMatch = link.match(/\/(\d+)\.html/)
      const id = idMatch ? `cl_${idMatch[1]}` : `cl_${Math.random().toString(36).slice(2)}`

      const { score, reasons } = scoreListingServer(cleanTitle, cleanDesc, price, bedrooms, true, params)

      listings.push({
        id,
        source: 'craigslist',
        title: cleanTitle,
        url: link,
        price,
        bedrooms,
        posted_date: pubDate,
        thumbnail: enclosure,
        description: cleanDesc.slice(0, 200),
        score,
        score_reasons: reasons,
      })
    }

    return { listings, regionKey: region.key, regionLabel: region.label }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { listings: [], regionKey: region.key, regionLabel: region.label, error: message }
  }
}

// ─── Kijiji URL builder ───────────────────────────────────────────────────────

function buildKijijiLinks(params: {
  bedroomsMin: number
  bedroomsMax: number
  maxMonthlyRent: number
  furnished: boolean
  regions: CraigslistRegion[]
}): { label: string; url: string }[] {
  const links: { label: string; url: string }[] = []
  const bedLabel = params.bedroomsMin === params.bedroomsMax
    ? `${params.bedroomsMin}BR`
    : `${params.bedroomsMin}–${params.bedroomsMax}BR`
  const priceParam = `price=0__${params.maxMonthlyRent * 100}`
  const furnParam = params.furnished ? '&furnished=1' : ''

  for (const region of params.regions) {
    if (!region.kijiji_slug) continue
    const furnLabel = params.furnished ? ' Furnished' : ''

    // Kijiji correct URL format:
    // /b-apartments-condos/[city-slug]/[location-id]?price=0__[cents]&numberbedrooms=[n]
    // e.g. https://www.kijiji.ca/b-apartments-condos/vancouver/k0c37l1700281?price=0__280000&numberbedrooms=2
    const bedroomParam = params.bedroomsMin > 0 ? `&numberbedrooms=${params.bedroomsMin}` : ''
    const citySlug = region.label.toLowerCase().replace(/ /g, '-').replace(/[^a-z-]/g, '')
    const url = `https://www.kijiji.ca/b-apartments-condos/${citySlug}/${region.kijiji_slug}?${priceParam}${furnParam}${bedroomParam}&ad=offering&sortByName=dateDesc`

    links.push({
      label: `${bedLabel}${furnLabel} — ${region.label} (Kijiji)`,
      url,
    })
  }
  return links
}

// ─── Facebook URL builder ─────────────────────────────────────────────────────

function buildFacebookLinks(params: {
  maxMonthlyRent: number
  bedroomsMin: number
  bedroomsMax: number
  furnished: boolean
  regions: CraigslistRegion[]
}): { label: string; url: string }[] {
  // Facebook Marketplace rental search — works when user is logged into FB
  // /marketplace/[city]/rentals with price filter
  return params.regions.map(region => {
    const bedLabel = params.bedroomsMin === params.bedroomsMax
      ? `${params.bedroomsMin}BR`
      : `${params.bedroomsMin}–${params.bedroomsMax}BR`
    const furnLabel = params.furnished ? ' Furnished' : ''
    return {
      label: `${bedLabel}${furnLabel} — ${region.label} (Facebook)`,
      // FB Marketplace rentals with max price filter
      url: `https://www.facebook.com/marketplace/${region.fb_city}/propertyrentals/?maxPrice=${params.maxMonthlyRent}&exact=false&sortBy=creation_time_descend`,
    }
  })
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const {
    contract_id,
    work_site_lat,
    work_site_lng,
    work_site_address,
    radius_km = 20,
    bedrooms_min = 1,
    bedrooms_max = 4,
    bathrooms_min = 1,
    furnished = false,
    unit_types = ['apartment', 'house', 'townhouse', 'basement suite'],
    max_monthly_rent = 2800,
    require_parking = true,
    require_modern = true,
    min_photos = 4,
    exclude_keywords = ['student', 'shared', 'roommate', 'room only', 'land', 'for sale', 'commercial'],
  } = body

  // Save search config to DB
  const supabase = createServerClient()
  const { data: savedSearch, error: saveError } = await supabase
    .from('sourcing_searches')
    .insert([{
      contract_id: contract_id || null,
      work_site_lat: work_site_lat || null,
      work_site_lng: work_site_lng || null,
      work_site_address: work_site_address || null,
      radius_km,
      bedrooms_min,
      bedrooms_max,
      bathrooms_min,
      furnished,
      unit_types,
      max_monthly_rent,
      require_parking,
      require_modern,
      min_photos,
      exclude_keywords,
      last_run_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (saveError) {
    console.error('Failed to save search:', saveError)
    // Continue anyway — don't block the search
  }

  // Select regions based on lat/lng (default to Vancouver if no coords)
  const lat = work_site_lat || 49.2827
  const lng = work_site_lng || -123.1207
  const regions = selectRegions(lat, lng, radius_km)

  const filterParams = {
    bedroomsMin: bedrooms_min,
    bedroomsMax: bedrooms_max,
    maxMonthlyRent: max_monthly_rent,
    requireParking: require_parking,
    requireModern: require_modern,
    excludeKeywords: exclude_keywords,
    unitTypes: unit_types,
  }

  // Fetch all regions in parallel
  const regionResults = await Promise.all(
    regions.map(r => fetchCraigslistRegion(r, filterParams))
  )

  // Combine, deduplicate by URL, sort by score
  const seen = new Set<string>()
  const allListings: ParsedListing[] = []
  for (const result of regionResults) {
    for (const listing of result.listings) {
      if (!seen.has(listing.url)) {
        seen.add(listing.url)
        allListings.push(listing)
      }
    }
  }

  allListings.sort((a, b) => b.score - a.score)
  const top20 = allListings.slice(0, 20)

  const sourcesSearched = regionResults
    .filter(r => !r.error)
    .map(r => `craigslist_${r.regionKey}`)

  const sourcesErrored = regionResults
    .filter(r => r.error)
    .map(r => r.regionLabel)

  // Build Kijiji + Facebook links
  const kijiji_links = buildKijijiLinks({
    bedroomsMin: bedrooms_min,
    bedroomsMax: bedrooms_max,
    maxMonthlyRent: max_monthly_rent,
    furnished,
    regions,
  })

  const facebook_links = buildFacebookLinks({
    maxMonthlyRent: max_monthly_rent,
    bedroomsMin: bedrooms_min,
    bedroomsMax: bedrooms_max,
    furnished,
    regions,
  })

  // Update results count
  if (savedSearch) {
    await supabase
      .from('sourcing_searches')
      .update({ results_count: top20.length })
      .eq('id', savedSearch.id)
  }

  return NextResponse.json({
    search_id: savedSearch?.id || null,
    results: top20,
    kijiji_links,
    facebook_links,
    total_fetched: allListings.length,
    total_after_filter: top20.length,
    sources_searched: sourcesSearched,
    sources_errored: sourcesErrored,
    regions_tried: regions.map(r => r.label),
  })
}
