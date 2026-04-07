import Link from "next/link"
import { Check } from "lucide-react"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

const plans = [
  {
    name: "Free",
    price: "Бесплатно",
    features: [
      "1 ресурс",
      "50 бронирований в месяц",
      "Публичная страница",
      "Базовый dashboard",
    ],
  },
  {
    name: "Pro",
    price: "Платный тариф",
    highlight: true,
    features: [
      "Безлимитные ресурсы и услуги",
      "Безлимит бронирований",
      "Email и Telegram уведомления",
      "CRM и аналитика",
      "Приоритетная поддержка",
    ],
  },
  {
    name: "Enterprise",
    price: "По договору",
    features: [
      "Индивидуальные условия",
      "Кастомные интеграции",
      "Выделенная поддержка",
      "SLA-гарантии",
      "Контракт и закрывающие документы",
    ],
  },
]

const upgradeSteps = [
  "Войдите в личный кабинет dashboard.",
  "Перейдите в раздел «Оплата и тарифы» (Billing).",
  "Нажмите кнопку «Перейти на Pro».",
  "Вы будете перенаправлены на страницу оплаты Paylink.kz.",
  "Оплатите картой любого банка.",
  "После подтверждения платежа тариф Pro активируется автоматически.",
]

export default function BillingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--neu-bg)] py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Назад к документации
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-2">Управление тарифами</h1>
            <p className="text-muted-foreground">
              Сравнение планов и инструкция по переходу на Pro через Paylink.kz.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-foreground mb-4">Тарифные планы</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {plans.map(({ name, price, features, highlight }) => (
              <div
                key={name}
                className={`neu-raised bg-[var(--neu-bg)] rounded-2xl p-5 flex flex-col gap-4 ${
                  highlight ? "ring-2 ring-neu-accent/40" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-0.5">{name}</p>
                  <p className={`text-lg font-bold ${highlight ? "text-neu-accent" : "text-foreground"}`}>{price}</p>
                </div>
                <ul className="space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neu-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 mb-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Как перейти на Pro</h2>
            <ol className="space-y-2.5">
              {upgradeSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full neu-inset bg-[var(--neu-bg)] text-xs font-semibold text-neu-accent">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-5 mb-10">
            <h3 className="text-sm font-semibold text-foreground mb-1">Оплата через Paylink.kz</h3>
            <p className="text-sm text-muted-foreground">
              Платежи принимаются через Paylink.kz — защищённый казахстанский платёжный шлюз.
              Поддерживаются карты Visa, Mastercard и карты казахстанских банков.
              Подписка ежемесячная и активируется сразу после подтверждения оплаты.
            </p>
          </div>

          <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Нужен Enterprise или есть вопросы по оплате?</p>
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
