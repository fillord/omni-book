"use client"

import Link from 'next/link'
import { useTransition } from 'react'
import { signOut } from 'next-auth/react'

export function BannedActions() {
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut({ callbackUrl: '/login' })
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <a
        href="mailto:support@omnibook.com"
        className="w-full px-4 py-2.5 rounded-lg neu-raised bg-[var(--neu-bg)] text-foreground text-sm font-medium transition-all text-center block active:neu-inset"
      >
        Написать в поддержку
      </a>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="w-full px-4 py-2.5 rounded-lg neu-raised bg-[var(--neu-bg)] text-foreground text-sm font-medium transition-all text-center active:neu-inset disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Войти под другим аккаунтом
      </button>
      <div className="mt-2 pt-2 border-t border-border">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Вернуться на главную
        </Link>
      </div>
    </div>
  )
}

