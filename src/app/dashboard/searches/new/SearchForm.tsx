'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Clock, Lock } from 'lucide-react'
import { PROVIDERS } from '@/lib/providers'
import { PLANS, type PlanId } from '@/lib/plans'

// ─── Constants ────────────────────────────────────────────────────────────────

const US_STATES = [
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

const CAR_MAKES = [
  'Honda', 'Toyota', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Nissan',
  'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volkswagen', 'Jeep', 'Tesla',
  'Audi', 'Lexus', 'GMC', 'Dodge', 'Ram', 'Chrysler',
]

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(60, 'Name must be 60 characters or less'),
    providers: z.array(z.string()).min(1, 'Select at least one provider'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    minPrice: z.preprocess(
      (v) => (v === '' || v == null || (typeof v === 'number' && isNaN(v)) ? undefined : Number(v)),
      z.number().min(500, 'Min price is $500').max(100000).optional(),
    ),
    maxPrice: z
      .number({ error: 'Price is required' })
      .min(500, 'Minimum price is $500')
      .max(100000, 'Maximum price is $100,000'),
    minYear: z.preprocess(
      (v) => (v === '' || v == null || (typeof v === 'number' && isNaN(v)) ? undefined : Number(v)),
      z.number().min(1900, 'Enter a valid year').max(2026, 'Enter a valid year').optional(),
    ),
    maxMileage: z.preprocess(
      (v) => (v === '' || v == null || (typeof v === 'number' && isNaN(v)) ? undefined : Number(v)),
      z.number().min(1000, 'Enter a valid mileage').max(500000, 'Enter a valid mileage').optional(),
    ),
    make: z.string().optional(),
    model: z.string().optional(),
    keywords: z.string().optional(),
    blacklist: z.string().optional(),
    frequencyMinutes: z.number().int().default(240),
  })
  .refine(
    (data) => !data.minPrice || data.minPrice < data.maxPrice,
    { message: 'Min price must be less than max price', path: ['minPrice'] },
  )

type FormValues = z.infer<typeof formSchema>
type UserPlan = (typeof PLANS)[PlanId]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-400">{message}</p>
}

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
        {number}
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{title}</h2>
    </div>
  )
}

function inputClass(hasError?: boolean) {
  return [
    'w-full rounded-lg border px-3 py-2.5 text-sm bg-zinc-900 text-zinc-100 placeholder:text-zinc-600',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors',
    hasError ? 'border-red-500/60' : 'border-white/10 hover:border-white/20',
  ].join(' ')
}

function prefixInputClass(hasError?: boolean) {
  return [
    'w-full rounded-lg border pl-7 pr-3 py-2.5 text-sm bg-zinc-900 text-zinc-100 placeholder:text-zinc-600',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors',
    hasError ? 'border-red-500/60' : 'border-white/10 hover:border-white/20',
  ].join(' ')
}

function selectClass(hasError?: boolean) {
  return [
    'w-full rounded-lg border px-3 py-2.5 text-sm bg-zinc-900 text-zinc-100',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors',
    hasError ? 'border-red-500/60' : 'border-white/10 hover:border-white/20',
  ].join(' ')
}

// ─── Frequency label map ──────────────────────────────────────────────────────

const FREQ_OPTIONS: { value: number; label: string; locked?: boolean }[] = [
  { value: 15,   label: 'Every 15 minutes', locked: true },
  { value: 30,   label: 'Every 30 minutes', locked: true },
  { value: 60,   label: 'Every hour',        locked: true },
  { value: 120,  label: 'Every 2 hours',     locked: true },
  { value: 240,  label: 'Every 4 hours' },
  { value: 360,  label: 'Every 6 hours' },
  { value: 720,  label: 'Every 12 hours' },
  { value: 1440, label: 'Once a day' },
]

// ─── Main form ────────────────────────────────────────────────────────────────

export function SearchForm({
  allowedProviders,
  userPlan,
}: {
  allowedProviders: readonly string[]
  userPlan: UserPlan
}) {
  const router = useRouter()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      providers: ['facebook'],
      maxPrice: 10000,
      frequencyMinutes: 240,
    },
  })

  const values = watch()

  const fbProvider = PROVIDERS[0]
  const previewUrl = fbProvider.urlBuilder({
    city: values.city || 'your-city',
    state: values.state || '',
    minPrice: values.minPrice,
    maxPrice: values.maxPrice || 0,
    minYear: values.minYear,
    maxMileage: values.maxMileage,
    make: values.make,
    model: values.model,
    keywords: values.keywords,
  })

  async function onSubmit(data: FormValues) {
    setServerError(null)
    try {
      const res = await fetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.error === 'SEARCH_LIMIT_REACHED') {
          setServerError(body.message ?? 'Search limit reached. Upgrade to add more.')
        } else {
          setServerError(body.message ?? body.error ?? 'Something went wrong. Please try again.')
        }
        return
      }
      router.push('/dashboard/searches?created=1')
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  // Label for the preview panel
  const freqLabel = FREQ_OPTIONS.find((o) => o.value === values.frequencyMinutes)?.label ?? 'Every 4 hours'

  return (
    <div className="px-6 py-8 sm:px-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard/searches" className="hover:text-zinc-300 transition-colors">
          Searches
        </Link>
        <span>/</span>
        <span className="text-zinc-300">New Search</span>
      </nav>

      <div className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Create a new search</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We&apos;ll alert you when matching cars appear across your selected marketplaces.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[3fr_2fr] items-start">
        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {serverError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {serverError}{' '}
              {serverError.toLowerCase().includes('limit') && (
                <Link href="/pricing" className="underline hover:text-red-200">Upgrade →</Link>
              )}
            </div>
          )}

          {/* ── Section 1: Basics ── */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
            <SectionHeading number={1} title="Basics" />
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Search name <span className="text-red-400">*</span>
                </label>
                <input {...register('name')} placeholder="Honda Civic under 8k" className={inputClass(!!errors.name)} />
                <FieldError message={errors.name?.message} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Marketplaces <span className="text-red-400">*</span>
                </label>
                <Controller
                  name="providers"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {PROVIDERS.map((provider) => {
                        const isAllowed = allowedProviders.includes(provider.id)
                        const isComingSoon = !provider.enabled
                        const isSelected = field.value.includes(provider.id)

                        // Plan-locked: not allowed on current plan
                        if (!isAllowed) {
                          return (
                            <Link
                              key={provider.id}
                              href="/pricing"
                              className="relative flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-3 opacity-60 transition-colors hover:border-emerald-500/40 hover:opacity-80"
                              title={`Upgrade to Pro to use ${provider.name}`}
                            >
                              <span className="text-xl">{provider.logo}</span>
                              <div className="min-w-0">
                                <span className="block text-xs font-medium leading-tight text-zinc-300">
                                  {provider.name}
                                </span>
                                <span className="text-[10px] text-emerald-400">Pro plan</span>
                              </div>
                              <span className="absolute right-1.5 top-1.5 text-zinc-500">
                                <Lock size={11} />
                              </span>
                            </Link>
                          )
                        }

                        // Coming soon (allowed by plan but not yet built)
                        if (isComingSoon) {
                          return (
                            <div
                              key={provider.id}
                              className="relative flex cursor-not-allowed items-center gap-3 rounded-lg border border-white/10 p-3 opacity-50"
                            >
                              <span className="text-xl">{provider.logo}</span>
                              <span className="text-xs font-medium leading-tight text-zinc-200">
                                {provider.name}
                              </span>
                              <span className="absolute right-1.5 top-1.5 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                                Soon
                              </span>
                            </div>
                          )
                        }

                        // Normal: allowed and enabled
                        return (
                          <label
                            key={provider.id}
                            className={[
                              'relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors select-none',
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/5',
                            ].join(' ')}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, provider.id])
                                } else {
                                  field.onChange(field.value.filter((id) => id !== provider.id))
                                }
                              }}
                              className="sr-only"
                            />
                            <span className="text-xl">{provider.logo}</span>
                            <span className="text-xs font-medium leading-tight text-zinc-200">
                              {provider.name}
                            </span>
                            {isSelected && (
                              <span className="absolute right-2 top-2">
                                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-emerald-400">
                                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}
                />
                <FieldError message={errors.providers?.message} />
              </div>

              {/* ── Polling frequency (visible in Basics) ── */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">
                  <Clock size={14} className="mr-1.5 inline-block align-text-bottom" />
                  Polling frequency
                </label>
                <select
                  {...register('frequencyMinutes', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {FREQ_OPTIONS.map(({ value, label, locked }) => (
                    <option key={value} value={value} disabled={locked}>
                      {label}{locked ? ' 🔒' : ''}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.frequencyMinutes?.message} />
                <p className="mt-1.5 text-xs text-zinc-500">
                  How often DealScout checks your selected marketplaces for new listings.{' '}
                  {userPlan.id === 'free' && (
                    <Link href="/pricing" className="text-emerald-400 hover:underline">
                      Upgrade for faster polling →
                    </Link>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 2: Location ── */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
            <SectionHeading number={2} title="Location" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  City <span className="text-red-400">*</span>
                </label>
                <input {...register('city')} placeholder="Los Angeles" className={inputClass(!!errors.city)} />
                <FieldError message={errors.city?.message} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  State <span className="text-red-400">*</span>
                </label>
                <select {...register('state')} className={selectClass(!!errors.state)}>
                  <option value="">Select a state…</option>
                  {US_STATES.map(([abbr, name]) => (
                    <option key={abbr} value={abbr}>{name}</option>
                  ))}
                </select>
                <FieldError message={errors.state?.message} />
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-600">We&apos;ll search this city and surrounding area</p>
          </div>

          {/* ── Section 3: Price & Vehicle ── */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
            <SectionHeading number={3} title="Price &amp; Vehicle" />
            <div className="space-y-5">
              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                      Min Price <span className="text-zinc-600 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500">$</span>
                      <input {...register('minPrice', { valueAsNumber: true })} type="number" placeholder="500" min={500} max={100000} step={500} className={prefixInputClass(!!errors.minPrice)} />
                    </div>
                    <FieldError message={errors.minPrice?.message} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                      Max Price <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500">$</span>
                      <input {...register('maxPrice', { valueAsNumber: true })} type="number" placeholder="10000" min={500} max={100000} step={500} className={prefixInputClass(!!errors.maxPrice)} />
                    </div>
                    <FieldError message={errors.maxPrice?.message} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-600">Listings between these prices will be matched</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                    Min Year <span className="text-zinc-600 font-normal">(optional)</span>
                  </label>
                  <input {...register('minYear', { valueAsNumber: true })} type="number" placeholder="2010" min={1900} max={2026} className={inputClass(!!errors.minYear)} />
                  <FieldError message={errors.minYear?.message} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                    Max Mileage <span className="text-zinc-600 font-normal">(optional)</span>
                  </label>
                  <input {...register('maxMileage', { valueAsNumber: true })} type="number" placeholder="150000" min={1000} max={500000} className={inputClass(!!errors.maxMileage)} />
                  <p className="mt-1 text-xs text-zinc-600">Excludes high-mileage cars from results</p>
                  <FieldError message={errors.maxMileage?.message} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                    Make <span className="text-zinc-600 font-normal">(optional)</span>
                  </label>
                  <input {...register('make')} list="car-makes" placeholder="Honda" className={inputClass(!!errors.make)} />
                  <datalist id="car-makes">
                    {CAR_MAKES.map((make) => <option key={make} value={make} />)}
                  </datalist>
                  <FieldError message={errors.make?.message} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                    Model <span className="text-zinc-600 font-normal">(optional)</span>
                  </label>
                  <input {...register('model')} placeholder="Civic" className={inputClass(!!errors.model)} />
                  <FieldError message={errors.model?.message} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 4: Advanced ── */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-zinc-400 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300">4</span>
                <span className="uppercase tracking-widest">Advanced</span>
              </div>
              <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="space-y-4 px-6 pb-6 pt-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Keywords</label>
                  <input {...register('keywords')} placeholder="must-have words, comma-separated" className={inputClass()} />
                  <p className="mt-1 text-xs text-zinc-600">Only show listings that mention these words</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Blacklist</label>
                  <input {...register('blacklist')} placeholder="exclude these words: motorcycle, boat, parts" className={inputClass()} />
                  <p className="mt-1 text-xs text-zinc-600">Hide listings that mention these words</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <Link href="/dashboard/searches" className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:border-white/20 hover:text-zinc-200 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating…' : 'Create Search'}
            </button>
          </div>
        </form>

        {/* ── Right: Live Preview ── */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Preview</p>

            <h2 className="mt-3 min-h-[1.75rem] text-xl font-semibold text-white">
              {values.name ? values.name : <span className="italic text-zinc-600">Search name…</span>}
            </h2>

            {(values.providers?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {values.providers.map((id) => {
                  const p = PROVIDERS.find((pr) => pr.id === id)
                  if (!p) return null
                  return (
                    <span key={id} className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                      {p.logo} {p.name}
                    </span>
                  )
                })}
              </div>
            )}

            <div className="mt-4 space-y-1">
              {(values.city || values.state) && (
                <p className="text-sm text-zinc-400">
                  <span className="text-zinc-600">Looking in: </span>
                  <span className="text-zinc-200">{[values.city, values.state].filter(Boolean).join(', ')}</span>
                </p>
              )}
              {values.maxPrice != null && (
                <p className="text-sm text-zinc-400">
                  <span className="text-zinc-600">{values.minPrice ? 'Price: ' : 'Up to: '}</span>
                  <span className="text-zinc-200">
                    {values.minPrice
                      ? `$${values.minPrice.toLocaleString()} – $${values.maxPrice.toLocaleString()}`
                      : `$${values.maxPrice.toLocaleString()}`}
                  </span>
                </p>
              )}
              {(values.minYear || values.maxMileage || values.make || values.model) && (
                <p className="text-sm text-zinc-400">
                  <span className="text-zinc-600">Vehicle: </span>
                  <span className="text-zinc-200">
                    {[
                      values.minYear ? `${values.minYear}+` : null,
                      values.maxMileage ? `under ${values.maxMileage.toLocaleString()}mi` : null,
                      values.make || null,
                      values.model || null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </p>
              )}
              {values.frequencyMinutes != null && (
                <p className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Clock size={13} className="shrink-0 text-zinc-600" />
                  <span className="text-zinc-200">{freqLabel}</span>
                </p>
              )}
            </div>

            {values.providers?.includes('facebook') && (
              <div className="mt-5">
                <p className="mb-1.5 text-xs text-zinc-600">Facebook Marketplace URL</p>
                <code className="block break-all rounded-lg bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
                  {previewUrl}
                </code>
              </div>
            )}

            <div className="mt-5 rounded-lg border border-white/5 bg-black/30 p-4 opacity-40">
              <div className="flex gap-3">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-800" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-2.5 w-3/4 rounded-full bg-zinc-700" />
                  <div className="h-2.5 w-1/2 rounded-full bg-zinc-700" />
                  <div className="h-2 w-1/4 rounded-full bg-zinc-800" />
                </div>
              </div>
                <p className="mt-3 text-center text-xs text-zinc-600">Your matching deals will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
