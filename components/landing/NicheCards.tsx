import { Stethoscope, Scissors, UtensilsCrossed, Dumbbell } from "lucide-react"

const NICHES = [
  {
    icon: Stethoscope,
    title: "Медицина и клиники",
    description: "Запись к врачу онлайн, управление расписанием специалистов, история приёмов и напоминания пациентам.",
    color: "blue" as const,
  },
  {
    icon: Scissors,
    title: "Салоны красоты",
    description: "Бронирование мастеров, услуг и кабинетов. Клиенты записываются сами — вы просто работаете.",
    color: "pink" as const,
  },
  {
    icon: UtensilsCrossed,
    title: "Рестораны и кафе",
    description: "Резервация столиков, управление залом и временными слотами. Подходит для антикафе и банкетных залов.",
    color: "orange" as const,
  },
  {
    icon: Dumbbell,
    title: "Спорт и досуг",
    description: "Аренда кортов, студий и лофтов по часам. Онлайн-оплата и мгновенное подтверждение брони.",
    color: "green" as const,
  },
]

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    border: "border-blue-100",
    badge: "bg-blue-100 text-blue-700",
  },
  pink: {
    bg: "bg-pink-50",
    icon: "bg-pink-100 text-pink-600",
    border: "border-pink-100",
    badge: "bg-pink-100 text-pink-700",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-100 text-orange-600",
    border: "border-orange-100",
    badge: "bg-orange-100 text-orange-700",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    border: "border-green-100",
    badge: "bg-green-100 text-green-700",
  },
}

export function NicheCards() {
  return (
    <section id="niches" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">Для кого подходит</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Одна платформа адаптируется под нишу вашего бизнеса — интерфейс, поля и логика настраиваются автоматически.
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
