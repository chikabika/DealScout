'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, X, Loader2 } from 'lucide-react'

export function UpgradeBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [checking, setChecking] = useState(false)
  const [planName, setPlanName] = useState<string | null>(null)

  useEffect(() => {
    if (!searchParams.get('upgraded')) return
    setVisible(true)
    setChecking(true)

    let attempts = 0
    const maxAttempts = 20 // 20 × 2s = 40 seconds max wait

    const poll = async () => {
      try {
        const res = await fetch('/api/user/usage')
        const data = await res.json() as { plan?: { id?: string; name?: string } }
        const planId = data?.plan?.id

        if (planId && planId !== 'free') {
          setPlanName(data.plan?.name ?? null)
          setChecking(false)
          window.history.replaceState({}, '', '/dashboard')
          router.refresh()
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        } else {
          setChecking(false)
          window.history.replaceState({}, '', '/dashboard')
        }
      } catch {
        setChecking(false)
      }
    }

    setTimeout(poll, 2000)
  }, [searchParams, router])

  if (!visible) return null

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
      {checking ? (
        <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-emerald-400" />
      ) : (
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
      )}
      <div className="flex-1">
        {checking ? (
          <>
            <p className="text-sm font-semibold text-emerald-300">Activating your plan...</p>
            <p className="mt-0.5 text-xs text-emerald-400/70">
              Payment confirmed. Setting up your account — this takes a few seconds.
            </p>
          </>
        ) : planName ? (
          <>
            <p className="text-sm font-semibold text-emerald-300">Welcome to {planName}!</p>
            <p className="mt-0.5 text-xs text-emerald-400/70">
              Your plan is now active. Create your searches and start getting deals.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-emerald-300">Payment received!</p>
            <p className="mt-0.5 text-xs text-emerald-400/70">
              Your plan will activate shortly. Refresh the page in a few seconds if you don't see changes.
            </p>
          </>
        )}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="shrink-0 text-emerald-400/60 hover:text-emerald-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
