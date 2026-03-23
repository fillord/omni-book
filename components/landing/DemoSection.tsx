"use client"

import { ArrowUpRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

const DEMOS = [
  {
    slug: "city-polyclinic",
    nameKey: "demoNamePolyclinic",
    descriptionKey: "demoPolyclinicDesc",
    nicheKey: "medicine",
    badgeColor: "text-blue-500",
    dotColor: "bg-blue-500",
  },
  {
    slug: "beauty-studio",
    nameKey: "demoNameBeauty",
    descriptionKey: "demoBeautyDesc",
    nicheKey: "beauty",
    badgeColor: "text-pink-500",
    dotColor: "bg-pink-500",
  },
  {
    slug: "bistro-central",
    nameKey: "demoNameBistro",
    descriptionKey: "demoBistroDesc",
    nicheKey: "horeca",
    badgeColor: "text-orange-500",
    dotColor: "bg-orange-500",
  },
  {
    slug: "sport-arena",
    nameKey: "demoNameSport",
    descriptionKey: "demoSportDesc",
    nicheKey: "sport",
    badgeColor: "text-green-500",
    dotColor: "bg-green-500",
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
          {DEMOS.map(({ slug, nameKey, descriptionKey, nicheKey, badgeColor, dotColor }) => (
            <a
              key={slug}
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl neu-raised bg-[var(--neu-bg)] p-5 flex flex-col gap-3 transition-all hover-lift"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full neu-inset bg-[var(--neu-bg)] ${badgeColor}`}>
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
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                <span className="text-xs text-muted-foreground">/{slug}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}