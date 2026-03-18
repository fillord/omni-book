"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"

export function Footer() {
  const { t } = useI18n()

  const LINKS = [
    { label: t('landing', 'about'), href: "#" },
    { label: t('landing', 'pricing'), href: "#pricing" },
    { label: t('landing', 'docs'), href: "#" },
    { label: t('landing', 'support'), href: "#" },
  ]
  return (
    {/* intentional: fixed dark footer surface — brand design choice, dark in both modes */}
    <footer className="bg-zinc-900 text-zinc-400 py-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <Link href="/" className="font-bold text-lg text-white">
            omni<span className="text-indigo-400">book</span>
          </Link>
          <p className="text-xs text-zinc-500">{t('landing', 'heroSubtitle')}</p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <p className="text-xs text-zinc-500">© 2026 omni-book</p>
      </div>
    </footer>
  )
}
