"use client"

import { Stethoscope, Scissors, UtensilsCrossed, Dumbbell } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

const ICON_COLORS: Record<string, string> = {
  blue:   "text-blue-500",
  pink:   "text-pink-500",
  orange: "text-orange-500",
  green:  "text-green-500",
}

export function NicheCards() {
  const { t } = useI18n()

  const NICHES = [
    { icon: Stethoscope,    title: t('landing', 'nicheMedicine'), description: t('landing', 'nicheMedicineDesc'), color: "blue"   as const },
    { icon: Scissors,       title: t('landing', 'nicheBeauty'),   description: t('landing', 'nicheBeautyDesc'),   color: "pink"   as const },
    { icon: UtensilsCrossed,title: t('landing', 'nicheHoreca'),   description: t('landing', 'nicheHorecaDesc'),   color: "orange" as const },
    { icon: Dumbbell,       title: t('landing', 'nicheSports'),   description: t('landing', 'nicheSportsDesc'),   color: "green"  as const },
  ]

  return (
    <section id="niches" className="py-20 bg-background dark:bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('landing', 'forWhomTitle')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('landing', 'nichesSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {NICHES.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="rounded-2xl neu-raised bg-[var(--neu-bg)] p-6 flex flex-col gap-4 hover-lift cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl neu-raised bg-[var(--neu-bg)] flex items-center justify-center ${ICON_COLORS[color]}`}>
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
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