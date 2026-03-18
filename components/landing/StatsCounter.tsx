"use client"

import { useEffect, useRef, useState } from "react"
import { useI18n } from "@/lib/i18n/context"

interface StatItem {
  value: number
  suffix?: string
  label: string
}

function AnimatedNumber({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [current, setCurrent] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()
          const duration = 1500
          function step(now: number) {
            const progress = Math.min((now - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCurrent(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end])

  return (
    <span ref={ref} className="tabular-nums">
      {current.toLocaleString('ru-RU')}{suffix}
    </span>
  )
}

export function StatsCounter() {
  const { locale } = useI18n()

  const stats: StatItem[] = locale === 'en'
    ? [
        { value: 300, suffix: '+', label: 'Businesses trust us' },
        { value: 5000, suffix: '+', label: 'Bookings made' },
        { value: 4, label: 'Business niches' },
        { value: 99, suffix: '%', label: 'Uptime' },
      ]
    : locale === 'kz'
    ? [
        { value: 300, suffix: '+', label: 'Бизнес сенеді' },
        { value: 5000, suffix: '+', label: 'Жазылулар жасалды' },
        { value: 4, label: 'Бизнес нишалар' },
        { value: 99, suffix: '%', label: 'Жұмыс уақыты' },
      ]
    : [
        { value: 300, suffix: '+', label: 'Бизнесов доверяют' },
        { value: 5000, suffix: '+', label: 'Бронирований создано' },
        { value: 4, label: 'Бизнес-ниши' },
        { value: 99, suffix: '%', label: 'Uptime' },
      ]

  return (
    <section className="py-16 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">
                <AnimatedNumber end={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
