'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CreditCard, User } from 'lucide-react'
import { LogoutButton } from './LogoutButton'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Searches', href: '/dashboard/searches' },
  { label: 'Deals', href: '/dashboard/listings' },
]

type UsageData = {
  plan: { id: string; name: string; maxSearches: number }
  usage: {
    searches: { used: number; max: number }
    runsToday: { used: number; max: number }
    runsThisMonth: { used: number; max: number }
  }
} | null

export default function DashboardNav() {
  const pathname = usePathname()
  const [usage, setUsage] = useState<UsageData>(null)

  useEffect(() => {
    fetch('/api/user/usage')
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(() => {})
  }, [])

  const planId = usage?.plan.id ?? 'free'
  const remaining = usage
    ? Math.max(0, usage.plan.maxSearches - usage.usage.searches.used)
    : null

  const badgeClass =
    planId === 'dealer'
      ? 'bg-purple-500/15 text-purple-300'
      : planId === 'pro'
      ? 'bg-emerald-500/15 text-emerald-300'
      : 'bg-zinc-800 text-zinc-400'

  const badgeLabel =
    planId === 'free' && remaining !== null
      ? `Free · ${remaining} left`
      : planId === 'pro'
      ? 'Pro plan'
      : planId === 'dealer'
      ? 'Dealer plan'
      : null

  return (
    <div className="mt-10 flex flex-col gap-1">
      {/* Main nav */}
      <nav className="grid gap-1 text-sm text-zinc-400">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={
                isActive
                  ? 'rounded-md bg-white/10 px-3 py-2 text-zinc-100'
                  : 'rounded-md px-3 py-2 hover:bg-white/5 hover:text-zinc-200 transition-colors'
              }
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="my-3 border-t border-white/5" />

      {/* Billing link */}
      <Link
        href="/dashboard/billing"
        className={[
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
          pathname.startsWith('/dashboard/billing')
            ? 'bg-white/10 text-zinc-100'
            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
        ].join(' ')}
      >
        <CreditCard size={15} />
        Billing
      </Link>

      <Link
        href="/dashboard/profile"
        className={[
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
          pathname.startsWith('/dashboard/profile')
            ? 'bg-white/10 text-zinc-100'
            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
        ].join(' ')}
      >
        <User size={15} />
        Profile
      </Link>

      <LogoutButton
        className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
      />

      {/* Plan badge */}
      {badgeLabel && (
        <div className="mt-1 px-3">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>
      )}
    </div>
  )
}
