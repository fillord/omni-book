"use client"

import { useState, useEffect } from 'react'
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

function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const y = tomorrow.getFullYear()
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const d = String(tomorrow.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTodayDate(): string {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const ny = date.getFullYear()
  const nm = String(date.getMonth() + 1).padStart(2, '0')
  const nd = String(date.getDate()).padStart(2, '0')
  return `${ny}-${nm}-${nd}`
}

export function BookingManagePage({ booking, canManage, token }: BookingManagePageProps) {
  const [cancelled, setCancelled] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reschedule state
  const [rescheduleMode, setRescheduleMode] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [slots, setSlots] = useState<Array<{ time: string; startsAt: string; endsAt: string; available: boolean }>>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ startsAt: string; endsAt: string } | null>(null)
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduled, setRescheduled] = useState(false)

  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    timeZone: booking.tenantTimezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(booking.startsAt))

  // Slot fetching effect when rescheduleMode is active and selectedDate changes
  useEffect(() => {
    if (!rescheduleMode || !selectedDate) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    fetch(
      `/api/bookings/slots?tenantSlug=${encodeURIComponent(booking.tenantSlug)}&resourceId=${booking.resourceId}&serviceId=${booking.serviceId}&date=${selectedDate}`
    )
      .then(res => res.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [rescheduleMode, selectedDate, booking.tenantSlug, booking.resourceId, booking.serviceId])

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

  async function handleReschedule() {
    if (!selectedSlot) return
    setRescheduling(true)
    setError(null)
    try {
      const res = await fetch(`/api/manage/${token}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startsAt: selectedSlot.startsAt, endsAt: selectedSlot.endsAt }),
      })
      if (res.ok) {
        setRescheduled(true)
        setRescheduleMode(false)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Ошибка при переносе')
      }
    } finally {
      setRescheduling(false)
    }
  }

  function openRescheduleMode() {
    setSelectedDate(getTomorrowDate())
    setSlots([])
    setSelectedSlot(null)
    setError(null)
    setRescheduleMode(true)
  }

  const isTerminal = TERMINAL_STATUSES.includes(booking.status)
  const today = getTodayDate()

  const formattedSelectedDate = selectedDate
    ? new Intl.DateTimeFormat('ru-RU', {
        timeZone: booking.tenantTimezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(selectedDate + 'T12:00:00'))
    : ''

  // Format rescheduled slot time for success message
  const rescheduledSlotDisplay = rescheduled && selectedSlot
    ? new Intl.DateTimeFormat('ru-RU', {
        timeZone: booking.tenantTimezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(selectedSlot.startsAt))
    : null

  const availableSlots = slots.filter(s => s.available)

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
        ) : rescheduled ? (
          <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center space-y-1">
            <p className="text-green-600 font-medium">Запись перенесена</p>
            {rescheduledSlotDisplay && (
              <p className="text-sm text-muted-foreground capitalize">{rescheduledSlotDisplay}</p>
            )}
          </div>
        ) : isTerminal ? (
          <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {STATUS_LABELS[booking.status] ?? booking.status}
            </p>
          </div>
        ) : rescheduleMode ? (
          /* Reschedule calendar UI */
          <div className="space-y-4">
            {/* Back button */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => { setRescheduleMode(false); setError(null) }}
            >
              Назад
            </Button>

            {/* Date navigation */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground text-center">Выберите дату</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="flex-none px-3"
                  onClick={() => {
                    const prev = addDays(selectedDate, -1)
                    if (prev >= today) setSelectedDate(prev)
                  }}
                  disabled={selectedDate <= today}
                >
                  ‹
                </Button>
                <div className="flex-1 neu-inset bg-[var(--neu-bg)] rounded-xl p-2 text-center">
                  <p className="text-sm text-foreground capitalize">{formattedSelectedDate}</p>
                </div>
                <Button
                  variant="ghost"
                  className="flex-none px-3"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                >
                  ›
                </Button>
              </div>
            </div>

            {/* Slot grid */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Доступное время</p>
              {loadingSlots ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Загрузка слотов...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">Нет доступных слотов на эту дату</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.startsAt}
                      onClick={() => setSelectedSlot({ startsAt: slot.startsAt, endsAt: slot.endsAt })}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        selectedSlot?.startsAt === slot.startsAt
                          ? 'neu-inset bg-[var(--neu-bg)] font-semibold'
                          : 'neu-raised bg-[var(--neu-bg)] hover:opacity-80'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm reschedule button */}
            {selectedSlot && (
              <Button
                variant="default"
                className="w-full"
                onClick={handleReschedule}
                disabled={rescheduling}
              >
                {rescheduling ? 'Перенос...' : 'Подтвердить перенос'}
              </Button>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
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
                  onClick={openRescheduleMode}
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
