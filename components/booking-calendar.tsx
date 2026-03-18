"use client"

'use client'

import { useState, useEffect } from 'react'
import { toZonedTime } from 'date-fns-tz'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BookingStatusBadge, type BookingStatusValue } from '@/components/booking-status-badge'
import { useI18n } from '@/lib/i18n/context'

// ---- constants -------------------------------------------------------------

const HOURS_START = 8
const HOURS_END = 20
const PX_PER_HOUR = 64
const PX_PER_MIN = PX_PER_HOUR / 60
const TOTAL_HEIGHT = (HOURS_END - HOURS_START) * PX_PER_HOUR
const HOURS = Array.from(
  { length: HOURS_END - HOURS_START + 1 },
  (_, i) => HOURS_START + i
)

// intentional: RESOURCE_PALETTE uses fixed pastel tints for resource color-coding
// (functional visual differentiation, not neutral backgrounds -- preserve in both modes)
const RESOURCE_PALETTE = [
  { bg: 'bg-blue-100 border-blue-300 text-blue-900', dot: 'bg-blue-500' },
  { bg: 'bg-purple-100 border-purple-300 text-purple-900', dot: 'bg-purple-500' },
  { bg: 'bg-emerald-100 border-emerald-300 text-emerald-900', dot: 'bg-emerald-500' },
  { bg: 'bg-orange-100 border-orange-300 text-orange-900', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100 border-pink-300 text-pink-900', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100 border-teal-300 text-teal-900', dot: 'bg-teal-500' },
]

// Day labels are now built dynamically from translations inside the component

// ---- types -----------------------------------------------------------------

export type CalendarBooking = {
  id: string
  startsAt: string
  endsAt: string
  status: BookingStatusValue
  guestName: string | null
  guestPhone: string | null
  guestEmail: string | null
  notes: string | null
  resourceId: string
  resource: { id: string; name: string; type: string }
  service: {
    id: string
    name: string
    durationMin: number
    price?: number | null
    currency?: string
  } | null
  user: { id: string; name: string | null; email: string } | null
}

export type CalendarData = {
  [resourceId: string]: {
    resourceName: string
    resourceType: string
    bookings: CalendarBooking[]
  }
}

type Props = {
  calendarData: CalendarData | null
  timezone: string
  tenantSlug: string
  weekStart: Date
  onWeekChange: (date: Date) => void
  onStatusChange: (bookingId: string, status: BookingStatusValue) => Promise<void>
  canEdit: boolean
  loading?: boolean
}

// ---- helpers ---------------------------------------------------------------

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDate(date: Date, locale = 'ru-RU'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date)
}

function formatTime(utcStr: string, timezone: string): string {
  const d = toZonedTime(new Date(utcStr), timezone)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function bookingTopPx(startsAt: string, timezone: string): number {
  const d = toZonedTime(new Date(startsAt), timezone)
  const mins = (d.getHours() - HOURS_START) * 60 + d.getMinutes()
  return Math.max(0, mins * PX_PER_MIN)
}

function bookingHeightPx(startsAt: string, endsAt: string): number {
  const durationMs = new Date(endsAt).getTime() - new Date(startsAt).getTime()
  const durationMin = durationMs / 60000
  return Math.max(durationMin * PX_PER_MIN, 22)
}

function getDateInTimezone(utcStr: string, timezone: string): Date {
  return toZonedTime(new Date(utcStr), timezone)
}

// Layout overlapping bookings into parallel tracks
interface LayoutBooking extends CalendarBooking {
  trackIdx: number
  maxTracks: number
}

function layoutBookings(bookings: CalendarBooking[]): LayoutBooking[] {
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  )

  const trackEnds: number[] = []

  const placed = sorted.map((b) => {
    const start = new Date(b.startsAt).getTime()
    const end = new Date(b.endsAt).getTime()

    let trackIdx = trackEnds.findIndex((et) => et <= start)
    if (trackIdx === -1) {
      trackIdx = trackEnds.length
      trackEnds.push(end)
    } else {
      trackEnds[trackIdx] = end
    }

    return { ...b, trackIdx, maxTracks: 0 }
  })

  const maxTracks = trackEnds.length
  return placed.map((b) => ({ ...b, maxTracks }))
}

// ---- ALLOWED TRANSITIONS (mirrors server) ----------------------------------

const TRANSITIONS: Partial<Record<BookingStatusValue, BookingStatusValue[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
}

// ---- BOOKING DETAIL DIALOG -------------------------------------------------

function BookingDetailDialog({
  booking,
  resourceColor,
  timezone,
  canEdit,
  onStatusChange,
  onClose,
}: {
  booking: CalendarBooking
  resourceColor: (typeof RESOURCE_PALETTE)[number]
  timezone: string
  canEdit: boolean
  onStatusChange: (id: string, status: BookingStatusValue) => Promise<void>
  onClose: () => void
}) {
  const { t } = useI18n()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allowed = TRANSITIONS[booking.status] ?? []

  const ACTION_LABELS: Record<BookingStatusValue, string> = {
    CONFIRMED: t('actions', 'confirm'),
    COMPLETED: t('actions', 'complete'),
    CANCELLED: t('actions', 'cancel'),
    NO_SHOW:   t('actions', 'noShow'),
    PENDING:   t('actions', 'pending'),
  }

  async function handleChange(status: BookingStatusValue) {
    setError(null)
    setPending(true)
    try {
      await onStatusChange(booking.id, status)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common', 'error'))
    } finally {
      setPending(false)
    }
  }

  const clientName =
    booking.user?.name ?? booking.guestName ?? '—'
  const clientPhone = booking.guestPhone ?? '—'

  return (
    <div className="space-y-4">
      {/* Service + resource */}
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 h-3 w-3 flex-none rounded-full ${resourceColor.dot}`}
        />
        <div>
          <p className="font-medium">{booking.service?.name ?? '—'}</p>
          <p className="text-sm text-muted-foreground">{booking.resource.name}</p>
        </div>
      </div>

      {/* Time */}
      <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
        <p>
          {formatTime(booking.startsAt, timezone)} — {formatTime(booking.endsAt, timezone)}
          {booking.service && (
            <span className="ml-2 text-muted-foreground">
              ({booking.service.durationMin} {t('booking', 'minutes')})
            </span>
          )}
        </p>
        <p className="text-muted-foreground">
          {new Date(booking.startsAt).toLocaleDateString('ru-RU', { dateStyle: 'long' })}
        </p>
      </div>

      {/* Client */}
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">{t('dashboard', 'clientLabel')}</span>{' '}
          <span className="font-medium">{clientName}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{t('dashboard', 'phoneLabel')}</span>{' '}
          <span className="font-mono">{clientPhone}</span>
        </p>
        {(booking.user?.email ?? booking.guestEmail) && (
          <p>
            <span className="text-muted-foreground">{t('dashboard', 'emailLabel')}</span>{' '}
            {booking.user?.email ?? booking.guestEmail}
          </p>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('dashboard', 'statusLabel')}</span>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Notes */}
      {booking.notes && (
        <p className="text-sm text-muted-foreground italic">{booking.notes}</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Actions */}
      {canEdit && allowed.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {allowed.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === 'CANCELLED' ? 'outline' : 'default'}
              onClick={() => handleChange(s)}
              disabled={pending}
            >
              {ACTION_LABELS[s]}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- BOOKING CALENDAR (main) -----------------------------------------------

export function BookingCalendar({
  calendarData,
  timezone,
  tenantSlug: _tenantSlug,
  weekStart,
  onWeekChange,
  onStatusChange,
  canEdit,
  loading = false,
}: Props) {
  const { t } = useI18n()
  const today = new Date()
  const DAY_LABELS = [
    t('days', 'mon'), t('days', 'tue'), t('days', 'wed'), t('days', 'thu'),
    t('days', 'fri'), t('days', 'sat'), t('days', 'sun'),
  ]
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const [nowPx, setNowPx] = useState<number | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)
  const [visibleResources, setVisibleResources] = useState<Set<string>>(new Set())

  // Current time line
  useEffect(() => {
    function updateNow() {
      const now = toZonedTime(new Date(), timezone)
      const mins = (now.getHours() - HOURS_START) * 60 + now.getMinutes()
      setNowPx(mins >= 0 && mins <= (HOURS_END - HOURS_START) * 60 ? mins * PX_PER_MIN : null)
    }
    updateNow()
    const timer = setInterval(updateNow, 60_000)
    return () => clearInterval(timer)
  }, [timezone])

  // Sync visible resources when calendarData changes
  useEffect(() => {
    if (calendarData) {
      setVisibleResources(new Set(Object.keys(calendarData)))
    }
  }, [calendarData])

  // All resources list for filter
  const allResources = calendarData
    ? Object.entries(calendarData).map(([id, data]) => ({ id, name: data.resourceName }))
    : []

  // Assign palette color by resource index
  const resourceColorMap = new Map(
    allResources.map((r, i) => [r.id, RESOURCE_PALETTE[i % RESOURCE_PALETTE.length]])
  )

  // Collect bookings per day (only visible resources)
  function getBookingsForDay(day: Date): LayoutBooking[] {
    if (!calendarData) return []
    const all: CalendarBooking[] = []
    for (const [resourceId, data] of Object.entries(calendarData)) {
      if (!visibleResources.has(resourceId)) continue
      for (const b of data.bookings) {
        const bDay = getDateInTimezone(b.startsAt, timezone)
        if (isSameDay(bDay, day)) {
          all.push(b)
        }
        // Handle cross-midnight bookings: also show in next day
        const bDayEnd = getDateInTimezone(b.endsAt, timezone)
        if (!isSameDay(bDay, bDayEnd) && isSameDay(bDayEnd, day)) {
          all.push(b)
        }
      }
    }
    return layoutBookings(all)
  }

  function weekLabel() {
    const end = addDays(weekStart, 6)
    return `${formatDate(weekStart)} — ${formatDate(end)}`
  }

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWeekChange(addDays(weekStart, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWeekChange(getMonday(new Date()))}
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            {t('dashboard', 'today')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWeekChange(addDays(weekStart, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium ml-1">{weekLabel()}</span>
        </div>

        {/* Resource visibility toggles */}
        {allResources.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {allResources.map((r) => {
              const color = resourceColorMap.get(r.id)
              const visible = visibleResources.has(r.id)
              return (
                <button
                  key={r.id}
                  onClick={() =>
                    setVisibleResources((prev) => {
                      const next = new Set(prev)
                      if (next.has(r.id)) next.delete(r.id)
                      else next.add(r.id)
                      return next
                    })
                  }
                  className={[
                    'flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-opacity',
                    visible ? 'opacity-100' : 'opacity-40',
                  ].join(' ')}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${color?.dot ?? 'bg-muted-foreground'}`}
                  />
                  {r.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-lg border bg-background">
        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <span className="text-sm">{t('common', 'loading')}</span>
          </div>
        )}
        {!loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '44px repeat(7, minmax(80px, 1fr))',
            }}
          >
            {/* Header row */}
            <div className="border-b bg-muted/30 p-1" /> {/* empty corner */}
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, today)
              return (
                <div
                  key={i}
                  className={[
                    'border-b border-l bg-muted/30 py-2 text-center text-xs',
                    isToday ? 'font-semibold text-primary' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  <div>{DAY_LABELS[i]}</div>
                  <div className={[
                    'mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs',
                    isToday ? 'bg-primary text-primary-foreground' : '',
                  ].join(' ')}>
                    {day.getDate()}
                  </div>
                </div>
              )
            })}

            {/* Body: time column + day columns */}
            <div className="relative" style={{ height: TOTAL_HEIGHT }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-1 text-[10px] text-muted-foreground leading-none"
                  style={{ top: (h - HOURS_START) * PX_PER_HOUR - 5 }}
                >
                  {h < HOURS_END ? `${String(h).padStart(2, '0')}:00` : ''}
                </div>
              ))}
            </div>

            {weekDays.map((day, dayIdx) => {
              const dayBookings = getBookingsForDay(day)
              const isToday = isSameDay(day, today)

              return (
                <div
                  key={dayIdx}
                  className={[
                    'relative border-l',
                    isToday ? 'bg-primary/3' : '',
                  ].join(' ')}
                  style={{ height: TOTAL_HEIGHT }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-border/50"
                      style={{ top: (h - HOURS_START) * PX_PER_HOUR }}
                    />
                  ))}
                  {/* Half-hour dashed lines */}
                  {HOURS.slice(0, -1).map((h) => (
                    <div
                      key={`${h}-half`}
                      className="absolute w-full border-t border-dashed border-border/30"
                      style={{ top: (h - HOURS_START) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                    />
                  ))}

                  {/* Current time line */}
                  {isToday && nowPx !== null && (
                    <div
                      className="absolute z-10 w-full"
                      style={{ top: nowPx }}
                    >
                      <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                      <div className="h-px w-full bg-red-500" />
                    </div>
                  )}

                  {/* Bookings */}
                  {dayBookings.map((booking) => {
                    const top = bookingTopPx(booking.startsAt, timezone)
                    const height = bookingHeightPx(booking.startsAt, booking.endsAt)
                    const color = resourceColorMap.get(booking.resourceId) ??
                      RESOURCE_PALETTE[0]
                    const widthPct = 100 / booking.maxTracks
                    const leftPct = (booking.trackIdx * 100) / booking.maxTracks

                    return (
                      <button
                        key={booking.id}
                        className={[
                          'absolute overflow-hidden rounded border px-1 py-0.5 text-left text-[10px] leading-tight',
                          'cursor-pointer hover:ring-1 hover:ring-primary transition-all',
                          color.bg,
                        ].join(' ')}
                        style={{
                          top,
                          height: Math.max(height, 22),
                          left: `calc(${leftPct}% + 1px)`,
                          width: `calc(${widthPct}% - 2px)`,
                          zIndex: 1,
                        }}
                        onClick={() => setSelectedBooking(booking)}
                        title={`${booking.service?.name ?? '—'} · ${booking.resource.name}`}
                      >
                        <p className="truncate font-medium">
                          {formatTime(booking.startsAt, timezone)}
                        </p>
                        {height > 30 && (
                          <p className="truncate opacity-80">
                            {booking.guestName ?? booking.user?.name ?? '—'}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!loading && calendarData && Object.keys(calendarData).length === 0 && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {t('dashboard', 'noWeekBookings')}
        </div>
      )}

      {/* Booking detail dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboard', 'booking')}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <BookingDetailDialog
              booking={selectedBooking}
              resourceColor={
                resourceColorMap.get(selectedBooking.resourceId) ?? RESOURCE_PALETTE[0]
              }
              timezone={timezone}
              canEdit={canEdit}
              onStatusChange={onStatusChange}
              onClose={() => setSelectedBooking(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { getMonday }
