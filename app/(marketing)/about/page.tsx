"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

export default function AboutPage() {
  const { t } = useI18n()

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
            {t('about', 'pageTitle')}
          </h1>
        </div>

        {/* Company section */}
        <div className="space-y-6">
          <section className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">{t('about', 'companyName')}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{t('about', 'companyDesc')}</p>
          </section>

          <section className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">{t('about', 'missionTitle')}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{t('about', 'missionBody')}</p>
          </section>

          {/* Contacts section with id for anchor link from Footer */}
          <section id="contacts" className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">{t('about', 'contactsTitle')}</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Email: {t('about', 'contactEmail')}</p>
              <p>{t('about', 'contactPhone')}</p>
              <p>{t('about', 'contactAddress')}</p>
              <p>{t('about', 'binLabel')}: {t('about', 'binValue')}</p>
            </div>
          </section>
        </div>
      </div>
    </main>
    <Footer />
    </>
  )
}
