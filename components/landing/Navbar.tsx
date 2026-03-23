'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ClientOnly } from '@/components/shared/client-only'
import { PublicThemeToggle } from '@/components/public-theme-toggle'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()

  const links = [
    { label: t('landing', 'features'), href: '#features' },
    { label: t('landing', 'pricing'),  href: '#pricing'  },
    { label: t('landing', 'demo'),     href: '#demo'     },
  ]

  const skeletonLinks = [
    { label: '...', href: '#features' },
    { label: '...', href: '#pricing' },
    { label: '...', href: '#demo' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[var(--neu-bg)] backdrop-blur neu-raised">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight text-foreground">
          omni<span className="text-indigo-600">book</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <ClientOnly 
            fallback={skeletonLinks.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="text-transparent bg-muted rounded animate-pulse"
              >
                {l.label}
              </a>
            ))}
          >
            {links.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </ClientOnly>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LocaleSwitcher className="h-8 text-sm" />
          <ClientOnly fallback={<div className="w-8 h-8 bg-muted rounded animate-pulse" />}>
            <PublicThemeToggle className="h-8 w-8" />
          </ClientOnly>
          <ClientOnly fallback={<div className="w-16 h-8 bg-muted rounded animate-pulse" />}>
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg neu-raised bg-[var(--neu-bg)] text-foreground transition-all active:neu-inset"
            >
              {t('common', 'login')}
            </Link>
          </ClientOnly>
          <ClientOnly fallback={<div className="w-24 h-8 bg-muted rounded animate-pulse" />}>
            <Link
              href="/register"
              className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
            >
              {t('common', 'register')}
            </Link>
          </ClientOnly>
        </div>

        {/* Mobile burger */}
        <ClientOnly fallback={<div className="w-9 h-9 md:hidden" />}>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={t('common', 'menu')}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </ClientOnly>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-3">
          <ClientOnly fallback={null}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </ClientOnly>
          <hr className="border-border" />
          <div className="py-1 flex items-center justify-between gap-3">
            <LocaleSwitcher className="h-9 text-sm" />
            <PublicThemeToggle className="h-9 w-9" />
          </div>
          <ClientOnly fallback={<div className="h-9 bg-muted rounded" />}>
            <Link href="/login" className="text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>
              {t('common', 'login')}
            </Link>
          </ClientOnly>
          <ClientOnly fallback={<div className="h-9 bg-muted rounded" />}>
            <Link
              href="/register"
              className="text-sm text-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium"
              onClick={() => setOpen(false)}
            >
              {t('common', 'register')}
            </Link>
          </ClientOnly>
        </div>
      )}
    </header>
  )
}
