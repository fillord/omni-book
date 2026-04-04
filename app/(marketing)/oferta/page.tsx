"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

export default function OfertaPage() {
  const { t } = useI18n()

  const sections = [
    { title: t('oferta', 'section1Title'), body: t('oferta', 'section1Body') },
    { title: t('oferta', 'section2Title'), body: t('oferta', 'section2Body') },
    { title: t('oferta', 'section3Title'), body: t('oferta', 'section3Body') },
    { title: t('oferta', 'section4Title'), body: t('oferta', 'section4Body') },
    { title: t('oferta', 'section5Title'), body: t('oferta', 'section5Body') },
    { title: t('oferta', 'section6Title'), body: t('oferta', 'section6Body') },
    { title: t('oferta', 'section7Title'), body: t('oferta', 'section7Body') },
    { title: t('oferta', 'section8Title'), body: t('oferta', 'section8Body') },
    { title: t('oferta', 'section9Title'), body: t('oferta', 'section9Body') },
  ]

  return (
    <>
    <Navbar />
    <main className="bg-[var(--neu-bg)] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('legal', 'backToHome')}
          </Link>
        </div>
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('oferta', 'pageTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('legal', 'lastUpdated')}: {t('oferta', 'effectiveDate')}
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
    <Footer />
    </>
  )
}
