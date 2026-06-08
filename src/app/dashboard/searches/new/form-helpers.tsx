// ─── Constants ────────────────────────────────────────────────────────────────

export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
] as const

export const CAR_MAKES = [
  'Honda', 'Toyota', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Nissan',
  'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volkswagen', 'Jeep', 'Tesla',
  'Audi', 'Lexus', 'GMC', 'Dodge', 'Ram', 'Chrysler',
]

// ─── Frequency options — locked based on plan minimum ────────────────────────

export const FREQ_OPTIONS = [
  { value: 120,  label: 'Every 2 hours',  minPlan: 'dealer' },
  { value: 240,  label: 'Every 4 hours',  minPlan: 'pro' },
  { value: 360,  label: 'Every 6 hours',  minPlan: 'pro' },
  { value: 720,  label: 'Every 12 hours', minPlan: 'free' },
  { value: 1440, label: 'Once a day',     minPlan: 'free' },
]

export const planOrder = ['free', 'pro', 'dealer']

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-400">{message}</p>
}

export function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
        {number}
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{title}</h2>
    </div>
  )
}

export function inputClass(hasError?: boolean) {
  return [
    'w-full rounded-lg border px-3 py-2.5 text-sm bg-zinc-900 text-zinc-100 placeholder:text-zinc-600',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors',
    hasError ? 'border-red-500/60' : 'border-white/10 hover:border-white/20',
  ].join(' ')
}

export function prefixInputClass(hasError?: boolean) {
  return [
    'w-full rounded-lg border pl-7 pr-3 py-2.5 text-sm bg-zinc-900 text-zinc-100 placeholder:text-zinc-600',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors',
    hasError ? 'border-red-500/60' : 'border-white/10 hover:border-white/20',
  ].join(' ')
}

export function selectClass(hasError?: boolean) {
  return [
    'w-full rounded-lg border px-3 py-2.5 text-sm bg-zinc-900 text-zinc-100',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors',
    hasError ? 'border-red-500/60' : 'border-white/10 hover:border-white/20',
  ].join(' ')
}
