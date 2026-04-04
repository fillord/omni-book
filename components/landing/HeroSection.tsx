"use client"

import Link from "next/link"
import { Calendar, Clock, Star, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export function HeroSection() {
  const { t } = useI18n()

  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-36">
      {/* Animated gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-neu-accent/10 blur-3xl animate-gradient"
        style={{ backgroundImage: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2), rgba(99,102,241,0.2))', backgroundSize: '200% 200%' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-neu-accent/5 blur-3xl"
      />

      {/* Floating decorative icons */}
      <div aria-hidden className="pointer-events-none absolute top-20 right-[15%] animate-float opacity-20 dark:opacity-10">
        <Calendar className="h-10 w-10 text-indigo-400" />
      </div>
      <div aria-hidden className="pointer-events-none absolute top-32 left-[10%] animate-float opacity-15 dark:opacity-10" style={{ animationDelay: '1s' }}>
        <Clock className="h-8 w-8 text-violet-400" />
      </div>
      <div aria-hidden className="pointer-events-none absolute bottom-24 right-[20%] animate-float opacity-15 dark:opacity-10" style={{ animationDelay: '2s' }}>
        <Star className="h-7 w-7 text-indigo-300" />
      </div>
      <div aria-hidden className="pointer-events-none absolute top-40 right-[35%] animate-float opacity-10 dark:opacity-5" style={{ animationDelay: '0.5s' }}>
        <Sparkles className="h-6 w-6 text-violet-300" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <span className="inline-block mb-4 px-3 py-1 rounded-full neu-raised bg-background text-neu-accent text-xs font-semibold tracking-wide uppercase animate-fade-in">
          {t('landing', 'heroBadge')}
        </span>

        <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6 animate-slide-up">
          {t('landing', 'heroTitleMain')}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
            {t('landing', 'heroTitleAccent')}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up stagger-2">
          {t('landing', 'heroDesc')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up stagger-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl neu-raised bg-[var(--neu-bg)] text-neu-accent font-semibold text-base transition-all duration-300 ease-in-out active:neu-inset hover-scale"
          >
            {t('landing', 'heroCtaPrimary')} →
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl neu-raised bg-[var(--neu-bg)] text-foreground font-semibold text-base transition-all duration-300 ease-in-out hover:text-neu-accent active:neu-inset"
          >
            {t('landing', 'heroCtaSecondary')}
          </a>
        </div>

        <p className="mt-6 text-xs text-muted-foreground animate-fade-in stagger-4">
          {t('landing', 'heroNoCard')}
        </p>
      </div>
    </section>
  )
}
