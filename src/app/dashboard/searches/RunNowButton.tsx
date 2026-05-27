'use client'

import { useState } from 'react'
import { toast } from 'sonner'

type CollectResponse = {
  success: boolean
  newListings: number
  providersRun: string[]
  error?: string
}

export function RunNowButton({
  searchId,
  searchName,
}: {
  searchId: string
  searchName: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleRun() {
    setLoading(true)
    try {
      const res = await fetch(`/api/cron/collect?searchId=${encodeURIComponent(searchId)}`)
      const data: CollectResponse = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Run failed — check the logs')
        return
      }

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

  return (
    <button
      onClick={handleRun}
      disabled={loading}
      title={`Run "${searchName}" now`}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
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
      ) : (
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.267a1.5 1.5 0 0 1 0 2.531l-6.706 4.268A1.5 1.5 0 0 1 3 12.267V3.732Z" />
        </svg>
      )}
    </button>
  )
}
