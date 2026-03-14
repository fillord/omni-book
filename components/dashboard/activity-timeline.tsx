'use client'

import { CalendarCheck, XCircle, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

type ActivityItem = {
  id: string
  type: 'booking_created' | 'booking_cancelled' | 'booking_completed' | 'booking_no_show'
  guestName: string | null
  serviceName: string | null
  resourceName: string
  createdAt: string
}

const ICON_MAP: Record<ActivityItem['type'], { icon: React.ElementType; color: string }> = {
  booking_created:   { icon: CalendarCheck, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  booking_cancelled: { icon: XCircle,       color: 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800' },
  booking_completed: { icon: CalendarCheck, color: 'text-green-500 bg-green-50 dark:bg-green-950/40' },
  booking_no_show:   { icon: Clock,         color: 'text-red-500 bg-red-50 dark:bg-red-950/40' },
}

function relativeTime(dateStr: string, locale: string): string {
  const now = Date.now()
  const d = new Date(dateStr).getTime()
  const diff = Math.max(0, now - d)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (locale === 'en') {
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }
  // ru / kz
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  if (hours < 24) return `${hours} ч назад`
  return `${days} дн назад`
}

interface Props {
  activities: ActivityItem[]
}

export function ActivityTimeline({ activities }: Props) {
  const { locale } = useI18n()

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {locale === 'en' ? 'No recent activity' : 'Нет недавней активности'}
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {activities.map((item, idx) => {
        const cfg = ICON_MAP[item.type]
        const Icon = cfg.icon

        const actionText =
          item.type === 'booking_created' ? (locale === 'en' ? 'booked' : 'записался на')
          : item.type === 'booking_cancelled' ? (locale === 'en' ? 'cancelled' : 'отменил')
          : item.type === 'booking_completed' ? (locale === 'en' ? 'completed' : 'завершил')
          : (locale === 'en' ? 'no-show' : 'не пришёл на')

        return (
          <div
            key={item.id}
            className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50 animate-slide-up`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                <span className="font-medium">{item.guestName || '—'}</span>{' '}
                <span className="text-muted-foreground">{actionText}</span>{' '}
                <span className="font-medium">{item.serviceName || item.resourceName}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {relativeTime(item.createdAt, locale)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export type { ActivityItem }
