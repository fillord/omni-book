'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  end: number
  duration?: number
  className?: string
}

export function CountUp({ end, duration = 1200, className = '' }: Props) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()

          function step(now: number) {
            const progress = Math.min((now - startTime) / duration, 1)
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * end))
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
  }, [end, duration])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value.toLocaleString('ru-RU')}
    </span>
  )
}
