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
    href: "mailto:hello@omnibook.com",
    highlight: false,
    priceKey: "onDemand",
  },
]

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-zinc-600">
      <Check size={14} className="text-indigo-500 shrink-0" />
      {text}
    </li>
  )
}

export function PricingCards() {
  const { t } = useI18n()

  return (
    <section id="pricing" className="py-20 bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">{t('landing', 'pricing')}</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            {t('landing', 'pricingDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map(({ name, priceKey, period, description, features, cta, href, highlight }) => (
            <div
              key={name}
              className={`rounded-2xl p-6 flex flex-col gap-5 border-2 ${
                highlight
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200"
                  : "bg-white border-zinc-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-semibold ${highlight ? "text-indigo-100" : "text-zinc-500"}`}
                  >
                    {name}
                  </span>
                  {highlight && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">
                      {t('landing', 'popular')}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-bold ${highlight ? "text-white" : "text-zinc-900"}`}
                  >
                    {t('landing', priceKey)}
                  </span>
                  {period && (
                    <span className={`text-sm ${highlight ? "text-indigo-200" : "text-zinc-400"}`}>
                      {t('landing', period)}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${highlight ? "text-indigo-100" : "text-zinc-500"}`}>
                  {name === "Free" ? t('landing', 'freeDesc') : name === "Pro" ? t('landing', 'proDesc') : t('landing', 'entDesc')}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check
                      size={14}
                      className={`shrink-0 ${highlight ? "text-indigo-200" : "text-indigo-500"}`}
                    />
                    <span className={highlight ? "text-indigo-50" : "text-zinc-600"}>{t('landing', f)}</span>
                  </li>
                ))}
              </ul>

              {(name === "Free" || name === "Pro") ? (
                <Link
                  href={href}
                  className={`mt-auto text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                    highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {t('landing', cta)}
                </Link>
              ) : (
                <a
                  href={href}
                  className="mt-auto text-center text-sm font-semibold py-2.5 rounded-xl border-2 border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
                >
                  {t('landing', cta)}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
