export type SearchFilters = {
  city: string
  state: string
  minPrice?: number | null
  maxPrice: number
  minYear?: number
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
  logoUrl: string
  brandColor: string
  enabled: boolean
  supportedFilters: (
    | 'city'
    | 'state'
    | 'minPrice'
    | 'maxPrice'
    | 'minYear'
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
  logoUrl: '',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png',
    brandColor: '#1877F2',
    enabled: true,
    supportedFilters: ['city', 'minPrice', 'maxPrice', 'minYear', 'maxMileage', 'make', 'model', 'keywords'],
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
    logoUrl: '',
    brandColor: '#5C218A',
    enabled: false,
    supportedFilters: ['city', 'state', 'minPrice', 'maxPrice', 'minYear', 'make', 'model'],
    urlBuilder: () => '',
  },
  {
    id: 'offerup',
    name: 'OfferUp',
    shortName: 'OfferUp',
    logo: '🛒',
    logoUrl: '',
    brandColor: '#00B47C',
    enabled: false,
    supportedFilters: ['city', 'state', 'maxPrice', 'keywords'],
    urlBuilder: () => '',
  },
  {
    id: 'autotrader',
    name: 'AutoTrader',
    shortName: 'AutoTrader',
    logo: '🚗',
    logoUrl: '',
    brandColor: '#FF6900',
    enabled: false,
    supportedFilters: ['state', 'minPrice', 'maxPrice', 'minYear', 'make', 'model'],
    urlBuilder: () => '',
  },
  {
    id: 'carsdotcom',
    name: 'Cars.com',
    shortName: 'Cars',
    logo: '🏷️',
    logoUrl: '',
    brandColor: '#D7372C',
    enabled: false,
    supportedFilters: ['state', 'minPrice', 'maxPrice', 'minYear', 'make', 'model'],
    urlBuilder: () => '',
  },
]
