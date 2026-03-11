import {
  Calendar,
  Clock,
  Building2,
  Smartphone,
  BarChart3,
  ShieldCheck,
} from "lucide-react"

const FEATURES = [
  {
    icon: Calendar,
    title: "Онлайн-бронирование 24/7",
    description: "Клиенты записываются в любое время без звонков и мессенджеров.",
  },
  {
    icon: Clock,
    title: "Управление расписанием",
    description: "Гибкие рабочие часы для каждого специалиста или ресурса.",
  },
  {
    icon: Building2,
    title: "Мультитенантность",
    description: "Каждый бизнес — отдельный аккаунт с изолированными данными.",
  },
  {
    icon: Smartphone,
    title: "Адаптивный дизайн",
    description: "Страница бронирования отлично выглядит на любом устройстве.",
  },
  {
    icon: BarChart3,
    title: "Dashboard с аналитикой",
    description: "Бронирования, клиенты и ресурсы в одном удобном интерфейсе.",
  },
  {
    icon: ShieldCheck,
    title: "Защита от спама",
    description: "Лимиты бронирований по номеру телефона предотвращают злоупотребления.",
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">Возможности</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Всё необходимое для приёма онлайн-записей — из коробки, без настройки разработчиков.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-zinc-200 p-6 flex gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 mb-1 text-sm">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
