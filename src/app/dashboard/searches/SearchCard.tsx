'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, Car, CheckCircle2, Clock, DollarSign, Edit, Gauge, MapPin, MoreVertical, Pause, Play, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getProvider } from '@/lib/providers'
import { FREQUENCY_LABELS } from '@/lib/plans'
import type { LastRunStats } from '@/lib/schema'
import { RunNowButton } from './RunNowButton'

export type SearchCardData = {
  id: string
  name: string
  city: string
  state: string
  minPrice: number | null
  maxPrice: number
  minYear: number | null
  maxMileage: number | null
  make: string | null
  model: string | null
  providers: string[]
  active: boolean
  frequencyMinutes: number
  nextRunAt: number | null
  dealCount: number
  lastSeenAtMs: number | null
  lastRunAt: number | null
  lastRunStats: LastRunStats | null
  nowMs: number
}

// ─── Provider pill ────────────────────────────────────────────────────────────

export function ProviderPill({ providerId }: { providerId: string }) {
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

// ─── 3-dot actions menu ───────────────────────────────────────────────────────

function ActionsMenu({
  searchId,
  isActive,
  onToggleActive,
}: {
  searchId: string
  isActive: boolean
  onToggleActive: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref} data-action>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        title="More options"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-zinc-200"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-xl">
          <a
            href={`/dashboard/searches/${searchId}/edit`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
          >
            <Edit size={14} className="text-zinc-500" />
            Edit search
          </a>
          <button
            onClick={() => { setOpen(false); onToggleActive() }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
          >
            {isActive ? (
              <><Pause size={14} className="text-zinc-500" />Pause</>
            ) : (
              <><Play size={14} className="text-zinc-500" />Resume</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Filter summary ───────────────────────────────────────────────────────────

function FilterSummary({ search }: { search: SearchCardData }) {
  const parts: { icon: React.ReactNode; text: string }[] = []

  parts.push({
    icon: <MapPin size={12} className="shrink-0" />,
    text: `${search.city}, ${search.state}`,
  })

  const priceText = search.minPrice
    ? `$${search.minPrice.toLocaleString()}–$${search.maxPrice.toLocaleString()}`
    : `Up to $${search.maxPrice.toLocaleString()}`
  parts.push({ icon: <DollarSign size={12} className="shrink-0" />, text: priceText })

  if (search.make || search.model) {
    parts.push({
      icon: <Car size={12} className="shrink-0" />,
      text: [search.make, search.model].filter(Boolean).join(' '),
    })
  }

  if (search.minYear) {
    parts.push({ icon: <Calendar size={12} className="shrink-0" />, text: `${search.minYear}+` })
  }

  if (search.maxMileage) {
    parts.push({ icon: <Gauge size={12} className="shrink-0" />, text: `${search.maxMileage.toLocaleString()}mi max` })
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
      {parts.map(({ icon, text }, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-zinc-600">{icon}</span>
          {text}
          {i < parts.length - 1 && <span className="ml-3 text-zinc-700">·</span>}
        </span>
      ))}
    </div>
  )
}

// ─── Run stats badge ──────────────────────────────────────────────────────────

function describeProviderError(
  providerErrors: Record<string, string> | undefined,
): { label: string; detail: string } | null {
  if (!providerErrors) return null
  const entries = Object.entries(providerErrors)
  if (entries.length === 0) return null
  const [provider, raw] = entries[0]
  const msg = (raw || '').toLowerCase()
  let reason: string
  if (msg.includes('402') || msg.includes('insufficient credits')) reason = 'out of credits'
  else if (msg.includes('429') || msg.includes('rate limit')) reason = 'rate limited'
  else if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted')) reason = 'timed out'
  else if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('forbidden')) reason = 'auth failed'
  else reason = 'scrape failed'
  return { label: `${provider}: ${reason}`, detail: raw }
}

function RunStatsBadge({
  lastRunAt,
  lastRunStats,
  nowMs,
}: {
  lastRunAt: number | null
  lastRunStats: LastRunStats | null
  nowMs: number
}) {
  if (!lastRunStats) return null

  const { newlyInserted, apifyReturned, afterClassifier, providerErrors } = lastRunStats

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const timeAgo = lastRunAt
    ? rtf.format(Math.round((lastRunAt - nowMs) / 60000), 'minute')
    : null

  // A provider-level error (Firecrawl 402 out of credits, rate limit, timeout, …)
  // is the real reason a run came back empty — surface it before "Source empty".
  const providerError = describeProviderError(providerErrors)

  const isHealthy = newlyInserted > 0
  const isFiltered = apifyReturned > 0 && afterClassifier === 0
  const isSourceEmpty = apifyReturned === 0

  const pill: { bg: string; text: string; icon: React.ReactNode; label: string; title?: string } = isHealthy
    ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: <CheckCircle2 size={11} />, label: `+${newlyInserted} new` }
    : providerError
      ? { bg: 'bg-red-500/10', text: 'text-red-400', icon: <XCircle size={11} />, label: providerError.label, title: providerError.detail }
      : isSourceEmpty
        ? { bg: 'bg-zinc-800', text: 'text-zinc-500', icon: null, label: 'Source empty' }
        : isFiltered
          ? { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: <XCircle size={11} />, label: 'Filtered out' }
          : { bg: 'bg-zinc-800', text: 'text-zinc-500', icon: null, label: 'No new deals' }

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      {timeAgo && <span className="text-zinc-600">Last run {timeAgo}</span>}
      <span
        title={pill.title}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${pill.bg} ${pill.text}`}
      >
        {pill.icon}
        {pill.label}
      </span>
      <span className="text-zinc-700">
        {apifyReturned} scanned
        {newlyInserted > 0 ? ` · ${newlyInserted} inserted` : ''}
      </span>
    </div>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function SearchCard({ search }: { search: SearchCardData }) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(search.active)

  async function toggleActive() {
    const nextActive = !isActive
    try {
      const res = await fetch(`/api/searches/${search.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      })
      if (!res.ok) throw new Error('Failed')
      setIsActive(nextActive)
      toast.success(nextActive ? 'Search resumed' : 'Search paused')
      router.refresh()
    } catch {
      toast.error('Failed to update search — please try again')
    }
  }

  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as Element).closest('[data-action]')) return
    router.push(`/dashboard/listings?search=${search.id}`)
  }

  const lastSeenText = search.lastSeenAtMs
    ? `Last run ${new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((search.lastSeenAtMs - search.nowMs) / 60000),
        'minute',
      )}`
    : 'Never run'

  return (
    <div
      onClick={handleCardClick}
      className="cursor-pointer rounded-xl border border-white/10 bg-zinc-900 p-5 transition-all duration-200 hover:border-white/20 hover:ring-2 hover:ring-emerald-500/20"
    >
      <div className="flex items-start gap-4">
        {/* Left: content */}
        <div className="min-w-0 flex-1">
          {/* Name + active badge + deal count */}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-medium text-zinc-100 truncate">{search.name}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              {isActive ? 'Active' : 'Paused'}
            </span>
            {search.dealCount > 0 && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {search.dealCount} deal{search.dealCount === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Provider pills */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {search.providers.map((pid) => (
              <ProviderPill key={pid} providerId={pid} />
            ))}
          </div>

          {/* Filter summary */}
          <FilterSummary search={search} />

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {FREQUENCY_LABELS[search.frequencyMinutes] || 'Manual'}
            </span>
            {search.nextRunAt && isActive && (
              <span>Next: {formatDistanceToNow(search.nextRunAt, { addSuffix: true })}</span>
            )}
            {!isActive && <span className="text-amber-400">Paused</span>}
          </div>

          {/* Run stats badge (shows after first cron run) */}
          {search.lastRunStats ? (
            <RunStatsBadge lastRunAt={search.lastRunAt} lastRunStats={search.lastRunStats} nowMs={search.nowMs} />
          ) : (
            <p className="mt-2 text-xs text-zinc-600">
              {search.dealCount} deal{search.dealCount === 1 ? '' : 's'} found
              {search.lastSeenAtMs ? ` · ${lastSeenText}` : ' · Never run'}
            </p>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-2" data-action>
          <RunNowButton searchId={search.id} searchName={search.name} />
          <button
            onClick={toggleActive}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-zinc-200"
            title={isActive ? 'Pause this search' : 'Resume this search'}
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <ActionsMenu
            searchId={search.id}
            isActive={isActive}
            onToggleActive={toggleActive}
          />
        </div>
      </div>
    </div>
  )
}
