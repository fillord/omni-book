import Link from "next/link"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

const sections = [
  {
    title: "Рабочие часы",
    steps: [
      "Перейдите в «Настройки» вашего филиала.",
      "В разделе «Часы работы» задайте время открытия и закрытия для каждого дня недели.",
      "Выберите часовой пояс — по умолчанию стоит Asia/Almaty.",
      "Выходные дни оставьте пустыми или отметьте как нерабочие.",
    ],
  },
  {
    title: "Ресурсы",
    steps: [
      "В разделе «Ресурсы» нажмите «Добавить ресурс».",
      "Укажите имя специалиста или название кабинета, комнаты, стола.",
      "Задайте индивидуальное расписание ресурса, если оно отличается от общего.",
      "Заморозьте ресурс, если он временно недоступен — записи к нему перестанут приниматься.",
    ],
  },
  {
    title: "Услуги",
    steps: [
      "В разделе «Услуги» нажмите «Добавить услугу».",
      "Введите название, длительность (в минутах) и стоимость.",
      "Выберите цветовую метку для удобного отображения в календаре.",
      "Привяжите услугу к одному или нескольким ресурсам.",
    ],
  },
  {
    title: "Уведомления в Telegram",
    steps: [
      "Перейдите в «Настройки» → «Уведомления».",
      "Найдите раздел Telegram и нажмите «Подключить бота».",
      "Откройте Telegram и запустите бот omni_book_bot командой /start.",
      "После подключения вы будете мгновенно получать уведомления о новых и отменённых записях.",
    ],
  },
]

export default function BranchSetupPage() {
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Настройка филиала</h1>
            <p className="text-muted-foreground">
              Рабочие часы, ресурсы, услуги и Telegram-уведомления.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map(({ title, steps }) => (
              <div key={title} className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6">
                <h2 className="text-base font-semibold text-foreground mb-4">{title}</h2>
                <ol className="space-y-2.5">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full neu-inset bg-[var(--neu-bg)] text-xs font-semibold text-neu-accent">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className="mt-10 neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Нужна помощь с настройкой?</p>
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
