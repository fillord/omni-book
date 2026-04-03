"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"

export default function PrivacyPage() {
  const { t } = useI18n()

  const sections = [
    { title: t('privacy', 'section1Title'), body: t('privacy', 'section1Body') },
    { title: t('privacy', 'section2Title'), body: t('privacy', 'section2Body') },
    { title: t('privacy', 'section3Title'), body: t('privacy', 'section3Body') },
    { title: t('privacy', 'section4Title'), body: t('privacy', 'section4Body') },
    { title: t('privacy', 'section5Title'), body: t('privacy', 'section5Body') },
    { title: t('privacy', 'section6Title'), body: t('privacy', 'section6Body') },
    { title: t('privacy', 'section7Title'), body: t('privacy', 'section7Body') },
    { title: t('privacy', 'section8Title'), body: t('privacy', 'section8Body') },
    { title: t('privacy', 'section9Title'), body: t('privacy', 'section9Body') },
    { title: t('privacy', 'section10Title'), body: t('privacy', 'section10Body') },
    { title: t('privacy', 'section11Title'), body: t('privacy', 'section11Body') },
    { title: t('privacy', 'section12Title'), body: t('privacy', 'section12Body') },
  ]

  return (
    <main className="bg-[var(--neu-bg)] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('legal', 'backToHome')}
          </Link>
        </div>
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('privacy', 'pageTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('legal', 'lastUpdated')}: {t('privacy', 'effectiveDate')}
          </p>
        </div>
        <div className="space-y-6">
          {sections.map((s, i) => (
            <section key={i} className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
