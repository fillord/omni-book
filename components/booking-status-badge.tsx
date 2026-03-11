import { Badge } from '@/components/ui/badge'

export type BookingStatusValue =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'

const STATUS_CONFIG: Record<
  BookingStatusValue,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Ожидает',
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
  },
  CONFIRMED: {
    label: 'Подтверждено',
    className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  },
  COMPLETED: {
    label: 'Завершено',
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  },
  CANCELLED: {
    label: 'Отменено',
    className: '',  // secondary variant
  },
  NO_SHOW: {
    label: 'Не пришёл',
    className: '',  // destructive variant
  },
}

type Props = {
  status: BookingStatusValue
}

export function BookingStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status]

  if (status === 'CANCELLED') {
    return <Badge variant="secondary">{config.label}</Badge>
  }
  if (status === 'NO_SHOW') {
    return <Badge variant="destructive">{config.label}</Badge>
  }

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
