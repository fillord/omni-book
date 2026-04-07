"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

const PLANS = [
  {
    name: "Free",
    period: "forever",
    description: "Навсегда",
    features: [
      "freeFeature1",
      "freeFeature2",
      "freeFeature3",
      "freeFeature4",
    ],
    cta: "startFree",
    href: "/register",
    highlight: false,
    priceKey: "free",
  },
  {
    name: "Pro",
    period: "perMonth",
    description: "Для растущего бизнеса",
    features: [
      "proFeature1",
      "proFeature2",
      "proFeature3",
      "proFeature4",
      "proFeature5",
    ],
    cta: "tryPro",
    href: "/register",
    highlight: true,
    priceKey: "proLabel",
  },
  {
    name: "Enterprise",
    period: "",
    description: "contactUs",
    features: [
      "entFeature1",
      "entFeature2",
      "entFeature3",
      "entFeature4",
      "entFeature5",
    ],
    cta: "contactUs",
    href: "/support",
    highlight: false,
    priceKey: "onDemand",
  },
]

export function PricingCards() {
  const { t } = useI18n()

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('landing', 'pricing')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('landing', 'pricingDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map(({ name, priceKey, period, features, cta, href, highlight }) => (
            <div
              key={name}
              className={`rounded-2xl neu-raised bg-[var(--neu-bg)] p-6 flex flex-col gap-5 ${
                highlight ? "ring-2 ring-neu-accent/40 scale-[1.02]" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-muted-foreground">{name}</span>
                  {highlight && (
                    <span className="text-xs px-2 py-0.5 rounded-full neu-inset bg-[var(--neu-bg)] text-neu-accent font-medium">
                      {t('landing', 'popular')}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${highlight ? "text-neu-accent" : "text-foreground"}`}>
                    {t('landing', priceKey)}
                  </span>
                  {period && (
                    <span className="text-sm text-muted-foreground">{t('landing', period)}</span>
                  )}
                </div>
                <p className="text-sm mt-1 text-muted-foreground">
                  {name === "Free" ? t('landing', 'freeDesc') : name === "Pro" ? t('landing', 'proDesc') : t('landing', 'entDesc')}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check size={14} className={`shrink-0 ${highlight ? "text-neu-accent" : "text-muted-foreground"}`} />
                    <span className="text-foreground">{t('landing', f)}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`mt-auto text-center text-sm font-semibold py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] transition-all active:neu-inset ${
                  highlight ? "text-neu-accent" : "text-foreground hover:text-neu-accent"
                }`}
              >
                {t('landing', cta)}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
