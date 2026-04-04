'use client'

import { signOut } from 'next-auth/react'
import { clearActiveSession } from '@/lib/actions/auth-session'

interface SignOutButtonProps {
  redirectTo?: string
  className?: string
  children?: React.ReactNode
}

export function SignOutButton({ redirectTo = '/login', className, children }: SignOutButtonProps) {
  async function handleSignOut() {
    // Clear the DB session record first so the next login from any device
    // is not incorrectly blocked by the concurrent-session check.
    await clearActiveSession()
    await signOut({ callbackUrl: redirectTo })
  }

  return (
    <button onClick={handleSignOut} className={className}>
      {children ?? 'Выйти'}
    </button>
  )
}
