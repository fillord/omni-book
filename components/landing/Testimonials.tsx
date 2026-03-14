"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"

interface Testimonial {
  name: string
  role: string
  niche: string
  text: string
  avatar: string
}

const TESTIMONIALS_RU: Testimonial[] = [
  {
    name: "Айгуль Сатыбалдиева",
    role: "Владелец клиники",
    niche: "medicine",
    text: "OmniBook сократил количество звонков на 70%. Пациенты записываются сами, а мы видим всё в одном дашборде.",
    avatar: "АС",
  },
  {
    name: "Дана Серик",
    role: "Салон красоты",
    niche: "beauty",
    text: "Клиенты обожают записываться онлайн в любое время. Мастера наконец перестали путать записи. Рекомендую!",
    avatar: "ДС",
  },
  {
    name: "Марат Жумабеков",
    role: "Ресторатор",
    niche: "horeca",
    text: "Столики бронируются через сайт, гости приходят вовремя. Система работает безупречно даже в пиковые часы.",
    avatar: "МЖ",
  },
]

const TESTIMONIALS_EN: Testimonial[] = [
  {
    name: "Aigul S.",
    role: "Clinic Owner",
    niche: "medicine",
    text: "OmniBook reduced our phone calls by 70%. Patients book themselves and we see everything in one dashboard.",
    avatar: "AS",
  },
  {
    name: "Dana S.",
    role: "Beauty Salon",
    niche: "beauty",
    text: "Clients love being able to book anytime. Our stylists finally stopped mixing up appointments. Highly recommend!",
    avatar: "DS",
  },
  {
    name: "Marat Z.",
    role: "Restaurant Owner",
    niche: "horeca",
    text: "Tables are booked through the website, guests arrive on time. The system works flawlessly even during peak hours.",
    avatar: "MZ",
  },
]

const NICHE_COLORS: Record<string, string> = {
  medicine: "bg-blue-100 text-blue-700",
  beauty: "bg-pink-100 text-pink-700",
  horeca: "bg-orange-100 text-orange-700",
  sports: "bg-green-100 text-green-700",
}

export function Testimonials() {
  const { locale } = useI18n()
  const testimonials = locale === 'en' ? TESTIMONIALS_EN : TESTIMONIALS_RU
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length)
  }, [testimonials.length])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [paused, next])

  const sectionTitle = locale === 'en' ? 'What our clients say' : locale === 'kz' ? 'Клиенттер пікірлері' : 'Отзывы наших клиентов'
  const sectionSub = locale === 'en' ? 'Real businesses using OmniBook' : locale === 'kz' ? 'OmniBook қолданатын нақты бизнестер' : 'Реальные бизнесы используют OmniBook'

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">{sectionTitle}</h2>
          <p className="text-zinc-500">{sectionSub}</p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Testimonial card */}
          <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-8 md:p-10 text-center min-h-[220px] flex flex-col justify-center">
            <div key={active} className="animate-fade-in">
              <p className="text-lg md:text-xl text-zinc-700 leading-relaxed mb-6 italic">
                &ldquo;{testimonials[active].text}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${NICHE_COLORS[testimonials[active].niche] ?? 'bg-zinc-100 text-zinc-600'}`}>
                  {testimonials[active].avatar}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-zinc-900 text-sm">{testimonials[active].name}</p>
                  <p className="text-xs text-zinc-500">{testimonials[active].role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === active
                    ? 'bg-indigo-600 w-6'
                    : 'bg-zinc-300 hover:bg-zinc-400'
                }`}
                aria-label={`Testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
