'use client'

import { signOut } from 'next-auth/react'

interface SignOutButtonProps {
  redirectTo?: string
  className?: string
  children?: React.ReactNode
}

export function SignOutButton({ redirectTo = '/login', className, children }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: redirectTo })}
      className={className}
    >
      {children ?? 'Выйти'}
    </button>
  )
}
