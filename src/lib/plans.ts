export type PlanId = 'free' | 'pro' | 'dealer'

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free forever',
    maxSearches: 3,
    pollingMinutes: 240,           // every 4 hours
    minFrequencyMinutes: 240,
    allowedFrequencies: [240, 360, 720, 1440],
    allowedProviders: ['facebook'],
    maxScrapesPerMonth: 360,       // 3 searches × 6 polls/day × 30 days
    maxItemsPerRun: 30,            // listings fetched per Apify run
    maxAiCallsPerMonth: 0,         // no AI deal scoring on Free
    emailMode: 'digest_daily',
    features: [
      'Up to 3 searches',
      'Facebook Marketplace only',
      'Every 4 hours polling',
      'Daily email digest',
      '30 listings scanned per run',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceLabel: '$49/mo',
    maxSearches: 15,
    pollingMinutes: 30,            // every 30 minutes
    minFrequencyMinutes: 30,
    allowedFrequencies: [30, 60, 120, 240, 360, 720, 1440],
    allowedProviders: ['facebook', 'craigslist'],
    maxScrapesPerMonth: 25000,
    maxItemsPerRun: 75,            // listings fetched per Apify run
    maxAiCallsPerMonth: 10000,     // ~$50/mo max Bedrock cost at Sonnet pricing
    emailMode: 'instant',
    popular: true,
    features: [
      'Up to 15 searches',
      'Facebook + Craigslist',
      '30-minute polling',
      'Instant email alerts',
      '75 listings scanned per run',
      '🔥 AI Deal Scoring on every listing',
      '🔥 Market value estimates',
      '🔥 Condition + red flag analysis',
    ],
  },
  dealer: {
    id: 'dealer',
    name: 'Dealer',
    price: 149,
    priceLabel: '$149/mo',
    maxSearches: 50,
    pollingMinutes: 15,            // every 15 minutes
    minFrequencyMinutes: 15,
    allowedFrequencies: [15, 30, 60, 120, 240, 360, 720, 1440],
    allowedProviders: ['facebook', 'craigslist'],
    maxScrapesPerMonth: 100000,
    maxItemsPerRun: 100,           // listings fetched per Apify run
    maxAiCallsPerMonth: 50000,
    emailMode: 'instant',
    features: [
      'Up to 50 searches',
      'Facebook + Craigslist',
      '15-minute polling',
      'Instant email alerts',
      '100 listings scanned per run',
      '🔥 AI Deal Scoring on every listing',
      '🔥 Market value estimates',
      '🔥 Condition + red flag analysis',
      '🔥 Profit potential ranking',
      'API access',
      'Priority support',
    ],
  },
} as const

export const FREQUENCY_LABELS: Record<number, string> = {
  15: 'Every 15 minutes',
  30: 'Every 30 minutes',
  60: 'Every hour',
  120: 'Every 2 hours',
  240: 'Every 4 hours',
  360: 'Every 6 hours',
  720: 'Every 12 hours',
  1440: 'Once a day',
}

export function getPlan(id: string) {
  return PLANS[id as PlanId] ?? PLANS.free
}
