"use client"

import { useState, useRef } from 'react'
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

// Minimum ms between page load and a destructive action being confirmed.
// Bots execute JS instantly; real users take at least this long.
const BOT_HONEYPOT_MS = 2000

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

function formatDate(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function BookingManagePage({ booking, canManage, token }: BookingManagePageProps) {
  // ── Honeypot ──────────────────────────────────────────────────────────────
  // Records when the component first mounts (client-side). Any destructive
  // confirmation that arrives within BOT_HONEYPOT_MS is rejected as a bot.
  // useRef, not useState — value is set once and never causes a re-render.
  const mountedAt = useRef(Date.now())

  function isHuman(): boolean {
    return Date.now() - mountedAt.current >= BOT_HONEYPOT_MS
  }

  // ── Cancel state ──────────────────────────────────────────────────────────
  const [cancelled, setCancelled]           = useState(false)
  const [cancelling, setCancelling]         = useState(false)
  // showCancelConfirm: true = "Are you sure?" UI is visible.
  // The FIRST "Cancel" button only sets this flag — it does NOT call the API.
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // ── Reschedule state ──────────────────────────────────────────────────────
  const [rescheduleMode, setRescheduleMode]   = useState(false)
  const [selectedDate, setSelectedDate]       = useState<string>('')
  const [slots, setSlots]                     = useState<Array<{ time: string; startsAt: string; endsAt: string; available: boolean }>>([])
  const [loadingSlots, setLoadingSlots]       = useState(false)
  const [selectedSlot, setSelectedSlot]       = useState<{ startsAt: string; endsAt: string } | null>(null)
  const [rescheduling, setRescheduling]       = useState(false)
  const [rescheduledStartsAt, setRescheduledStartsAt] = useState<string | null>(null)

  // ── Shared ────────────────────────────────────────────────────────────────
  const [error, setError]   = useState<string | null>(null)
  const inFlight            = useRef(false)   // prevents double-submit

  const displayStartsAt = rescheduledStartsAt ?? booking.startsAt
  const formattedDate   = formatDate(displayStartsAt, booking.tenantTimezone)

  // ── Slot fetching — explicit, no useEffect ────────────────────────────────
  function fetchSlotsForDate(date: string) {
    setLoadingSlots(true)
    setSelectedSlot(null)
    fetch(
      `/api/bookings/slots?tenantSlug=${encodeURIComponent(booking.tenantSlug)}&resourceId=${booking.resourceId}&serviceId=${booking.serviceId}&date=${date}`
    )
      .then(res => res.json())
      .then(data => { setSlots(data.slots ?? []) })
      .catch(() => { setSlots([]) })
      .finally(() => { setLoadingSlots(false) })
  }

  // ── Step 1: show confirmation UI (NO API call yet) ────────────────────────
  function requestCancel() {
    setError(null)
    setShowCancelConfirm(true)
  }

  function dismissCancel() {
    setShowCancelConfirm(false)
    setError(null)
  }

  // ── Step 2: user clicked "Да, отменить" ───────────────────────────────────
  // Honeypot guard runs here. Only then is the POST request sent.
  async function confirmCancel() {
    if (!isHuman()) {
      // Arrived too fast — bot detected, silently ignore.
      setShowCancelConfirm(false)
      return
    }
    if (inFlight.current) return
    inFlight.current = true
    setError(null)
    setCancelling(true)
    try {
      const res = await fetch(`/api/manage/${token}/cancel`, { method: 'POST' })
      if (res.ok) {
        setCancelled(true)
        setShowCancelConfirm(false)
      } else {
        const data = await res.json().catch(() => ({}))
        const msg: string = data.error ?? ''
        if (res.status === 422 && (msg.includes('отменена') || msg.includes('завершена'))) {
          setCancelled(true)
          setShowCancelConfirm(false)
        } else {
          setError(msg || 'Произошла ошибка. Попробуйте позже.')
        }
      }
    } finally {
      setCancelling(false)
      inFlight.current = false
    }
  }

  // ── Reschedule confirm — also guarded by honeypot ─────────────────────────
  async function handleReschedule() {
    if (!selectedSlot || inFlight.current) return
    if (!isHuman()) return   // bot honeypot
    inFlight.current = true
    setRescheduling(true)
    setError(null)
    try {
      const res = await fetch(`/api/manage/${token}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startsAt: selectedSlot.startsAt, endsAt: selectedSlot.endsAt }),
      })
      if (res.ok) {
        setRescheduledStartsAt(selectedSlot.startsAt)
        setRescheduleMode(false)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Ошибка при переносе')
      }
    } finally {
      setRescheduling(false)
      inFlight.current = false
    }
  }

  function openRescheduleMode() {
    const tomorrow = getTomorrowDate()
    setSelectedDate(tomorrow)
    setSlots([])
    setSelectedSlot(null)
    setError(null)
    setShowCancelConfirm(false)
    setRescheduleMode(true)
    fetchSlotsForDate(tomorrow)
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const isTerminal  = TERMINAL_STATUSES.includes(booking.status)
  const today       = getTodayDate()
  const rescheduled = rescheduledStartsAt !== null

  const formattedSelectedDate = selectedDate
    ? new Intl.DateTimeFormat('ru-RU', {
        timeZone: booking.tenantTimezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(selectedDate + 'T12:00:00'))
    : ''

  const rescheduledSlotDisplay = rescheduled && rescheduledStartsAt
    ? formatDate(rescheduledStartsAt, booking.tenantTimezone)
    : null

  const availableSlots = slots.filter(s => s.available)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[var(--neu-bg)] min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">

        {/* Page header */}
        <div className="text-center pb-1">
          <h1 className="text-xl font-semibold text-foreground">{booking.tenantName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление записью</p>
        </div>

        {/* Booking info card — always visible */}
        <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Текущая запись
          </p>

          <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 space-y-2">
            {booking.serviceName && (
              <div className="flex justify-between items-center gap-3">
                <span className="text-sm text-muted-foreground shrink-0">Услуга</span>
                <span className="text-sm text-foreground font-semibold text-right">{booking.serviceName}</span>
              </div>
            )}
            <div className="flex justify-between items-center gap-3">
              <span className="text-sm text-muted-foreground shrink-0">Специалист</span>
              <span className="text-sm text-foreground font-medium text-right">{booking.resourceName}</span>
            </div>
            <div className="flex justify-between items-start gap-3">
              <span className="text-sm text-muted-foreground shrink-0">Дата и время</span>
              <span className="text-sm text-foreground font-medium text-right capitalize">{formattedDate}</span>
            </div>
            {booking.guestName && (
              <div className="flex justify-between items-center gap-3">
                <span className="text-sm text-muted-foreground shrink-0">Клиент</span>
                <span className="text-sm text-foreground font-medium text-right">{booking.guestName}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Статус</span>
            <span className="text-sm font-medium neu-raised bg-[var(--neu-bg)] px-3 py-1 rounded-lg text-foreground">
              {cancelled
                ? STATUS_LABELS['CANCELLED']
                : STATUS_LABELS[booking.status] ?? booking.status}
            </span>
          </div>
        </div>

        {/* Actions card */}
        <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-5">
          {cancelled ? (
            /* ── Already cancelled ── */
            <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center space-y-1">
              <p className="text-green-600 font-medium">Запись отменена</p>
              <p className="text-sm text-muted-foreground">Ваша запись успешно отменена.</p>
            </div>

          ) : rescheduled ? (
            /* ── Already rescheduled ── */
            <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center space-y-1">
              <p className="text-green-600 font-medium">Запись перенесена</p>
              {rescheduledSlotDisplay && (
                <p className="text-sm text-muted-foreground capitalize">{rescheduledSlotDisplay}</p>
              )}
            </div>

          ) : isTerminal ? (
            /* ── Terminal status from DB ── */
            <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {STATUS_LABELS[booking.status] ?? booking.status}
              </p>
            </div>

          ) : rescheduleMode ? (
            /* ── Reschedule flow ── */
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => { setRescheduleMode(false); setError(null) }}
              >
                Назад
              </Button>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground text-center">Выберите дату</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-none px-3"
                    disabled={selectedDate <= today}
                    onClick={() => {
                      const prev = addDays(selectedDate, -1)
                      if (prev >= today) { setSelectedDate(prev); fetchSlotsForDate(prev) }
                    }}
                  >
                    ‹
                  </Button>
                  <div className="flex-1 neu-inset bg-[var(--neu-bg)] rounded-xl p-2 text-center">
                    <p className="text-sm text-foreground capitalize">{formattedSelectedDate}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-none px-3"
                    onClick={() => {
                      const next = addDays(selectedDate, 1)
                      setSelectedDate(next); fetchSlotsForDate(next)
                    }}
                  >
                    ›
                  </Button>
                </div>
              </div>

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
                        type="button"
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

              {/* Reschedule confirm — honeypot runs inside handleReschedule */}
              {selectedSlot && (
                <Button
                  type="button"
                  variant="default"
                  className="w-full"
                  onClick={handleReschedule}
                  disabled={rescheduling}
                >
                  {rescheduling ? 'Перенос...' : 'Подтвердить перенос'}
                </Button>
              )}

              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>

          ) : showCancelConfirm ? (
            /* ── Step 2: "Are you sure?" — actual POST only fires here ── */
            <div className="space-y-3">
              <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">Вы уверены?</p>
                <p className="text-xs text-muted-foreground">Отменить запись нельзя будет отменить.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Отмена...' : 'Да, отменить'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={dismissCancel}
                  disabled={cancelling}
                >
                  Нет, оставить
                </Button>
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>

          ) : canManage ? (
            /* ── Step 1: main action buttons — no API call ── */
            <div className="space-y-3">
              <div className="flex gap-3">
                {/* type="button" — never a submit, never triggers on Enter/form */}
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={requestCancel}
                >
                  Отменить запись
                </Button>
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={openRescheduleMode}
                >
                  Перенести
                </Button>
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>

          ) : (
            /* ── Cannot manage (within 4h cutoff) ── */
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
        </div>

      </div>
    </div>
  )
}
