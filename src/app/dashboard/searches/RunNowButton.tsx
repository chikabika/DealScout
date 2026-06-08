'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'

type CollectResponse = {
  success: boolean
  newListings: number
  providersRun: string[]
  error?: string
  secondsLeft?: number
}

const COOLDOWN_MS = 60_000

function cooldownKey(searchId: string) {
  return `run_cooldown_${searchId}`
}

function readCooldown(searchId: string): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(cooldownKey(searchId))
  if (!raw) return null
  const until = Number(raw)
  if (!Number.isFinite(until) || until <= Date.now()) return null
  return until
}

function writeCooldown(searchId: string, until: number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(cooldownKey(searchId), String(until))
}

export function RunNowButton({
  searchId,
  searchName,
}: {
  searchId: string
  searchName: string
}) {
  const [loading, setLoading] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Read any existing cooldown from localStorage on mount
  useEffect(() => {
    const until = readCooldown(searchId)
    if (until) {
      setCooldownUntil(until)
      setSecondsLeft(Math.ceil((until - Date.now()) / 1000))
    }
  }, [searchId])

  // Tick the countdown down every second
  useEffect(() => {
    if (!cooldownUntil) return

    const interval = setInterval(() => {
      const remaining = cooldownUntil - Date.now()
      if (remaining <= 0) {
        setCooldownUntil(null)
        setSecondsLeft(0)
        clearInterval(interval)
      } else {
        setSecondsLeft(Math.ceil(remaining / 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [cooldownUntil])

  function startCooldown(ms: number) {
    const until = Date.now() + ms
    writeCooldown(searchId, until)
    setCooldownUntil(until)
    setSecondsLeft(Math.ceil(ms / 1000))
  }

  async function handleRun() {
    setLoading(true)
    try {
      const res = await fetch(`/api/cron/collect?searchId=${encodeURIComponent(searchId)}`)
      const data: CollectResponse = await res.json()

      if (!res.ok || !data.success) {
        if (data.error === 'COOLDOWN' && data.secondsLeft) {
          startCooldown(data.secondsLeft * 1000)
        } else {
          toast.error(data.error ?? 'Run failed — check the logs')
        }
        return
      }

      startCooldown(COOLDOWN_MS)

      const n = data.newListings
      if (n > 0) {
        toast.success(`Found ${n} new deal${n === 1 ? '' : 's'} — email sent!`, {
          description: searchName,
          duration: 6000,
        })
      } else {
        toast.info('No new deals found this time', {
          description: searchName,
        })
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const onCooldown = !!cooldownUntil

  return (
    <button
      onClick={handleRun}
      disabled={loading || onCooldown}
      title={onCooldown ? `Wait ${secondsLeft}s before running again` : `Run "${searchName}" now`}
      className={`flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 px-2 text-zinc-400 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 ${onCooldown ? 'w-auto text-zinc-500' : 'w-8 shrink-0'}`}
    >
      {loading ? (
        <svg
          className="h-3.5 w-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            d="M12 3a9 9 0 1 0 9 9"
          />
        </svg>
      ) : onCooldown ? (
        <>
          <Clock size={10} />
          <span className="text-[11px] font-medium tabular-nums">{secondsLeft}s</span>
        </>
      ) : (
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.267a1.5 1.5 0 0 1 0 2.531l-6.706 4.268A1.5 1.5 0 0 1 3 12.267V3.732Z" />
        </svg>
      )}
    </button>
  )
}
