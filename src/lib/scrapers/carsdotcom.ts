export type CarsDotComInput = {
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

function buildCarsUrl(input: CarsDotComInput): string {
  const zip = input.zipCode || resolveZip(input.city)
  const radius = input.radiusMiles ?? 50
  console.log('[CARSDOTCOM] Resolved ZIP:', zip, '| Radius:', radius, 'miles | City:', input.city)
  const params = new URLSearchParams()
  params.set('stock_type', 'used')
  params.set('zip', zip)
  params.set('maximum_distance', String(radius))
  params.set('sort', 'best_match_desc')
  if (input.maxPrice) params.set('price_max', String(input.maxPrice))
  if (input.minPrice) params.set('price_min', String(input.minPrice))
  if (input.minYear) params.set('year_min', String(input.minYear))
  if (input.maxMileage) params.set('mileage_max', String(input.maxMileage))
  if (input.make) params.set('makes[]', input.make.toLowerCase())
  if (input.model && input.make) {
    params.set('models[]', `${input.make.toLowerCase()}-${input.model.toLowerCase().replace(/\s+/g, '-')}`)
  }
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
