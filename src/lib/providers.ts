export type SearchFilters = {
  city: string
  state: string
  minPrice?: number | null
  maxPrice: number
  minYear?: number
  maxYear?: number
  maxMileage?: number | null
  make?: string
  model?: string
  keywords?: string
  radius?: number
}

export type Provider = {
  id: string
  name: string
  shortName: string
  logo: string
  logoUrl: string | null
  brandColor: string
  enabled: boolean
  supportedFilters: (
    | 'city'
    | 'state'
    | 'minPrice'
    | 'maxPrice'
    | 'minYear'
    | 'maxYear'
    | 'minMileage'
    | 'maxMileage'
    | 'make'
    | 'model'
    | 'keywords'
    | 'radius'
  )[]
  urlBuilder: (filters: SearchFilters) => string
}

const FALLBACK_PROVIDER: Provider = {
  id: 'unknown',
  name: 'Marketplace',
  shortName: 'Marketplace',
  logo: '🏪',
  logoUrl: null,
  brandColor: '#71717a',
  enabled: false,
  supportedFilters: [],
  urlBuilder: () => '',
}

export function getProvider(id: string): Provider {
  return PROVIDERS.find((p) => p.id === id) ?? FALLBACK_PROVIDER
}

export const PROVIDERS: Provider[] = [
  {
    id: 'facebook',
    name: 'Facebook Marketplace',
    shortName: 'Facebook',
    logo: '📘',
    logoUrl: '/providers/facebook.svg',
    brandColor: '#1877F2',
    enabled: true,
    supportedFilters: ['city', 'minPrice', 'maxPrice', 'make', 'model', 'keywords', 'radius'],
    urlBuilder: (f) => {
      const city = (f.city || '').toLowerCase().replace(/\s+/g, '')

      const params = new URLSearchParams()
      params.set('minPrice', String(f.minPrice && f.minPrice >= 500 ? f.minPrice : 500))
      params.set('maxPrice', String(f.maxPrice))
      if (f.minYear) params.set('minYear', String(f.minYear))
      if (f.maxMileage) params.set('maxMileage', String(f.maxMileage))
      params.append('vehicleType', 'car')
      params.append('vehicleType', 'truck')
      params.append('vehicleType', 'suv')
      params.set('exact', 'true')
      params.set('sortBy', 'creation_time_descend')
      params.set('daysSinceListed', '7')

      const queryParts = [f.make, f.model, f.keywords].filter(Boolean).join(' ').trim()
      if (queryParts) {
        return `https://www.facebook.com/marketplace/${city}/search?${params.toString()}&query=${encodeURIComponent(queryParts)}`
      }
      return `https://www.facebook.com/marketplace/${city}/vehicles?${params.toString()}`
    },
  },
  {
    id: 'craigslist',
    name: 'Craigslist',
    shortName: 'Craigslist',
    logo: '🪧',
    logoUrl: '/providers/craigslist.svg',
    brandColor: '#5C218A',
    enabled: true,
    supportedFilters: ['city', 'state', 'maxPrice', 'minPrice', 'minYear', 'maxYear', 'maxMileage', 'make', 'model', 'keywords'],
    urlBuilder: () => '',
  },
  {
    id: 'carsdotcom',
    name: 'Cars.com',
    shortName: 'Cars.com',
    logo: '🏷️',
    logoUrl: '/providers/carsdotcom.svg',
    brandColor: '#E1251B',
    enabled: true,
    supportedFilters: ['city', 'minPrice', 'maxPrice', 'minYear', 'maxYear', 'maxMileage', 'make', 'model', 'radius'],
    urlBuilder: () => '',
  },
  {
    id: 'cargurus',
    name: 'CarGurus',
    shortName: 'CarGurus',
    logo: '🔍',
    logoUrl: null,
    brandColor: '#E8143C',
    enabled: true,
    supportedFilters: ['city', 'radius', 'minPrice', 'maxPrice', 'minYear', 'maxMileage'],
    urlBuilder: () => '',
  },
  {
    id: 'offerup',
    name: 'OfferUp',
    shortName: 'OfferUp',
    logo: '🛒',
    logoUrl: '/providers/offerup.svg',
    brandColor: '#00B47C',
    enabled: false,
    // DISABLED: OfferUp search URLs carry no location param (confirmed via
    // /explore/k/... paths). Location derives from the scraper's IP, which
    // geolocates unpredictably, so results don't match the user's city.
    // Re-enable only if a city-targeted scraping path (e.g. city-pinned proxy)
    // becomes available.
    supportedFilters: ['minPrice', 'maxPrice', 'make', 'model', 'keywords'],
    urlBuilder: () => '',
  },
  {
    id: 'autotrader',
    name: 'AutoTrader',
    shortName: 'AutoTrader',
    logo: '🚗',
    logoUrl: '/providers/autotrader.svg',
    brandColor: '#FF6900',
    enabled: false,
    supportedFilters: ['state', 'minPrice', 'maxPrice', 'minYear', 'make', 'model'],
    urlBuilder: () => '',
  },
]
