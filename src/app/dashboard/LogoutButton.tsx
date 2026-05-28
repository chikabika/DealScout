'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function LogoutButton({
  className,
  showIcon = true,
}: {
  className?: string
  showIcon?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={className}
    >
      {showIcon && <LogOut size={15} />}
      Log out
    </button>
  )
}
