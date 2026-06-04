'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  LayoutGrid,
  List,
  Lock,
  MapPin,
  MinusCircle,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react'
import { getProvider } from '@/lib/providers'
import type { LastRunStats } from '@/lib/schema'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RunStats = {
  searchId: string
  searchName: string
  city: string
  minPrice: number | null
  maxPrice: number
  lastRunAt: string | null
  stats: LastRunStats | null
}

export type DealRow = {
  id: string
  title: string
  price: number
  location: string | null
  url: string
  image: string | null
  provider: string
  seenAtMs: number
  searchName: string
  searchId: string
  // AI deal scoring (null = unscored or Free plan)
  dealScore: number | null
  estimatedValue: number | null
  savings: number | null
  conditionRating: string | null
  conditionNotes: string[] | null
  redFlags: string[] | null
  aiSummary: string | null
}

type SortKey = 'newest' | 'cheapest' | 'dealScore'
type ViewMode = 'grid' | 'list'
type RecencyKey = '6h' | '24h' | '3d' | '7d' | 'all'

const VIEW_MODE_KEY = 'cardealalerts:viewMode'
const RECENCY_KEY = 'cardealalerts:recency'
const ONE_DAY_MS = 86_400_000

const RECENCY_CUTOFFS: Record<RecencyKey, number> = {
  '6h': 6 * 3_600_000,
  '24h': 86_400_000,
  '3d': 3 * 86_400_000,
  '7d': 7 * 86_400_000,
  'all': Infinity,
}

const RECENCY_LABELS: Record<RecencyKey, string> = {
  '6h': 'Last 6 hours',
  '24h': 'Last 24 hours',
  '3d': 'Last 3 days',
  '7d': 'Last 7 days',
  'all': 'All time',
}

const RECENCY_CHIP_LABELS: Record<RecencyKey, string> = {
  '6h': 'Last 6h',
  '24h': 'Last 24h',
  '3d': 'Last 3d',
  '7d': 'Last 7d',
  'all': 'All time',
}

function getStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'grid'
  try {
    const savedMode = window.localStorage.getItem(VIEW_MODE_KEY)
    return savedMode === 'grid' || savedMode === 'list' ? savedMode : 'grid'
  } catch {
    return 'grid'
  }
}

function getStoredRecency(): RecencyKey {
  if (typeof window === 'undefined') return '24h'
  try {
    const savedRecency = window.localStorage.getItem(RECENCY_KEY)
    return savedRecency && savedRecency in RECENCY_CUTOFFS ? savedRecency as RecencyKey : '24h'
  } catch {
    return '24h'
  }
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function CarFallback({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-8 w-8' : 'h-12 w-12'
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-800">
      <svg viewBox="0 0 48 48" fill="none" className={`${cls} text-zinc-600`} aria-hidden="true">
        <path d="M8 34 L12 22 L20 18 L28 18 L36 22 L40 34 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M17 18 L20 12 L28 12 L31 18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="16" cy="35" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="35" r="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  )
}

function ProviderBadge({ providerId }: { providerId: string }) {
  const p = getProvider(providerId)
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 shadow-sm backdrop-blur-sm">
      {p.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.logoUrl}
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 rounded-sm object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-[10px] leading-none">{p.logo}</span>
      )}
      <span className="text-[11px] font-semibold" style={{ color: p.brandColor }}>
        {p.shortName}
      </span>
    </div>
  )
}

function ProviderPill({ providerId }: { providerId: string }) {
  const p = getProvider(providerId)
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${p.brandColor}22`, color: p.brandColor }}
    >
      {p.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.logoUrl}
          alt=""
          width={12}
          height={12}
          className="h-3 w-3 object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{p.logo}</span>
      )}
      {p.shortName}
    </div>
  )
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function NoDealsYet() {
  return (
    <div className="mt-20 flex flex-col items-center text-center">
      <svg viewBox="0 0 120 120" fill="none" className="w-32" aria-hidden="true">
        <circle cx="42" cy="48" r="22" stroke="#3f3f46" strokeWidth="5" />
        <circle cx="42" cy="48" r="12" stroke="#52525b" strokeWidth="4" />
        <circle cx="42" cy="48" r="4" fill="#52525b" />
        <rect x="60" y="44" width="38" height="8" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
        <rect x="68" y="52" width="5" height="9" rx="2" fill="#3f3f46" />
        <rect x="79" y="52" width="5" height="12" rx="2" fill="#3f3f46" />
        <rect x="90" y="52" width="5" height="7" rx="2" fill="#3f3f46" />
        <line x1="25" y1="72" x2="14" y2="84" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
        <circle cx="42" cy="48" r="22" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.6" />
      </svg>
      <h2 className="mt-8 text-2xl font-semibold text-white">No deals yet</h2>
      <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-400">
        Run a search to start finding deals. We&apos;ll scan Facebook Marketplace and collect matching
        listings here.
      </p>
      <Link
        href="/dashboard/searches"
        className="mt-8 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:bg-emerald-500"
      >
        Go to searches
      </Link>
    </div>
  )
}

// ─── No-results diagnostic ────────────────────────────────────────────────────

type FilterStep = {
  label: string
  count: number
  prev: number
}

function StepIcon({ count, prev }: { count: number; prev: number }) {
  if (prev === 0) {
    return <MinusCircle size={15} className="text-zinc-600" />
  }
  if (count === 0) {
    return <XCircle size={15} className="text-red-500" />
  }
  if (count < prev) {
    return <MinusCircle size={15} className="text-amber-400" />
  }
  return <CheckCircle2 size={15} className="text-emerald-500" />
}

function NoResultsDiagnostic({ runStats }: { runStats: RunStats }) {
  const [running, setRunning] = useState(false)

  async function handleRerun() {
    setRunning(true)
    try {
      await fetch(`/api/cron/collect?searchId=${encodeURIComponent(runStats.searchId)}`)
    } finally {
      setRunning(false)
      // Reload the page so fresh listings appear
      window.location.reload()
    }
  }

  const s = runStats.stats

  // If the search has never been run show a friendlier nudge
  if (!s) {
    return (
      <div className="mt-20 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
          <Search size={22} className="text-zinc-500" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-white">This search hasn&apos;t run yet</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-400">
          Hit the ⚡ button on your search card or wait for the next scheduled poll.
        </p>
        <Link
          href="/dashboard/searches"
          className="mt-6 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-white/20 hover:bg-white/5"
        >
          Go to searches
        </Link>
      </div>
    )
  }

  // Build filter pipeline steps
  const steps: FilterStep[] = [
    { label: 'Fetched from marketplace', count: s.apifyReturned,    prev: s.maxItems },
    { label: 'Active / not sold',        count: s.afterSoldLive,     prev: s.apifyReturned },
    { label: 'Price range',              count: s.afterPrice,        prev: s.afterSoldLive },
    { label: 'Location match',           count: s.afterLocation,     prev: s.afterPrice },
    { label: 'Junk keyword filter',      count: s.afterJunk,         prev: s.afterLocation },
    { label: 'Blacklist filter',         count: s.afterBlacklist,    prev: s.afterJunk },
    { label: 'AI car classifier',        count: s.afterClassifier,   prev: s.afterBlacklist },
    { label: 'New (not seen before)',    count: s.newlyInserted,     prev: s.afterClassifier },
  ]

  // Find first killer step
  const killerStep = steps.find((step) => step.prev > 0 && step.count === 0)

  // Build contextual suggestion
  let suggestion = 'Try widening your search filters or run again later when new listings appear.'
  if (!killerStep || s.apifyReturned === 0) {
    suggestion = 'The marketplace returned no results. The scraper may be temporarily throttled — try again in a few minutes.'
  } else if (killerStep.label === 'Active / not sold') {
    suggestion = 'All listings were already sold or marked inactive. The market is moving fast — try running more frequently.'
  } else if (killerStep.label === 'Price range') {
    const range = s.priceRangeUsed
    const sample = s.pricesReturned.slice(0, 5)
    const sampleText = sample.length
      ? `Prices seen: ${sample.map((p) => `$${p.toLocaleString()}`).join(', ')}.`
      : ''
    suggestion = `No listings fell within $${range.min.toLocaleString()}–$${range.max.toLocaleString()}. ${sampleText} Consider adjusting your price range.`
  } else if (killerStep.label === 'Location match') {
    const locs = s.locationsReturned.slice(0, 4)
    const locsText = locs.length ? ` Listings were in: ${locs.join(', ')}.` : ''
    suggestion = `No listings matched "${runStats.city}".${locsText} Try a neighbouring city or check the spelling.`
  } else if (killerStep.label === 'Junk keyword filter') {
    suggestion = 'All listings matched junk keywords (parts, salvage, etc.). The marketplace may be flooded with non-whole-car listings right now.'
  } else if (killerStep.label === 'Blacklist filter') {
    suggestion = 'Every listing was blocked by your blacklist. Review your blocked keywords in the search editor.'
  } else if (killerStep.label === 'AI car classifier') {
    suggestion = 'The AI classifier removed all listings as non-car vehicles (motorcycles, boats, ATVs, etc.). If your search targets trucks or vans, the classifier may be overly strict — reach out if this persists.'
  } else if (killerStep.label === 'New (not seen before)') {
    suggestion = 'Every matching listing was already in your database. Check back later — new listings will appear on the next poll.'
  }

  const ranAt = s.ranAt
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((new Date(s.ranAt).getTime() - new Date().getTime()) / 60000),
        'minute',
      )
    : null

  return (
    <div className="mt-12 flex flex-col items-center">
      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-zinc-900 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <Search size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Search ran — all listings filtered</h2>
            {ranAt && <p className="text-xs text-zinc-500">Last run {ranAt}</p>}
          </div>
        </div>

        {/* Filter pipeline */}
        <div className="mt-5 divide-y divide-white/5 rounded-lg border border-white/5 bg-black/30">
          {steps.map((step) => {
            const isKiller = step === killerStep
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 px-4 py-2.5 ${isKiller ? 'bg-red-500/5' : ''}`}
              >
                <StepIcon count={step.count} prev={step.prev} />
                <span className={`flex-1 text-sm ${isKiller ? 'font-medium text-red-300' : 'text-zinc-300'}`}>
                  {step.label}
                </span>
                <span className={`tabular-nums text-sm ${step.count === 0 && step.prev > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                  {step.prev === 0 ? '—' : `${step.count} / ${step.prev}`}
                </span>
              </div>
            )
          })}
        </div>

        {/* Suggestion */}
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-amber-200">
          {suggestion}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={`/dashboard/searches/${runStats.searchId}/edit`}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-white/20 hover:bg-white/5"
          >
            Edit search filters
          </Link>
          <button
            onClick={handleRerun}
            disabled={running}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M12 3a9 9 0 1 0 9 9" />
              </svg>
            ) : (
              <span>⚡</span>
            )}
            {running ? 'Running…' : 'Re-run now'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NoFilterResults({
  onClear,
  onShowAll,
  recencyWindow,
}: {
  onClear: () => void
  onShowAll?: () => void
  recencyWindow?: string
}) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
        <Search size={22} className="text-zinc-600" />
      </div>
      <h3 className="mt-4 text-base font-medium text-zinc-200">No deals match your filters</h3>
      <p className="mt-1 text-sm text-zinc-500">
        {recencyWindow
          ? `No deals found in the ${recencyWindow.toLowerCase()}. Try widening the time window or run your search now.`
          : 'Try adjusting your search or removing some filters.'}
      </p>
      {onShowAll ? (
        <button
          onClick={onShowAll}
          className="mt-5 rounded-lg border border-emerald-500/50 px-5 py-2 text-sm font-medium text-emerald-400 transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-500/10"
        >
          Show all
        </button>
      ) : (
        <button
          onClick={onClear}
          className="mt-5 rounded-lg border border-emerald-500/50 px-5 py-2 text-sm font-medium text-emerald-400 transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-500/10"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-zinc-800 py-1 pl-3 pr-1.5 text-xs text-zinc-300">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
        aria-label={`Remove filter: ${label}`}
      >
        <X size={11} />
      </button>
    </div>
  )
}

// ─── Recency tooltip ──────────────────────────────────────────────────────────

function RecencyTooltip() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-zinc-600 transition-colors hover:text-zinc-400"
        aria-label="About recency filter"
      >
        <Info size={13} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs leading-relaxed text-zinc-300 shadow-xl">
          We can&apos;t see Facebook&apos;s exact post time, so we filter by when we first found the listing.
          Polling every hour means a listing posted 30 minutes ago will appear in &apos;Last 6 hours&apos;.
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
        </div>
      )}
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ rows }: { rows: DealRow[] }) {
  if (rows.length === 0) return null
  const prices = rows.map((r) => r.price).filter((p) => p > 0)
  const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
  const min = prices.length ? Math.min(...prices) : 0
  const stats = [
    { label: 'Total', value: `${rows.length} listing${rows.length === 1 ? '' : 's'}` },
    { label: 'Avg price', value: avg > 0 ? `$${avg.toLocaleString()}` : '—' },
    { label: 'Cheapest', value: min > 0 ? `$${min.toLocaleString()}` : '—' },
  ]
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {stats.map(({ label, value }) => (
        <div key={label} className="rounded-lg border border-white/5 bg-zinc-900 px-4 py-2.5">
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="mt-0.5 text-sm font-medium text-zinc-100">{value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Deal score badge ─────────────────────────────────────────────────────────

function DealScoreBadge({
  dealScore,
  savings,
  userPlan,
  compact = false,
}: {
  dealScore: number | null
  savings: number | null
  userPlan: 'free' | 'pro' | 'dealer'
  compact?: boolean
}) {
  // Free users: blurred locked placeholder with upgrade CTA
  if (userPlan === 'free') {
    return (
      <a
        href="/pricing"
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800/90 px-2 py-1 text-[11px] font-medium text-zinc-400 transition hover:bg-zinc-700/90 hover:text-zinc-200"
        title="Unlock AI Deal Scoring with Pro"
      >
        <Lock className="h-3 w-3 shrink-0" />
        <span className="select-none blur-[2.5px]">87</span>
        <span className="ml-0.5 text-emerald-400">Pro</span>
      </a>
    )
  }

  // Pro/Dealer — not yet scored
  if (dealScore == null) {
    return (
      <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-[11px] text-zinc-500">
        Analyzing…
      </span>
    )
  }

  // Colour tiers
  const tone =
    dealScore >= 80
      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
      : dealScore >= 60
        ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
        : 'bg-zinc-700/40 text-zinc-400 ring-1 ring-zinc-600/30'

  const emoji = dealScore >= 80 ? '🔥' : dealScore >= 60 ? '👍' : ''

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
        {dealScore} {emoji}
      </span>
    )
  }

  return (
    <div className={`inline-flex flex-col items-end gap-0.5 rounded-md px-2.5 py-1.5 ${tone}`}>
      <span className="text-sm font-bold leading-none">{dealScore}/100 {emoji}</span>
      {savings != null && savings > 0 && (
        <span className="flex items-center gap-0.5 text-[10px]">
          <TrendingDown className="h-2.5 w-2.5" />
          Save ${savings.toLocaleString()}
        </span>
      )}
      {savings != null && savings < -500 && (
        <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
          <TrendingUp className="h-2.5 w-2.5" />
          ${Math.abs(savings).toLocaleString()} over
        </span>
      )}
    </div>
  )
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function DealCard({
  title,
  price,
  location,
  url,
  image,
  provider,
  seenAtMs,
  searchName,
  dealScore,
  savings,
  redFlags,
  aiSummary,
  nowMs,
  userPlan,
}: DealRow & { nowMs: number; userPlan: 'free' | 'pro' | 'dealer' }) {
  const timeAgo = formatDistanceToNow(new Date(seenAtMs), { addSuffix: true })
  const isNew = nowMs - seenAtMs < ONE_DAY_MS
  const p = getProvider(provider)

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900 transition-all duration-200 hover:border-white/20 hover:ring-2 hover:ring-emerald-500/20">
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              // Facebook CDN URLs refuse requests without this — Cloudinary URLs
              // don't need it, but it's harmless to keep for any un-cached images.
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Hide broken img and reveal the sibling fallback
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            {/* Hidden until onError fires */}
            <div style={{ display: 'none' }} className="h-full w-full">
              <CarFallback />
            </div>
          </>
        ) : (
          <CarFallback />
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <ProviderBadge providerId={provider} />
          {isNew && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
          )}
        </div>
        {/* Deal score — top-right corner of image */}
        <div className="absolute right-2 top-2 z-10">
          <DealScoreBadge
            dealScore={dealScore}
            savings={savings}
            userPlan={userPlan}
            compact
          />
        </div>
        <div className="absolute bottom-2 left-2">
          <div className="rounded-full bg-black/70 px-2.5 py-0.5 backdrop-blur-sm">
            <span className="text-sm font-bold text-white">
              {price > 0 ? `$${price.toLocaleString()}` : 'Free'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-medium leading-snug text-zinc-100">{title}</h3>

        {/* AI summary (Pro/Dealer only) */}
        {userPlan !== 'free' && aiSummary && (
          <p className="mt-1 line-clamp-2 text-[11px] italic text-zinc-400">{aiSummary}</p>
        )}

        {/* Red flags (Pro/Dealer only — show up to 2) */}
        {userPlan !== 'free' && redFlags && redFlags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {redFlags.slice(0, 2).map((flag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300"
              >
                ⚠️ {flag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
          <MapPin size={12} className="shrink-0 text-zinc-600" />
          <span className="truncate">{location ?? 'Location unknown'}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Clock size={11} className="shrink-0" />
            <span>{timeAgo}</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-emerald-500 transition-colors hover:text-emerald-400 hover:underline"
          >
            {p.shortName !== 'Marketplace' ? `View on ${p.shortName}` : 'View listing'}
            <ExternalLink size={11} />
          </a>
        </div>
        <p className="mt-2 truncate text-[11px] text-zinc-600">{searchName}</p>
      </div>
    </div>
  )
}

// ─── List row ─────────────────────────────────────────────────────────────────

function DealListRow({
  title,
  price,
  location,
  url,
  image,
  provider,
  seenAtMs,
  searchName,
  dealScore,
  savings,
  nowMs,
  userPlan,
}: DealRow & { nowMs: number; userPlan: 'free' | 'pro' | 'dealer' }) {
  const timeAgo = formatDistanceToNow(new Date(seenAtMs), { addSuffix: true })
  const isNew = nowMs - seenAtMs < ONE_DAY_MS
  const p = getProvider(provider)

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900 transition-all duration-200 hover:border-white/20 hover:ring-2 hover:ring-emerald-500/20 lg:h-32 lg:flex-row">
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-zinc-800 lg:h-full lg:w-32 lg:rounded-l-xl">
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            {/* Hidden until onError fires */}
            <div style={{ display: 'none' }} className="h-full w-full">
              <CarFallback size="sm" />
            </div>
          </>
        ) : (
          <CarFallback size="sm" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-4 py-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <ProviderPill providerId={provider} />
            {isNew && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">New</span>
            )}
            <span className="text-zinc-700">·</span>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock size={11} />
              <span>{timeAgo}</span>
            </div>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-zinc-100">{title}</p>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
            <MapPin size={11} className="shrink-0 text-zinc-600" />
            <span className="truncate">{location ?? 'Location unknown'}</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-zinc-600">{searchName}</p>
        </div>

        <div className="mt-3 flex items-center justify-between lg:mt-0 lg:w-40 lg:flex-col lg:items-end lg:justify-center lg:gap-2 lg:pr-2">
          <DealScoreBadge
            dealScore={dealScore}
            savings={savings}
            userPlan={userPlan}
          />
          <p className="text-2xl font-bold tracking-tight text-emerald-400">
            {price > 0 ? `$${price.toLocaleString()}` : 'Free'}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-emerald-500"
          >
            View on {p.shortName}
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Grid / List wrappers ─────────────────────────────────────────────────────

function GridView({ rows, nowMs, userPlan }: { rows: DealRow[]; nowMs: number; userPlan: 'free' | 'pro' | 'dealer' }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => <DealCard key={r.id} {...r} nowMs={nowMs} userPlan={userPlan} />)}
    </div>
  )
}

function ListView({ rows, nowMs, userPlan }: { rows: DealRow[]; nowMs: number; userPlan: 'free' | 'pro' | 'dealer' }) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {rows.map((r) => <DealListRow key={r.id} {...r} nowMs={nowMs} userPlan={userPlan} />)}
    </div>
  )
}

// ─── Select helper ────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  icon: Icon,
  label,
  children,
}: {
  value: string
  onChange: (v: string) => void
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <Icon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="rounded-lg border border-white/10 bg-zinc-900 py-2 pl-8 pr-8 text-sm text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {children}
      </select>
    </div>
  )
}

// ─── Price input with $ prefix ────────────────────────────────────────────────

function PriceInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500">$</span>
      <input
        ref={ref}
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 rounded-lg border border-white/10 bg-zinc-900 py-2 pl-7 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DealsClient({
  rows,
  initialSearch,
  runStats,
  userPlan = 'free',
}: {
  rows: DealRow[]
  initialSearch?: string
  runStats?: RunStats
  userPlan?: 'free' | 'pro' | 'dealer'
}) {
  const [titleFilter, setTitleFilter] = useState('')
  const [selectedSearch, setSelectedSearch] = useState(initialSearch ?? 'all')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [minPriceInput, setMinPriceInput] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const [viewMode, setViewModeState] = useState<ViewMode>(getStoredViewMode)
  const [recency, setRecencyState] = useState<RecencyKey>(getStoredRecency)
  const nowMs = new Date().getTime()

  // Debounce price inputs so filtering doesn't trigger on every keystroke
  const minPriceFilter = useDebounced(minPriceInput, 300)
  const maxPriceFilter = useDebounced(maxPriceInput, 300)

  function setViewMode(mode: ViewMode) {
    setViewModeState(mode)
    try { localStorage.setItem(VIEW_MODE_KEY, mode) } catch {}
  }

  function setRecency(key: RecencyKey) {
    setRecencyState(key)
    try { localStorage.setItem(RECENCY_KEY, key) } catch {}
  }

  function clearAll() {
    setTitleFilter('')
    setSelectedSearch('all')
    setSortBy('newest')
    setMinPriceInput('')
    setMaxPriceInput('')
    setRecencyState('24h')
    try { localStorage.setItem(RECENCY_KEY, '24h') } catch {}
  }

  const uniqueSearches = useMemo(() => {
    const map = new Map<string, string>()
    rows.forEach((r) => map.set(r.searchId, r.searchName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [rows])

  const filteredWithoutRecency = useMemo(() => {
    let result = [...rows]

    if (titleFilter) {
      const q = titleFilter.toLowerCase()
      result = result.filter(
        (r) => r.title.toLowerCase().includes(q) || r.location?.toLowerCase().includes(q),
      )
    }

    if (selectedSearch !== 'all') {
      result = result.filter((r) => r.searchId === selectedSearch)
    }

    const floor = minPriceFilter ? Number(minPriceFilter) : null
    if (floor && floor > 0) {
      result = result.filter((r) => Number(r.price) >= floor)
    }

    const cap = maxPriceFilter ? Number(maxPriceFilter) : null
    if (cap && cap > 0) {
      result = result.filter((r) => Number(r.price) <= cap)
    }

    return result
  }, [rows, titleFilter, selectedSearch, minPriceFilter, maxPriceFilter])

  const filtered = useMemo(() => {
    let result = [...filteredWithoutRecency]

    const cutoff = nowMs - RECENCY_CUTOFFS[recency]
    result = result.filter((r) => r.seenAtMs >= cutoff)

    if (sortBy === 'cheapest') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'dealScore') {
      result.sort((a, b) => (b.dealScore ?? -1) - (a.dealScore ?? -1))
    }

    return result
  }, [filteredWithoutRecency, nowMs, recency, sortBy])

  const recencyCutsToZero = recency !== 'all' && filtered.length === 0 && filteredWithoutRecency.length > 0

  if (rows.length === 0) {
    if (runStats) return <NoResultsDiagnostic runStats={runStats} />
    return <NoDealsYet />
  }

  // Build filter chips
  const chips: { label: string; onRemove: () => void }[] = []
  if (titleFilter) chips.push({ label: `"${titleFilter}"`, onRemove: () => setTitleFilter('') })
  if (selectedSearch !== 'all') {
    const name = uniqueSearches.find((s) => s.id === selectedSearch)?.name ?? selectedSearch
    chips.push({ label: `Search: ${name}`, onRemove: () => setSelectedSearch('all') })
  }
  if (sortBy === 'cheapest') chips.push({ label: 'Cheapest first', onRemove: () => setSortBy('newest') })
  if (sortBy === 'dealScore') chips.push({ label: 'Best deals first', onRemove: () => setSortBy('newest') })
  chips.push({ label: `Recency: ${RECENCY_CHIP_LABELS[recency]}`, onRemove: () => setRecency('24h') })
  if (minPriceInput && maxPriceInput) {
    chips.push({
      label: `$${Number(minPriceInput).toLocaleString()}–$${Number(maxPriceInput).toLocaleString()}`,
      onRemove: () => { setMinPriceInput(''); setMaxPriceInput('') },
    })
  } else if (minPriceInput) {
    chips.push({ label: `Min $${Number(minPriceInput).toLocaleString()}`, onRemove: () => setMinPriceInput('') })
  } else if (maxPriceInput) {
    chips.push({ label: `Max $${Number(maxPriceInput).toLocaleString()}`, onRemove: () => setMaxPriceInput('') })
  }

  return (
    <div>
      {/* ── Controls bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Title search */}
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by title or location"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="w-52 rounded-lg border border-white/10 bg-zinc-900 py-2 pl-8 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {titleFilter && (
            <button onClick={() => setTitleFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={13} />
            </button>
          )}
        </div>

        {uniqueSearches.length > 1 && (
          <FilterSelect value={selectedSearch} onChange={setSelectedSearch} icon={Search} label="Search">
            <option value="all">All searches</option>
            {uniqueSearches.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </FilterSelect>
        )}

        {/* Recency */}
        <div className="flex items-center gap-1.5">
          <FilterSelect value={recency} onChange={(v) => setRecency(v as RecencyKey)} icon={Clock} label="Recency">
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="3d">Last 3 days</option>
            <option value="7d">Last 7 days</option>
            <option value="all">All time</option>
          </FilterSelect>
          <RecencyTooltip />
        </div>

        <FilterSelect value={sortBy} onChange={(v) => setSortBy(v as SortKey)} icon={SlidersHorizontal} label="Sort">
          <option value="newest">Newest first</option>
          <option value="cheapest">Cheapest first</option>
          <option value="dealScore" disabled={userPlan === 'free'}>
            {userPlan === 'free' ? 'Best deals first (Pro)' : 'Best deals first'}
          </option>
        </FilterSelect>

        {/* Price range inputs */}
        <PriceInput placeholder="Min price" value={minPriceInput} onChange={setMinPriceInput} />
        <PriceInput placeholder="Max price" value={maxPriceInput} onChange={setMaxPriceInput} />

        {/* Count + view toggle */}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-zinc-500 sm:block">
            {filtered.length} listing{filtered.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={['rounded-md p-1.5 transition-all duration-200', viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'].join(' ')}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={['rounded-md p-1.5 transition-all duration-200', viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'].join(' ')}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter chips ── */}
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <FilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
          ))}
          {chips.length > 1 && (
            <button onClick={clearAll} className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── 6h upgrade nudge ── */}
      {recency === '6h' && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-400">
          <span>Need faster alerts? Upgrade to Pro for 30-minute polling or Dealer for 15-minute polling.</span>
          <Link href="/pricing" className="ml-auto shrink-0 font-medium underline underline-offset-2 hover:text-amber-300">
            Upgrade
          </Link>
        </div>
      )}

      {/* ── Stats bar ── */}
      <StatsBar rows={filtered} />

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <NoFilterResults
          onClear={clearAll}
          onShowAll={recencyCutsToZero ? () => setRecency('all') : undefined}
          recencyWindow={recencyCutsToZero ? RECENCY_LABELS[recency] : undefined}
        />
      ) : viewMode === 'grid' ? (
        <GridView rows={filtered} nowMs={nowMs} userPlan={userPlan} />
      ) : (
        <ListView rows={filtered} nowMs={nowMs} userPlan={userPlan} />
      )}
    </div>
  )
}
