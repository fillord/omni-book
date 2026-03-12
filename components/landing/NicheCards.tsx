"use client"

import { Stethoscope, Scissors, UtensilsCrossed, Dumbbell } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    border: "border-blue-100",
  },
  pink: {
    bg: "bg-pink-50",
    icon: "bg-pink-100 text-pink-600",
    border: "border-pink-100",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-100 text-orange-600",
    border: "border-orange-100",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    border: "border-green-100",
  },
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
    <section id="niches" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">{t('landing', 'forWhomTitle')}</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            {t('landing', 'nichesSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {NICHES.map(({ icon: Icon, title, description, color }) => {
            const c = COLOR_MAP[color]
            return (
              <div
                key={title}
                className={`rounded-2xl border ${c.border} ${c.bg} p-6 flex flex-col gap-4`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-2">{title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
