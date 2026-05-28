'use client'

import { useState } from 'react'

export function ManagePaddleButton({ className }: { className: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/paddle/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Unable to open billing portal.')
      }
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open billing portal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={openPortal} disabled={loading} className={className}>
        {loading ? 'Opening...' : 'Manage subscription'}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
