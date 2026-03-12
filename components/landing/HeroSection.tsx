"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"

export function HeroSection() {
  const { t } = useI18n()
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-24 md:py-36">
      {/* Background decorative circles */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-100/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-violet-100/60 blur-3xl"
      />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
          {t('landing', 'heroBadge')}
        </span>

        <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 leading-tight mb-6">
          {t('landing', 'heroTitleMain')}{" "}
          <span className="text-indigo-600">{t('landing', 'heroTitleAccent')}</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('landing', 'heroDesc')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            {t('landing', 'heroCtaPrimary')} →
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-zinc-300 text-zinc-700 font-semibold text-base hover:bg-zinc-50 transition-colors"
          >
            {t('landing', 'heroCtaSecondary')}
          </a>
        </div>

        <p className="mt-6 text-xs text-zinc-400">
          {t('landing', 'heroNoCard')}
        </p>
      </div>
    </section>
  )
}
