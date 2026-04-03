"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"

export default function RefundPage() {
  const { t } = useI18n()

  const sections = [
    { title: t('refund', 'section1Title'), body: t('refund', 'section1Body') },
    { title: t('refund', 'section2Title'), body: t('refund', 'section2Body') },
    { title: t('refund', 'section3Title'), body: t('refund', 'section3Body') },
    { title: t('refund', 'section4Title'), body: t('refund', 'section4Body') },
    { title: t('refund', 'section5Title'), body: t('refund', 'section5Body') },
    { title: t('refund', 'section6Title'), body: t('refund', 'section6Body') },
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
            {t('refund', 'pageTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('legal', 'lastUpdated')}: {t('refund', 'effectiveDate')}
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
