export type PlanId = 'free' | 'pro' | 'dealer'

export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'Free',
    price: 0,
    priceLabel: 'Free forever',
    // maxSearches is LIFETIME for Free plan — does not reset
    maxSearches: 1,
    pollingMinutes: 720,               // every 12 hours
    maxRunsPerDay: 6,                  // 2 runs per search per day
    maxRunsPerMonth: 90,               // safety ceiling
    maxItemsPerRun: 10,
    allowedProviders: ['facebook'] as string[],
    emailMode: 'digest_daily' as const,
    aiScoring: false,
    aiFiltering: true,
    aiModel: 'sonnet' as const,
    features: [
      '1 saved search (lifetime)',
      'Facebook Marketplace',
      'Twice daily alerts',
      'Daily email digest',
      '6 runs per day',
    ],
  },
  pro: {
    id: 'pro' as const,
    name: 'Pro',
    price: 49,
    priceLabel: '$49/mo',
    maxSearches: 5,
    pollingMinutes: 240,               // every 4 hours
    maxRunsPerDay: 30,                 // 5 searches × 6 runs/day
    maxRunsPerMonth: 600,              // hard ceiling
    maxItemsPerRun: 15,
    allowedProviders: ['facebook', 'craigslist', 'carsdotcom', 'cargurus', 'offerup'] as string[],
    emailMode: 'instant' as const,
    aiScoring: true,
    aiFiltering: true,
    aiModel: 'sonnet' as const,
    popular: true,
    features: [
      '5 searches',
      'Facebook, Craigslist, Cars.com, CarGurus & OfferUp',
      'Every 4 hours polling',
      'Instant email alerts',
      'AI deal scoring',
      'Condition analysis + red flags',
      '30 runs per day',
    ],
  },
  dealer: {
    id: 'dealer' as const,
    name: 'Dealer',
    price: 149,
    priceLabel: '$149/mo',
    maxSearches: 15,
    pollingMinutes: 120,               // every 2 hours
    maxRunsPerDay: 180,                // 15 searches × 12 runs/day
    maxRunsPerMonth: 3600,             // hard ceiling
    maxItemsPerRun: 20,
    allowedProviders: ['facebook', 'craigslist', 'carsdotcom', 'cargurus', 'offerup'] as string[],
    emailMode: 'instant' as const,
    aiScoring: true,
    aiFiltering: true,
    aiModel: 'sonnet' as const,
    features: [
      '15 searches',
      'Facebook, Craigslist, Cars.com, CarGurus & OfferUp',
      'Every 2 hours polling',
      'Instant email alerts',
      'Advanced AI deal scoring',
      'Full market coverage',
      'Priority scraping queue',
      '180 runs per day',
    ],
  },
} as const

export type Plan = typeof PLANS[PlanId]

export function getPlan(id: string): Plan {
  return PLANS[id as PlanId] ?? PLANS.free
}

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
