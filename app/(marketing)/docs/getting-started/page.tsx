import Link from "next/link"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

const steps = [
  {
    number: 1,
    title: "Перейдите на сайт и создайте аккаунт",
    body: "Откройте omni-book.site и нажмите «Начать бесплатно». Введите ваш номер телефона и email — система отправит вам OTP-код для подтверждения.",
  },
  {
    number: 2,
    title: "Подтвердите номер телефона",
    body: "Введите OTP-код из SMS или Telegram. После успешной авторизации вы попадёте в личный кабинет.",
  },
  {
    number: 3,
    title: "Введите данные вашего бизнеса",
    body: "После входа укажите название вашего бизнеса и выберите нишу: красота, медицина, спорт или HoReCa. Платформа адаптирует интерфейс и поля под вашу сферу.",
  },
  {
    number: 4,
    title: "Добавьте первый ресурс",
    body: "Перейдите в раздел «Ресурсы» и добавьте первого специалиста, кабинет, столик или другой объект бронирования. Укажите имя, тип ресурса и рабочее расписание.",
  },
  {
    number: 5,
    title: "Создайте первую услугу",
    body: "В разделе «Услуги» добавьте услугу: укажите название, длительность и цену. Привяжите её к ресурсу, чтобы клиенты могли записываться.",
  },
  {
    number: 6,
    title: "Поделитесь ссылкой с клиентами",
    body: "В разделе «Публичная страница» скопируйте вашу персональную ссылку на страницу бронирования и отправьте её клиентам — через Instagram, WhatsApp, 2ГИС или на сайте.",
  },
]

export default function GettingStartedPage() {
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Начало работы</h1>
            <p className="text-muted-foreground">
              Пошаговая инструкция: от регистрации до первой записи клиента.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map(({ number, title, body }) => (
              <div key={number} className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl neu-inset bg-[var(--neu-bg)] text-neu-accent font-bold text-sm">
                  {number}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">{title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Остались вопросы?</p>
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
