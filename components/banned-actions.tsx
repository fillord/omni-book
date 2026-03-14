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
        className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
      >
        Написать в поддержку
      </a>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors text-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Войти под другим аккаунтом
      </button>
      <div className="mt-2 pt-2 border-t border-zinc-100">
        <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          Вернуться на главную
        </Link>
      </div>
    </div>
  )
}

