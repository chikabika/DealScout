import { CRAIGSLIST_CITY_MAP } from '@/lib/providers/craigslist-cities'

export type CraigslistInput = {
  city: string
  state: string
  minPrice: number | null
  maxPrice: number
  minYear: number | null
  maxYear: number | null
  maxMileage: number | null
  make: string | null
  model: string | null
  keywords: string | null
}

export type CraigslistListing = {
  externalId: string
  title: string
  price: number
  location: string | null
  url: string
  image: string | null
  allImages: string[]
  year: number | null
  make: string | null
  model: string | null
  mileage: number | null
  description: string | null
  postedAtMs: number | null
  provider: 'craigslist'
}

export type CraigslistSearchInput = CraigslistInput
export type CraigslistRawListing = CraigslistListing

export function resolveCraigslistSubdomain(city: string): string | null {
  const key = city.toLowerCase().replace(/[\s\-_,.]/g, '')
  return CRAIGSLIST_CITY_MAP[key] ?? null
}

export function buildCraigslistSearchUrl(input: CraigslistInput): string | null {
  const subdomain = resolveCraigslistSubdomain(input.city)
  if (!subdomain) {
    console.log('[CRAIGSLIST] No subdomain mapping for city:', input.city)
    return null
  }

  const params = new URLSearchParams()
  params.set('hasPic', '1')
  params.set('max_price', String(input.maxPrice))
  if (input.minPrice && input.minPrice > 0) params.set('min_price', String(input.minPrice))
  if (input.minYear) params.set('min_auto_year', String(input.minYear))
  if (input.maxMileage) params.set('max_auto_miles', String(input.maxMileage))

  const q = [input.make, input.model, input.keywords].filter(Boolean).join(' ').trim()
  if (q) params.set('query', q)

  return `https://${subdomain}.craigslist.org/search/cta?${params.toString()}`
}

function parseTitleFields(title: string): { year: number | null; make: string | null; model: string | null } {
  const clean = title.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const words = clean.split(' ')
  const yearMatch = words[0]?.match(/^(19|20)\d{2}$/)
  const year = yearMatch ? parseInt(words[0]) : null
  const make = year ? (words[1]?.toLowerCase() || null) : null
  const model = year ? (words[2]?.toLowerCase() || null) : null
  return { year, make, model }
}

function parseMileage(description: string | null): number | null {
  if (!description) return null

  const stripped = description.replace(/[^\x00-\x7F]/g, ' ')
  const patterns = [
    { regex: /(\d{1,3}(?:,\d{3})?)\s*miles?/i, multiplier: 1 },
    { regex: /(\d{1,3})k\s*miles?/i, multiplier: 1000 },
    { regex: /(\d{1,3}(?:,\d{3})?)\s*mi\b/i, multiplier: 1 },
  ]

  for (const { regex, multiplier } of patterns) {
    const match = stripped.match(regex)
    if (!match) continue

    const raw = match[1].replace(/,/g, '')
    const num = parseInt(raw) * multiplier
    if (num > 1000 && num < 600000) return num
  }

  return null
}

function cleanAscii(value: unknown, maxLength?: number): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return null
  return maxLength ? cleaned.slice(0, maxLength) : cleaned
}

export async function runCraigslistScraper(
  input: CraigslistInput,
  options: { maxItems?: number } = {},
): Promise<CraigslistListing[]> {
  const searchUrl = buildCraigslistSearchUrl(input)
  if (!searchUrl) {
    console.warn(`[CRAIGSLIST] City not supported: "${input.city}" — no Craigslist subdomain mapping. Returning [].`)
    return []
  }

  const token = process.env.APIFY_TOKEN
  if (!token) {
    console.error('[CRAIGSLIST] APIFY_TOKEN not set')
    return []
  }

  const maxItems = options.maxItems ?? 30
  console.log('[CRAIGSLIST] Starting Apify run:', searchUrl)

  const startRes = await fetch(
    `https://api.apify.com/v2/acts/solidcode~craigslist-scraper/runs?token=${token}&timeout=300&maxItems=${maxItems}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url: searchUrl }],
        includeDetails: true,
      }),
    },
  )
  const startJson = await startRes.json().catch(() => null) as {
    data?: { id?: string; defaultDatasetId?: string }
    error?: unknown
  } | null

  if (!startRes.ok || startJson?.error || !startJson?.data?.id || !startJson.data.defaultDatasetId) {
    console.error('[CRAIGSLIST] Failed to start run:', startJson?.error ?? startJson)
    return []
  }

  const runId = startJson.data.id
  const datasetId = startJson.data.defaultDatasetId
  console.log('[CRAIGSLIST] Run started:', { runId, datasetId })

  // Actor is launched with timeout=300 (5 min). Poll for up to 375s (75 attempts
  // x 5s) so we always outlast the actor's own timeout instead of giving up early
  // and reporting failure on a run that's about to succeed.
  let status = 'READY'
  let attempts = 0
  while (!['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'].includes(status) && attempts < 75) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`)
    const statusJson = await statusRes.json().catch(() => null) as { data?: { status?: string } } | null
    status = statusJson?.data?.status ?? 'FAILED'
    attempts++
    console.log(`[CRAIGSLIST] Run status (${attempts}): ${status}`)
  }

  if (status !== 'SUCCEEDED') {
    console.error('[CRAIGSLIST] Run did not succeed:', status)
    return []
  }

  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true&format=json&limit=${maxItems}`,
  )
  const items = await itemsRes.json().catch(() => []) as unknown[]
  console.log('[CRAIGSLIST] Apify returned:', items.length, 'items')

  const mapped = items
    .filter((item): item is Record<string, unknown> => {
      if (!item || typeof item !== 'object') return false
      const row = item as Record<string, unknown>
      return row.isDeleted !== true && Number(row.priceUsd) > 0 && typeof row.url === 'string'
    })
    .map((item): CraigslistListing => {
      const title = cleanAscii(item.title) ?? 'Untitled listing'
      const description = cleanAscii(item.description, 1000)
      const parsed = parseTitleFields(title)
      const images = Array.isArray(item.imageUrls)
        ? item.imageUrls.filter((url): url is string => typeof url === 'string').slice(0, 5)
        : []
      const postedAtMs = item.postedAt ? new Date(String(item.postedAt)).getTime() : null

      return {
        externalId: String(item.postId || item.url),
        title,
        price: Math.round(Number(item.priceUsd)),
        location: cleanAscii(item.location, 100),
        url: String(item.url),
        image: images[0] || null,
        allImages: images,
        year: parsed.year,
        make: parsed.make,
        model: parsed.model,
        mileage: parseMileage(description),
        description,
        postedAtMs: postedAtMs && Number.isFinite(postedAtMs) ? postedAtMs : null,
        provider: 'craigslist',
      }
    })

  // Craigslist ignores min_auto_year — enforce year post-scrape.
  // Null-tolerant: Craigslist titles often don't lead with the year, so a
  // null year means "unknown", NOT "out of range" — keep those rather than
  // drop real in-range inventory.
  const clamped = mapped.filter((item) => {
    if (input.minYear && item.year != null && item.year < input.minYear) return false
    if (input.maxYear && item.year != null && item.year > input.maxYear) return false
    return true
  })

  console.log(
    `[CRAIGSLIST] Year clamp: ${clamped.length}/${mapped.length} kept ` +
    `(minYear ${input.minYear ?? '-'}, maxYear ${input.maxYear ?? '-'})`
  )

  return clamped.slice(0, maxItems)
}

export const scrapeCraigslist = runCraigslistScraper
