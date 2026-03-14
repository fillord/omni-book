"use client"

import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n/context'
import { Clock, CheckCircle, XCircle, CheckCheck, AlertTriangle } from 'lucide-react'

export type BookingStatusValue =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'

const STATUS_CONFIG: Record<
  BookingStatusValue,
  { className: string; icon: React.ElementType; dotColor?: string }
> = {
  PENDING: {
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
    icon: Clock,
    dotColor: 'bg-amber-500',
  },
  CONFIRMED: {
    className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
    icon: CheckCircle,
  },
  COMPLETED: {
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCheck,
  },
  CANCELLED: {
    className: 'bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400',
    icon: XCircle,
  },
  NO_SHOW: {
    className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
    icon: AlertTriangle,
  },
}

type Props = {
  status: BookingStatusValue
}

export function BookingStatusBadge({ status }: Props) {
  const { t } = useI18n()
  const config = STATUS_CONFIG[status]
  const label = t('status', status)
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
      {config.dotColor ? (
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.dotColor}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dotColor}`} />
        </span>
      ) : (
        <Icon className="h-3 w-3" />
      )}
      {label}
    </Badge>
  )
}
