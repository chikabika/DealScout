export type OfferUpInput = {
  city: string        // stored but not used in URL — OfferUp ignores location params
  state: string       // stored but not used in URL — OfferUp ignores location params
  minPrice: number | null
  maxPrice: number
  minYear: number | null
  maxMileage: number | null
  make: string | null
  model: string | null
  keywords: string | null
}

export type OfferUpListing = {
  externalId: string
  title: string
  price: number
  location: string | null
  url: string
  image: string | null
  year: number | null
  make: string | null
  model: string | null
  mileage: number | null
  description: string | null
  provider: 'offerup'
}

// NOTE: OfferUp ignores URL location/radius params and returns results based on
// the scraper's IP geolocation — do not add city/state/radius to the URL, they
// have no effect. We accept this and still filter by price downstream.
function buildOfferUpUrl(input: OfferUpInput): string {
  const params = new URLSearchParams()
  if (input.minPrice) params.set('price_min', String(input.minPrice))
  if (input.maxPrice) params.set('price_max', String(input.maxPrice))

  const queryParts = [
    input.make,
    input.model,
    input.keywords,
  ].filter((v): v is string => !!v && v.trim().length > 0)

  // Always need at least one search term — use 'car' as last resort
  const q = queryParts.length > 0 ? queryParts.join(' ') : 'car'
  params.set('q', q)

  return `https://offerup.com/search/?${params.toString()}`
}

function parseTitle(title: string): { year: number | null; make: string | null; model: string | null } {
  const clean = title.replace(/^(used|new|certified)\s+/i, '').trim()
  const match = clean.match(/^(\d{4})\s+(\S+)\s+(.+)$/)
  if (!match) return { year: null, make: null, model: null }

  const year = parseInt(match[1])
  if (year < 1950 || year > new Date().getFullYear() + 2) {
    return { year: null, make: null, model: null }
  }

  const modelFull = match[3].split(' ').slice(0, 2).join(' ')
  return { year, make: match[2], model: modelFull }
}

function extractId(url: string): string {
  const match = url.match(/detail\/([a-f0-9\-]{30,})/i)
  return match ? match[1] : url
}

type FirecrawlListing = {
  title?: unknown
  price?: unknown
  location?: unknown
  url?: unknown
  image_url?: unknown
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function runOfferUpScraper(
  input: OfferUpInput,
  options: { maxItems?: number } = {},
): Promise<OfferUpListing[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.error('[OFFERUP] FIRECRAWL_API_KEY not set')
    return []
  }

  const searchUrl = buildOfferUpUrl(input)
  console.log('[OFFERUP] Firecrawl scraping:', searchUrl)

  try {
    const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        waitFor: 3000,
        formats: [
          {
            type: 'json',
            prompt: 'Extract all vehicle or car listings shown on this page. For each listing return: title (include year if visible in the title), price as a number (skip listings with no price), location (city and state if shown, otherwise null), url to the item detail page (must start with https://offerup.com/item/detail/), and image_url of the main photo.',
            schema: {
              type: 'object',
              properties: {
                listings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      price: { type: 'number' },
                      location: { type: 'string' },
                      url: { type: 'string' },
                      image_url: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(120000),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error('[OFFERUP] Firecrawl HTTP error:', res.status, res.statusText, err.slice(0, 300))
      throw new Error(`Firecrawl HTTP ${res.status}: ${err.slice(0, 150)}`)
    }

    const data = await res.json().catch(() => null) as {
      success?: boolean
      error?: unknown
      data?: { json?: { listings?: FirecrawlListing[] } }
    } | null

    if (!data?.success) {
      console.error('[OFFERUP] Firecrawl success=false. Error:', JSON.stringify(data?.error), 'Full response keys:', Object.keys(data ?? {}))
      throw new Error(`Firecrawl failed: ${JSON.stringify(data?.error)}`)
    }

    const rawListings = data.data?.json?.listings ?? []
    console.log('[OFFERUP] Firecrawl returned:', rawListings.length, 'listings')
    if (rawListings.length === 0) {
      console.warn('[OFFERUP] Zero listings — URL was:', searchUrl)
    }

    const max = options.maxItems ?? 20
    return rawListings
      .filter((listing) => {
        const url = stringOrNull(listing.url)
        const image = stringOrNull(listing.image_url)
        return url && Number(listing.price) > 0 && !(image && image.includes('image_placeholder'))
      })
      .slice(0, max)
      .map((listing): OfferUpListing => {
        const title = stringOrNull(listing.title) ?? 'Untitled listing'
        const rawUrl = stringOrNull(listing.url) ?? ''
        const url = rawUrl.startsWith('http') ? rawUrl : `https://offerup.com${rawUrl}`
        const parsed = parseTitle(title)

        return {
          externalId: extractId(url),
          title,
          price: Math.round(Number(listing.price)),
          location: stringOrNull(listing.location),
          url,
          image: stringOrNull(listing.image_url),
          year: parsed.year,
          make: parsed.make,
          model: parsed.model,
          mileage: null,
          description: null,
          provider: 'offerup',
        }
      })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[OFFERUP] Scraper failed:', msg)
    throw e
  }
}

export { runOfferUpScraper as scrapeOfferUp }
