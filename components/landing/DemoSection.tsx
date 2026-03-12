"use client"

import { ArrowUpRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

const DEMOS = [
  {
    slug: "city-polyclinic",
    name: "Городская поликлиника",
    descriptionKey: "demoPolyclinicDesc",
    nicheKey: "medicine",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  {
    slug: "beauty-studio",
    name: "Beauty Studio",
    descriptionKey: "demoBeautyDesc",
    nicheKey: "beauty",
    color: "bg-pink-50 border-pink-200 hover:border-pink-400",
    badge: "bg-pink-100 text-pink-700",
    dot: "bg-pink-500",
  },
  {
    slug: "bistro-central",
    name: "Bistro Central",
    descriptionKey: "demoBistroDesc",
    nicheKey: "horeca",
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
  {
    slug: "sport-arena",
    name: "Sport Arena",
    descriptionKey: "demoSportDesc",
    nicheKey: "sport",
    color: "bg-green-50 border-green-200 hover:border-green-400",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
]

export function DemoSection() {
  const { t } = useI18n()

  return (
    <section id="demo" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">{t('landing', 'liveDemos')}</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            {t('landing', 'demoDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DEMOS.map(({ slug, name, descriptionKey, nicheKey, color, badge, dot }) => (
            <a
              key={slug}
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`group rounded-2xl border-2 p-5 flex flex-col gap-3 transition-all ${color}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                  {t('landing', nicheKey)}
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-zinc-400 group-hover:text-zinc-700 transition-colors"
                />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 mb-1">{name}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{t('landing', descriptionKey)}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-auto">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs text-zinc-400">/{slug}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
