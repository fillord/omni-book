"use client"

import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n/context'

export type BookingStatusValue =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'

const STATUS_CONFIG: Record<
  BookingStatusValue,
  { className: string }
> = {
  PENDING: {
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
  },
  CONFIRMED: {
    className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  },
  COMPLETED: {
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  },
  CANCELLED: {
    className: '',  // secondary variant
  },
  NO_SHOW: {
    className: '',  // destructive variant
  },
}

type Props = {
  status: BookingStatusValue
}

export function BookingStatusBadge({ status }: Props) {
  const { t } = useI18n()
  const config = STATUS_CONFIG[status]
  const label = t('status', status)

  if (status === 'CANCELLED') {
    return <Badge variant="secondary">{label}</Badge>
  }
  if (status === 'NO_SHOW') {
    return <Badge variant="destructive">{label}</Badge>
  }

  return (
    <Badge variant="outline" className={config.className}>
      {label}
    </Badge>
  )
}
