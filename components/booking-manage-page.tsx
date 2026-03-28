"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SerializedBooking {
  id: string
  guestName: string | null
  guestPhone: string | null
  startsAt: string
  endsAt: string
  status: string
  serviceName: string
  serviceId: string
  serviceDurationMin: number
  resourceName: string
  resourceId: string
  tenantName: string
  tenantPhone: string | null
  tenantSlug: string
  tenantTimezone: string
}

interface BookingManagePageProps {
  booking: SerializedBooking
  canManage: boolean
  token: string
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Подтверждено',
  PENDING: 'Ожидает подтверждения',
  CANCELLED: 'Отменено',
  COMPLETED: 'Завершено',
  NO_SHOW: 'Не явился',
}

const TERMINAL_STATUSES = ['CANCELLED', 'COMPLETED', 'NO_SHOW']

export function BookingManagePage({ booking, canManage, token }: BookingManagePageProps) {
  const [cancelled, setCancelled] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    timeZone: booking.tenantTimezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(booking.startsAt))

  async function handleCancel() {
    setError(null)
    setCancelling(true)
    try {
      const res = await fetch(`/api/manage/${token}/cancel`, { method: 'POST' })
      if (res.ok) {
        setCancelled(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Произошла ошибка. Попробуйте позже.')
      }
    } finally {
      setCancelling(false)
    }
  }

  const isTerminal = TERMINAL_STATUSES.includes(booking.status)

  return (
    <div className="bg-[var(--neu-bg)] min-h-screen flex items-center justify-center p-4">
      <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6 max-w-md w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">{booking.tenantName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление записью</p>
        </div>

        {/* Booking details */}
        <div className="space-y-3">
          {booking.serviceName && (
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Услуга</span>
              <span className="text-sm text-foreground font-medium">{booking.serviceName}</span>
            </div>
          )}
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Специалист / Ресурс</span>
            <span className="text-sm text-foreground font-medium">{booking.resourceName}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Дата и время</span>
            <span className="text-sm text-foreground font-medium capitalize">{formattedDate}</span>
          </div>
          {booking.guestName && (
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Имя</span>
              <span className="text-sm text-foreground font-medium">{booking.guestName}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Статус</span>
            <span className="text-sm font-medium neu-raised bg-[var(--neu-bg)] px-2 py-0.5 rounded-lg text-foreground">
              {STATUS_LABELS[booking.status] ?? booking.status}
            </span>
          </div>
        </div>

        {/* Action section */}
        {cancelled ? (
          <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center">
            <p className="text-green-600 font-medium">Запись отменена</p>
            <p className="text-sm text-muted-foreground mt-1">Ваша запись успешно отменена.</p>
          </div>
        ) : isTerminal ? (
          <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {STATUS_LABELS[booking.status] ?? booking.status}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {canManage ? (
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Отмена...' : 'Отменить запись'}
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  disabled
                >
                  Перенести
                </Button>
              </div>
            ) : (
              <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Для отмены или переноса, пожалуйста, свяжитесь с нами напрямую
                </p>
                {booking.tenantPhone && (
                  <div className="text-center">
                    <a
                      href={`tel:${booking.tenantPhone}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {booking.tenantPhone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
