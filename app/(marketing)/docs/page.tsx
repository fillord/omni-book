import Link from "next/link"
import { BookOpen, Settings, CreditCard, ChevronRight } from "lucide-react"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

const sections = [
  {
    icon: BookOpen,
    title: "Начало работы",
    description: "Регистрация, первичная настройка и первая запись клиента.",
    href: "/docs/getting-started",
    items: [
      "Создание аккаунта и подключение тарифа",
      "Добавление первого ресурса и услуги",
      "Публичная страница записи — ваша ссылка для клиентов",
    ],
  },
  {
    icon: Settings,
    title: "Настройка филиала",
    description: "Управление расписанием, ресурсами, услугами и рабочими часами.",
    href: "/docs/branch-setup",
    items: [
      "Ресурсы — специалисты и кабинеты",
      "Услуги — длительность, стоимость, цвет",
      "Рабочие часы и временные зоны",
      "Уведомления в Telegram",
    ],
  },
  {
    icon: CreditCard,
    title: "Управление тарифами",
    description: "Тарифные планы, онлайн-оплата депозита и продление подписки.",
    href: "/docs/billing",
    items: [
      "Тарифы Free, Basic, Pro, Enterprise",
      "Подключение Kaspi Pay для приёма депозитов",
      "Продление подписки через Kaspi",
      "Enterprise — индивидуальные условия",
    ],
  },
]

export default function DocsPage() {
  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-[var(--neu-bg)] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← На главную
          </Link>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Документация</h1>
          <p className="text-muted-foreground">
            Быстрый старт и справочные материалы по omni-book.
          </p>
        </div>

        <div className="space-y-5">
          {sections.map(({ icon: Icon, title, description, href, items }) => (
            <div
              key={href}
              className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl neu-inset bg-[var(--neu-bg)]">
                  <Icon className="h-5 w-5 text-neu-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="text-base font-semibold text-foreground">{title}</h2>
                    <Link
                      href={href}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      Подробнее <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{description}</p>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neu-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Не нашли ответ?</p>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium
              bg-[var(--neu-bg)] text-foreground
              shadow-[4px_4px_8px_var(--neu-shadow-dark),-4px_-4px_8px_var(--neu-shadow-light)]
              hover:shadow-[2px_2px_4px_var(--neu-shadow-dark),-2px_-2px_4px_var(--neu-shadow-light)]
              transition-all duration-200"
          >
            Написать в поддержку
          </Link>
        </div>
      </div>
    </main>
    <Footer />
    </>
  )
}
