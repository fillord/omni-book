"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"

export function Footer() {
  const { t } = useI18n()

  return (
    <>
    {/* intentional: neu-raised footer uses fixed bg-[var(--neu-bg)] — brand anchor, not semantic token */}
    <footer className="neu-raised bg-[var(--neu-bg)] py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Three-column grid (per D-01) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
          {/* Product column (per D-02) */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">
              {t('landing', 'footerColProduct')}
            </h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'features')}</a></li>
              <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'pricing')}</a></li>
              <li><a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'demo')}</a></li>
              <li><Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerDocs')}</Link></li>
            </ul>
          </div>
          {/* Legal column (per D-03) */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">
              {t('landing', 'footerColLegal')}
            </h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerPrivacy')}</Link></li>
              <li><Link href="/oferta" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerOferta')}</Link></li>
              <li><Link href="/refund" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerRefund')}</Link></li>
            </ul>
          </div>
          {/* Company column (per D-04) */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">
              {t('landing', 'footerColCompany')}
            </h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerAbout')}</Link></li>
              <li><Link href="/about#contacts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerContacts')}</Link></li>
              <li><Link href="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerSupport')}</Link></li>
            </ul>
          </div>
        </div>
        {/* Bottom bar (per D-05) */}
        <div className="border-t border-muted-foreground/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-bold text-lg text-foreground">
            omni<span className="text-neu-accent">book</span>
          </Link>
          <p className="text-xs text-muted-foreground">© 2026 omni-book. {t('landing', 'footerRights')}</p>
        </div>
      </div>
    </footer>
    </>
  )
}
