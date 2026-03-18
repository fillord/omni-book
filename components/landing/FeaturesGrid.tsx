"use client"

import {
  Calendar,
  Clock,
  Building2,
  Smartphone,
  BarChart3,
  ShieldCheck,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export function FeaturesGrid() {
  const { t } = useI18n()

  const FEATURES = [
    { icon: Calendar,    title: t('landing', 'feature1'), description: t('landing', 'feature1Desc') },
    { icon: Clock,       title: t('landing', 'feature2'), description: t('landing', 'feature2Desc') },
    { icon: Building2,   title: t('landing', 'feature3'), description: t('landing', 'feature3Desc') },
    { icon: Smartphone,  title: t('landing', 'feature4'), description: t('landing', 'feature4Desc') },
    { icon: BarChart3,   title: t('landing', 'feature5'), description: t('landing', 'feature5Desc') },
    { icon: ShieldCheck, title: t('landing', 'feature6'), description: t('landing', 'feature6Desc') },
  ]

  return (
    <section id="features" className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('landing', 'features')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('landing', 'featuresSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-card text-card-foreground rounded-2xl border border-border p-6 flex gap-4 hover-lift"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
