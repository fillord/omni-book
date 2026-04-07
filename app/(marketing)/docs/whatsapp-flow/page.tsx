import Link from "next/link"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

const flowSteps = [
  {
    actor: "Клиент",
    step: "Записывается на услугу через публичную страницу бронирования.",
  },
  {
    actor: "Клиент",
    step: "После успешной записи видит экран подтверждения с кнопкой «Написать в WhatsApp».",
  },
  {
    actor: "Клиент",
    step: "Нажимает кнопку — открывается WhatsApp с предзаполненным сообщением, содержащим детали записи (дата, время, услуга, имя).",
  },
  {
    actor: "Менеджер",
    step: "Получает сообщение в WhatsApp. Проверяет детали записи и отправляет клиенту ссылку на оплату через Paylink.kz.",
  },
  {
    actor: "Клиент",
    step: "Переходит по ссылке и оплачивает предоплату картой любого банка.",
  },
  {
    actor: "Менеджер",
    step: "Видит подтверждение платежа в Paylink.kz и подтверждает запись в dashboard.",
  },
]

const tips = [
  "Кнопка WhatsApp появляется только на экране успешной записи — клиент видит её сразу после бронирования.",
  "Предзаполненное сообщение включает: имя клиента, услугу, дату и время, имя ресурса.",
  "Ссылку Paylink.kz менеджер генерирует вручную в личном кабинете Paylink.kz или через сохранённый шаблон.",
  "Этот способ подходит для бизнесов, которые предпочитают ручное подтверждение оплаты вместо автоматической обработки.",
  "WhatsApp-поток работает параллельно с автоматическими email и Telegram уведомлениями.",
]

export default function WhatsAppFlowPage() {
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
            <h1 className="text-3xl font-bold text-foreground mb-2">WhatsApp-оплата</h1>
            <p className="text-muted-foreground">
              Как менеджеру принимать предоплату от клиентов через WhatsApp и Paylink.kz.
            </p>
          </div>

          <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 mb-6">
            <h2 className="text-base font-semibold text-foreground mb-2">Что такое WhatsApp-оплата?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              После того как клиент записывается на платную услугу, на экране подтверждения появляется
              кнопка «Написать в WhatsApp». Нажав её, клиент открывает WhatsApp с предзаполненным
              сообщением. Менеджер получает это сообщение и вручную отправляет клиенту ссылку на оплату
              через Paylink.kz. Это альтернатива автоматической онлайн-оплате — подходит для бизнесов,
              предпочитающих ручное подтверждение.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-foreground mb-4">Пошаговый процесс</h2>
          <div className="space-y-3 mb-10">
            {flowSteps.map(({ actor, step }, i) => (
              <div key={i} className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-5 flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl neu-inset bg-[var(--neu-bg)] text-xs font-bold text-neu-accent">
                  {i + 1}
                </div>
                <div>
                  <span className="text-xs font-semibold text-neu-accent uppercase tracking-wide">{actor}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{step}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 mb-10">
            <h2 className="text-base font-semibold text-foreground mb-4">Полезные советы</h2>
            <ul className="space-y-2.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neu-accent" />
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Есть вопросы по WhatsApp-оплате?</p>
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
