"use client"

import { ArrowUpRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

const DEMOS = [
  {
    slug: "city-polyclinic",
    nameKey: "demoNamePolyclinic",
    descriptionKey: "demoPolyclinicDesc",
    nicheKey: "medicine",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400 dark:bg-card dark:border-blue-900/60 dark:hover:border-blue-500/80",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  {
    slug: "beauty-studio",
    nameKey: "demoNameBeauty",
    descriptionKey: "demoBeautyDesc",
    nicheKey: "beauty",
    color: "bg-pink-50 border-pink-200 hover:border-pink-400 dark:bg-card dark:border-pink-900/60 dark:hover:border-pink-500/80",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400",
    dot: "bg-pink-500 dark:bg-pink-400",
  },
  {
    slug: "bistro-central",
    nameKey: "demoNameBistro",
    descriptionKey: "demoBistroDesc",
    nicheKey: "horeca",
    color: "bg-orange-50 border-orange-200 hover:border-orange-400 dark:bg-card dark:border-orange-900/60 dark:hover:border-orange-500/80",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    dot: "bg-orange-500 dark:bg-orange-400",
  },
  {
    slug: "sport-arena",
    nameKey: "demoNameSport",
    descriptionKey: "demoSportDesc",
    nicheKey: "sport",
    color: "bg-green-50 border-green-200 hover:border-green-400 dark:bg-card dark:border-green-900/60 dark:hover:border-green-500/80",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    dot: "bg-green-500 dark:bg-green-400",
  },
]

export function DemoSection() {
  const { t } = useI18n()

  return (
    <section id="demo" className="py-20 bg-background dark:bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('landing', 'liveDemos')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('landing', 'demoDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DEMOS.map(({ slug, nameKey, descriptionKey, nicheKey, color, badge, dot }) => (
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
                  className="text-muted-foreground group-hover:text-foreground transition-colors"
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {t('landing', nameKey)}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('landing', descriptionKey)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-auto">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs text-muted-foreground">/{slug}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}