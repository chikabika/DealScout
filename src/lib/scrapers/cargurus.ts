export type CarGurusInput = {
  city: string
  state: string
  zipCode: string | null
  radiusMiles: number | null
  minPrice: number | null
  maxPrice: number
  minYear: number | null
  maxMileage: number | null
  make: string | null
  model: string | null
  keywords: string | null
}

export type CarGurusListing = {
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
  dealerName: string | null
  provider: 'cargurus'
}

const CITY_ZIP_MAP: Record<string, string> = {
  // California
  losangeles: '90001',
  la: '90001',
  sanfrancisco: '94102',
  sf: '94102',
  sandiego: '92101',
  sanjose: '95101',
  sacramento: '95814',
  fresno: '93701',
  oakland: '94601',
  // Texas
  houston: '77001',
  dallas: '75201',
  austin: '78701',
  sanantonio: '78201',
  fortworth: '76101',
  // New York
  newyork: '10001',
  nyc: '10001',
  brooklyn: '11201',
  bronx: '10451',
  // Florida
  miami: '33101',
  orlando: '32801',
  tampa: '33601',
  jacksonville: '32099',
  // Illinois
  chicago: '60601',
  // Pennsylvania
  philadelphia: '19101',
  pittsburgh: '15201',
  // Georgia
  atlanta: '30301',
  // North Carolina
  charlotte: '28201',
  raleigh: '27601',
  // Arizona
  phoenix: '85001',
  tucson: '85701',
  // Washington
  seattle: '98101',
  // Colorado
  denver: '80201',
  // Massachusetts
  boston: '02101',
  // Michigan
  detroit: '48201',
  // Tennessee
  nashville: '37201',
  memphis: '38101',
  // Ohio
  columbus: '43201',
  cleveland: '44101',
  cincinnati: '45201',
  // Minnesota
  minneapolis: '55401',
  // Oregon
  portland: '97201',
  // Nevada
  lasvegas: '89101',
  // Missouri
  stlouis: '63101',
  kansascity: '64101',
  // Maryland
  baltimore: '21201',
  // Washington DC
  washington: '20001',
  washingtondc: '20001',
  dc: '20001',
}

function resolveZip(city: string): string {
  const key = city.toLowerCase().replace(/[\s\-_,.]/g, '')
  return CITY_ZIP_MAP[key] ?? '10001'
}

function buildCarGurusUrl(input: CarGurusInput): string {
  const zip = input.zipCode || resolveZip(input.city)
  const radius = input.radiusMiles ?? 50
  console.log('[CARGURUS] Resolved ZIP:', zip, '| Radius:', radius, 'miles | City:', input.city)
  const params = new URLSearchParams()
  params.set('zip', zip)
  params.set('distance', String(radius))
  params.set('sortDir', 'ASC')
  params.set('sortType', 'PRICE')
  if (input.maxPrice) params.set('maxPrice', String(input.maxPrice))
  if (input.minPrice) params.set('minPrice', String(input.minPrice))
  if (input.minYear) params.set('minYear', String(input.minYear))
  if (input.maxMileage) params.set('maxMileage', String(input.maxMileage))
  return `https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?${params.toString()}`
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
  const match = url.match(/details\/(\d+)/)
  return match ? match[1] : url
}

type FirecrawlListing = {
  title?: unknown
  price?: unknown
  mileage?: unknown
  location?: unknown
  dealer_name?: unknown
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

export async function runCarGurusScraper(
  input: CarGurusInput,
  options: { maxItems?: number } = {},
): Promise<CarGurusListing[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.error('[CARGURUS] FIRECRAWL_API_KEY not set')
    return []
  }

  const searchUrl = buildCarGurusUrl(input)
  console.log('[CARGURUS] Firecrawl scraping:', searchUrl)

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
            prompt: 'Extract all used car listings from this page. For each listing return: title (full year make model trim), price as a number (no symbols), mileage as a number (no units), location (city and state), dealer_name, url to the listing detail page, and image_url of the main photo.',
            schema: {
              type: 'object',
              properties: {
                listings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title:       { type: 'string' },
                      price:       { type: 'number' },
                      mileage:     { type: 'number' },
                      location:    { type: 'string' },
                      dealer_name: { type: 'string' },
                      url:         { type: 'string' },
                      image_url:   { type: 'string' },
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
      console.error('[CARGURUS] Firecrawl HTTP error:', res.status, res.statusText, err.slice(0, 300))
      throw new Error(`Firecrawl HTTP ${res.status}: ${err.slice(0, 150)}`)
    }

    const data = await res.json().catch(() => null) as {
      success?: boolean
      error?: unknown
      data?: { json?: { listings?: FirecrawlListing[] } }
    } | null

    if (!data?.success) {
      console.error('[CARGURUS] Firecrawl success=false. Error:', JSON.stringify(data?.error), 'Full response keys:', Object.keys(data ?? {}))
      throw new Error(`Firecrawl failed: ${JSON.stringify(data?.error)}`)
    }

    const rawListings = data.data?.json?.listings ?? []
    console.log('[CARGURUS] Firecrawl returned:', rawListings.length, 'listings')

    const max = options.maxItems ?? 20

    const mapped = rawListings
      .filter((listing) => stringOrNull(listing.url) && Number(listing.price) > 0)
      .map((listing): CarGurusListing => {
        const title = stringOrNull(listing.title) ?? 'Untitled listing'
        const rawUrl = stringOrNull(listing.url) ?? ''
        const url = rawUrl.startsWith('http') ? rawUrl : `https://www.cargurus.com${rawUrl}`
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
          dealerName: stringOrNull(listing.dealer_name),
          provider: 'cargurus',
        }
      })

    // Provider-side clamp — CarGurus LLM extraction ignores URL price/year/mileage filters.
    // Year/mileage are null-tolerant: never drop a listing just because we couldn't parse them.
    const clamped = mapped.filter((item) => {
      if (input.minPrice && item.price < input.minPrice) return false
      if (input.maxPrice && item.price > input.maxPrice) return false
      if (input.minYear && item.year != null && item.year < input.minYear) return false
      if (input.maxMileage && item.mileage != null && item.mileage > input.maxMileage) return false
      return true
    })

    console.log(
      `[CARGURUS] Clamp: ${clamped.length}/${mapped.length} kept ` +
      `(price ${input.minPrice ?? 0}-${input.maxPrice}, ` +
      `minYear ${input.minYear ?? '-'}, maxMileage ${input.maxMileage ?? '-'})`
    )

    return clamped.slice(0, max)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[CARGURUS] Scraper failed:', msg)
    throw e
  }
}

export { runCarGurusScraper as scrapeCarGurus }
