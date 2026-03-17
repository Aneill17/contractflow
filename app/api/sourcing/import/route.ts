import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

function detectSource(url: string): string {
  if (url.includes('facebook.com')) return 'facebook'
  if (url.includes('kijiji.ca')) return 'kijiji'
  if (url.includes('craigslist.org')) return 'craigslist'
  return 'other'
}

function extractPrice(text: string): number | null {
  const match = text.match(/\$\s*([\d,]+)(?:\s*\/?\s*mo(?:nth)?)?/i)
  if (match) {
    const val = parseInt(match[1].replace(/,/g, ''))
    if (val > 100 && val < 20000) return val
  }
  return null
}

function extractBedrooms(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:bed(?:room)?s?|BR|bdr|bdrm)/i)
  if (match) return parseInt(match[1])
  if (/studio/i.test(text)) return 0
  return null
}

function extractMeta(html: string, property: string): string | null {
  // og: style
  const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'))
  if (ogMatch) return ogMatch[1]
  const ogMatch2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'))
  if (ogMatch2) return ogMatch2[1]
  return null
}

function extractTitle(html: string): string | null {
  const og = extractMeta(html, 'og:title')
  if (og) return og
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : null
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { url } = body
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  const source = detectSource(url)

  let html = ''
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContractFlow/1.0)' },
      signal: AbortSignal.timeout(12000),
    })
    if (res.ok) {
      html = await res.text()
    }
  } catch {
    // Partial result is fine
  }

  const rawTitle = extractTitle(html) || ''
  const title = decodeHtmlEntities(rawTitle)
  const description = decodeHtmlEntities(extractMeta(html, 'og:description') || '')
  const photo_url = extractMeta(html, 'og:image') || null

  const searchText = `${title} ${description}`
  const price = extractPrice(searchText)
  const bedrooms = extractBedrooms(searchText)

  return NextResponse.json({
    title: title || null,
    price,
    photo_url,
    description: description || null,
    bedrooms,
    source,
    url,
  })
}
