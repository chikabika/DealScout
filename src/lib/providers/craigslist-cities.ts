/**
 * Map common user-input city names to Craigslist subdomain slugs.
 * Keys are lowercase with spaces/punctuation removed; values are the actual subdomain.
 *
 * Usage:
 *   import { resolveCraigslistSubdomain } from '@/lib/providers/craigslist-cities'
 *   const sub = resolveCraigslistSubdomain('Los Angeles') // → 'losangeles'
 */
export const CRAIGSLIST_CITY_MAP: Record<string, string> = {
  // New York
  newyork:        'newyork',
  newyorkcity:    'newyork',
  nyc:            'newyork',
  // Los Angeles
  losangeles:     'losangeles',
  la:             'losangeles',
  // Chicago
  chicago:        'chicago',
  // Houston
  houston:        'houston',
  // Phoenix / Mesa
  phoenix:        'phoenix',
  mesa:           'phoenix',
  // Philadelphia
  philadelphia:   'philadelphia',
  philly:         'philadelphia',
  // San Antonio
  sanantonio:     'sanantonio',
  // San Diego
  sandiego:       'sandiego',
  // Dallas / Fort Worth / Arlington
  dallas:         'dallas',
  fortworth:      'dallas',
  arlington:      'dallas',
  // San Jose (covered by SF Bay)
  sanjose:        'sfbay',
  // Austin
  austin:         'austin',
  // Jacksonville
  jacksonville:   'jacksonville',
  // Columbus
  columbus:       'columbus',
  // Indianapolis
  indianapolis:   'indianapolis',
  // Charlotte
  charlotte:      'charlotte',
  // San Francisco / Oakland (all Bay Area)
  sanfrancisco:   'sfbay',
  sf:             'sfbay',
  oakland:        'sfbay',
  // Seattle
  seattle:        'seattle',
  // Denver
  denver:         'denver',
  // Washington DC
  washingtondc:   'washingtondc',
  washington:     'washingtondc',
  dc:             'washingtondc',
  // Boston
  boston:         'boston',
  // El Paso
  elpaso:         'elpaso',
  // Nashville
  nashville:      'nashville',
  // Detroit
  detroit:        'detroit',
  // Oklahoma City
  oklahomacity:   'oklahomacity',
  // Portland
  portland:       'portland',
  // Las Vegas
  lasvegas:       'lasvegas',
  // Memphis
  memphis:        'memphis',
  // Louisville
  louisville:     'louisville',
  // Baltimore
  baltimore:      'baltimore',
  // Milwaukee
  milwaukee:      'milwaukee',
  // Albuquerque
  albuquerque:    'albuquerque',
  // Tucson
  tucson:         'tucson',
  // Fresno
  fresno:         'fresno',
  // Sacramento
  sacramento:     'sacramento',
  // Kansas City
  kansascity:     'kansascity',
  // Atlanta
  atlanta:        'atlanta',
  // Omaha
  omaha:          'omaha',
  // Raleigh
  raleigh:        'raleigh',
  // Miami
  miami:          'miami',
  // Minneapolis / St Paul
  minneapolis:    'minneapolis',
  stpaul:         'minneapolis',
  // Tulsa
  tulsa:          'tulsa',
  // Wichita
  wichita:        'wichita',
  // New Orleans
  neworleans:     'neworleans',
  // Cleveland
  cleveland:      'cleveland',
  // Bakersfield
  bakersfield:    'bakersfield',
  // Tampa
  tampa:          'tampa',
  // Honolulu
  honolulu:       'honolulu',
  // Anaheim (Orange County)
  anaheim:        'orangecounty',
  orangecounty:   'orangecounty',
  // Pittsburgh
  pittsburgh:     'pittsburgh',
  // St Louis
  stlouis:        'stlouis',
  // Cincinnati
  cincinnati:     'cincinnati',
  // Stockton
  stockton:       'stockton',
  // Buffalo
  buffalo:        'buffalo',
  // Richmond
  richmond:       'richmond',
  // Spokane
  spokane:        'spokane',
  // Reno
  reno:           'reno',
}

/**
 * Resolve a user-input city name to a Craigslist subdomain slug.
 *
 * Normalises by lowercasing and stripping spaces, hyphens, underscores,
 * commas, and periods before looking up in CRAIGSLIST_CITY_MAP.
 *
 * Returns `null` if the city is unknown — the caller should treat that as
 * "Craigslist not available for this search" and skip it gracefully.
 */
export function resolveCraigslistSubdomain(city: string): string | null {
  if (!city) return null
  const key = city.toLowerCase().replace(/[\s\-_,.]+/g, '')
  return CRAIGSLIST_CITY_MAP[key] ?? null
}
