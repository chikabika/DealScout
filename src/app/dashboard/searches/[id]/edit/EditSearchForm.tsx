'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Clock } from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/plans'
import { ProviderPill } from '../../SearchCard'
import {
  US_STATES,
  CAR_MAKES,
  FREQ_OPTIONS,
  planOrder,
  FieldError,
  SectionHeading,
  inputClass,
  prefixInputClass,
  selectClass,
} from '../../new/form-helpers'

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(60, 'Name must be 60 characters or less'),
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
    zipCode: z.string().regex(/^\d{5}$/, 'ZIP must be 5 digits').optional().or(z.literal('')).transform((v) => v || null),
    radiusMiles: z.number().int().min(10).max(500).default(50),
    frequencyMinutes: z.number().int().default(240),
  })
  .refine(
    (data) => !data.minPrice || data.minPrice < data.maxPrice,
    { message: 'Min price must be less than max price', path: ['minPrice'] },
  )

type FormValues = z.infer<typeof formSchema>
type UserPlan = (typeof PLANS)[PlanId]

export type EditableSearch = {
  id: string
  name: string
  providers: string[]
  city: string
  state: string
  minPrice: number | null
  maxPrice: number
  minYear: number | null
  maxMileage: number | null
  make: string | null
  model: string | null
  keywords: string | null
  blacklist: string | null
  zipCode: string | null
  radiusMiles: number | null
  frequencyMinutes: number
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function EditSearchForm({
  search,
  userPlan,
}: {
  search: EditableSearch
  allowedProviders: readonly string[]
  userPlan: UserPlan
}) {
  const router = useRouter()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: search.name,
      city: search.city,
      state: search.state,
      minPrice: search.minPrice ?? undefined,
      maxPrice: search.maxPrice,
      minYear: search.minYear ?? undefined,
      maxMileage: search.maxMileage ?? undefined,
      make: search.make ?? '',
      model: search.model ?? '',
      keywords: search.keywords ?? '',
      blacklist: search.blacklist ?? '',
      zipCode: search.zipCode ?? '',
      radiusMiles: search.radiusMiles ?? 50,
      frequencyMinutes: search.frequencyMinutes,
    },
  })

  async function onSubmit(data: FormValues) {
    setServerError(null)
    try {
      const res = await fetch(`/api/searches/${search.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setServerError(body.message ?? body.error ?? 'Something went wrong. Please try again.')
        return
      }
      router.push('/dashboard/searches')
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {serverError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {serverError}
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
                Marketplace
              </label>
              <div className="flex flex-wrap gap-1.5">
                {search.providers.map((pid) => (
                  <ProviderPill key={pid} providerId={pid} />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">Provider cannot be changed after creation.</p>
            </div>

            {/* ── Polling frequency ── */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200">
                <Clock size={14} className="mr-1.5 inline-block align-text-bottom" />
                Polling frequency
              </label>
              <select
                {...register('frequencyMinutes', { valueAsNumber: true })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {FREQ_OPTIONS.map((opt) => {
                  const locked = planOrder.indexOf(userPlan.id) < planOrder.indexOf(opt.minPlan)
                  return (
                    <option key={opt.value} value={opt.value} disabled={locked}>
                      {opt.label}{locked ? ' 🔒' : ''}
                    </option>
                  )
                })}
              </select>
              <FieldError message={errors.frequencyMinutes?.message} />
              <p className="mt-1.5 text-xs text-zinc-500">
                How often CarDealAlerts checks your selected marketplaces for new listings.{' '}
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

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                ZIP Code
                <span className="text-zinc-500 font-normal ml-1">(optional)</span>
              </label>
              <input
                {...register('zipCode')}
                placeholder="90001"
                maxLength={5}
                className={inputClass(!!errors.zipCode)}
              />
              <p className="text-xs text-zinc-500 mt-1">Used for Cars.com dealer search radius</p>
              <FieldError message={errors.zipCode?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                Search radius
              </label>
              <select
                {...register('radiusMiles', { valueAsNumber: true })}
                className={selectClass()}
              >
                <option value={10}>10 miles</option>
                <option value={20}>20 miles</option>
                <option value={30}>30 miles</option>
                <option value={40}>40 miles</option>
                <option value={50}>50 miles</option>
                <option value={75}>75 miles</option>
                <option value={100}>100 miles</option>
                <option value={150}>150 miles</option>
                <option value={200}>200 miles</option>
                <option value={500}>500 miles (nationwide)</option>
              </select>
              <p className="text-xs text-zinc-500 mt-1">Applies to Cars.com dealer results</p>
            </div>
          </div>
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
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
