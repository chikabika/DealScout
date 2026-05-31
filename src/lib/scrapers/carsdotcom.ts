export type CarsDotComInput = {
  city: string
  state: string
  minPrice: number | null
  maxPrice: number
  minYear: number | null
  maxMileage: number | null
  make: string | null
  model: string | null
  keywords: string | null
}

export type CarsDotComListing = {
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
  provider: 'carsdotcom'
}

function buildCarsUrl(input: CarsDotComInput): string {
  const params = new URLSearchParams()
  params.set('stock_type', 'used')
  params.set('maximum_distance', '75')
  params.set('zip', '90001')
  if (input.maxPrice) params.set('price_max', String(input.maxPrice))
  if (input.minPrice) params.set('price_min', String(input.minPrice))
  if (input.minYear) params.set('year_min', String(input.minYear))
  if (input.maxMileage) params.set('mileage_max', String(input.maxMileage))
  if (input.make) params.set('makes[]', input.make.toLowerCase())
  if (input.model) params.set('models[]', `${input.make?.toLowerCase() || ''}-${input.model?.toLowerCase() || ''}`)
  return `https://www.cars.com/shopping/results/?${params.toString()}`
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
  const match = url.match(/vehicledetail\/([a-f0-9\-]{30,})/i)
  return match ? match[1] : url
}

type FirecrawlListing = {
  title?: unknown
  price?: unknown
  mileage?: unknown
  location?: unknown
  url?: unknown
  image_url?: unknown
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberOrNull(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function runCarsDotComScraper(
  input: CarsDotComInput,
  options: { maxItems?: number } = {},
): Promise<CarsDotComListing[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.error('[CARSDOTCOM] FIRECRAWL_API_KEY not set')
    return []
  }

  const searchUrl = buildCarsUrl(input)
  console.log('[CARSDOTCOM] Firecrawl scraping:', searchUrl)

  try {
    const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: [
          {
            type: 'json',
            prompt: 'Extract all car listings from this page. For each car listing return: title (full title including year make model trim), price as a number (no currency symbol), mileage as a number (no units), location (city and state), url to the vehicle detail page, and image_url of the main photo.',
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
                      mileage: { type: 'number' },
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
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error('[CARSDOTCOM] Firecrawl error:', res.status, err.slice(0, 200))
      return []
    }

    const data = await res.json().catch(() => null) as {
      success?: boolean
      error?: unknown
      data?: { json?: { listings?: FirecrawlListing[] } }
    } | null

    if (!data?.success) {
      console.error('[CARSDOTCOM] Firecrawl failed:', data?.error)
      return []
    }

    const rawListings = data.data?.json?.listings ?? []
    console.log('[CARSDOTCOM] Firecrawl returned:', rawListings.length, 'listings')

    const max = options.maxItems ?? 20
    return rawListings
      .filter((listing) => stringOrNull(listing.url) && Number(listing.price) > 0)
      .slice(0, max)
      .map((listing): CarsDotComListing => {
        const title = stringOrNull(listing.title) ?? 'Untitled listing'
        const rawUrl = stringOrNull(listing.url) ?? ''
        const url = rawUrl.startsWith('http') ? rawUrl : `https://www.cars.com${rawUrl}`
        const parsed = parseTitle(title)
        const mileage = numberOrNull(listing.mileage)

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
          mileage: mileage ? Math.round(mileage) : null,
          description: null,
          provider: 'carsdotcom',
        }
      })
  } catch (e) {
    console.error('[CARSDOTCOM] Fetch failed:', e instanceof Error ? e.message : e)
    return []
  }
}
