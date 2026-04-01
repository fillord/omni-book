"use client"

'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Table2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import { formatPhone } from '@/lib/utils/phone'
import { Button } from '@/components/ui/button'
import { BookingStatusBadge, type BookingStatusValue } from '@/components/booking-status-badge'
import { BookingCalendar, type CalendarData, getMonday } from '@/components/booking-calendar'
import { useI18n } from '@/lib/i18n/context'
import { ManualBookingSheet } from '@/components/manual-booking-sheet'

// ---- types -----------------------------------------------------------------

type BookingResource = { id: string; name: string; type: string }
type BookingService = { id: string; name: string; durationMin: number; price: number | null; currency: string }
type BookingUser = { id: string; name: string | null; email: string }

export type BookingRow = {
  id: string
  startsAt: string
  endsAt: string
  status: BookingStatusValue
  guestName: string | null
  guestPhone: string | null
  guestEmail: string | null
  notes: string | null
  resourceId: string
  resource: BookingResource
  service: BookingService | null
  user: BookingUser | null
  paymentExpiresAt: string | null
}

export type ResourceOption = { id: string; name: string; type: string }

type ServiceOption = {
  id: string
  name: string
  durationMin: number
  resources: { resourceId: string }[]
}

type Props = {
  tenantSlug: string
  timezone: string
  canEdit: boolean
  resources: ResourceOption[]
  services?: ServiceOption[]
}

// ---- status labels for filter buttons --------------------------------------

const ALL_STATUSES: BookingStatusValue[] = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

const STATUS_FILTER_LABELS: Record<BookingStatusValue, string> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'noShow',
}

// ---- allowed transitions ---------------------------------------------------

const TRANSITIONS: Partial<Record<BookingStatusValue, BookingStatusValue[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
}

const ACTION_LABELS: Record<BookingStatusValue, string> = {
  CONFIRMED: 'confirm',
  COMPLETED: 'complete',
  CANCELLED: 'cancel',
  NO_SHOW: 'markNoShow',
  PENDING: 'toPending',
}

// ---- helpers ---------------------------------------------------------------

function formatPrice(price: number | null, currency: string): string {
  if (price == null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price / 100)
}

function formatDateTimeRu(utcStr: string, timezone: string): { date: string; time: string } {
  const d = new Date(utcStr)
  const date = new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
  }).format(d)
  const time = new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
  return { date, time }
}

// ---- day-grouping helpers --------------------------------------------------

function groupBookingsByDay(bookings: BookingRow[], timezone: string): [string, BookingRow[]][] {
  const groups = new Map<string, BookingRow[]>()
  for (const b of bookings) {
    const localDate = toZonedTime(new Date(b.startsAt), timezone)
    const key = format(localDate, 'yyyy-MM-dd')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(b)
  }
  // Sort groups by date key ascending (today first, then future)
  return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a))
}

function getDayLabel(dateKey: string, timezone: string): string {
  const d = toZonedTime(new Date(dateKey + 'T12:00:00'), timezone)
  const now = toZonedTime(new Date(), timezone)
  const todayKey = format(now, 'yyyy-MM-dd')
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowKey = format(tomorrowDate, 'yyyy-MM-dd')
  const dayMonth = format(d, 'd MMMM', { locale: ru })
  if (dateKey === todayKey) return `Сегодня, ${dayMonth}`
  if (dateKey === tomorrowKey) return `Завтра, ${dayMonth}`
  return dayMonth
}

// ---- component -------------------------------------------------------------

export function BookingsDashboard({ tenantSlug, timezone, canEdit, resources, services }: Props) {
  const { t } = useI18n()
  // Tab
  const [tab, setTab] = useState<'table' | 'calendar'>('table')

  // Manual booking sheet
  const [sheetOpen, setSheetOpen] = useState(false)

  // Filters
  const [selectedStatuses, setSelectedStatuses] = useState<BookingStatusValue[]>([])
  const [showCancelled, setShowCancelled] = useState(false)
  const [resourceId, setResourceId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Table state
  const [page, setPage] = useState(1)
  const LIMIT = 20
  const [tableData, setTableData] = useState<{
    data: BookingRow[]
    total: number
    totalPages: number
  } | null>(null)
  const [tableLoading, setTableLoading] = useState(false)

  // Calendar state
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)

  function showToast(type: 'error' | 'success', text: string) {
    if (type === 'error') toast.error(text)
    else toast.success(text)
  }

  // ---- fetch table data -----------------------------------------------------

  const fetchTable = useCallback(async () => {
    setTableLoading(true)
    try {
      const params = new URLSearchParams({
        tenantSlug,
        page: String(page),
        limit: String(LIMIT),
      })
      // Compute effective statuses — CANCELLED excluded by default unless showCancelled is true
      let effectiveStatuses = selectedStatuses
      if (!showCancelled) {
        if (selectedStatuses.length === 0) {
          // All selected (no filter) — explicitly exclude CANCELLED
          effectiveStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW']
        } else {
          // Filter out CANCELLED from the selection
          effectiveStatuses = selectedStatuses.filter((s) => s !== 'CANCELLED')
        }
      }
      if (effectiveStatuses.length > 0) params.set('status', effectiveStatuses.join(','))
      if (resourceId) params.set('resourceId', resourceId)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await fetch(`/api/bookings?${params}`)
      if (!res.ok) throw new Error('Failed to load bookings')
      const json = await res.json()
      setTableData(json)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('dashboard', 'errorLoad'))
    } finally {
      setTableLoading(false)
    }
  }, [tenantSlug, page, selectedStatuses, showCancelled, resourceId, dateFrom, dateTo])

  // ---- fetch calendar data --------------------------------------------------

  const fetchCalendar = useCallback(async () => {
    setCalendarLoading(true)
    try {
      const weekStartStr = weekStart.toISOString().split('T')[0]
      const params = new URLSearchParams({ tenantSlug, weekStart: weekStartStr })
      if (resourceId) params.set('resourceIds', resourceId)

      const res = await fetch(`/api/bookings/calendar?${params}`)
      if (!res.ok) throw new Error('Failed to load calendar')
      const json = await res.json()
      setCalendarData(json.data)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('dashboard', 'errorLoad'))
    } finally {
      setCalendarLoading(false)
    }
  }, [tenantSlug, weekStart, resourceId])

  // Effects
  useEffect(() => {
    if (tab === 'table') fetchTable()
  }, [tab, fetchTable])

  useEffect(() => {
    if (tab === 'calendar') fetchCalendar()
  }, [tab, fetchCalendar])

  // ---- status change --------------------------------------------------------

  async function handleStatusChange(bookingId: string, newStatus: BookingStatusValue) {
    // Optimistic update in table
    if (tableData) {
      const original = tableData.data.find((b) => b.id === bookingId)
      setTableData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((b) =>
                b.id === bookingId ? { ...b, status: newStatus } : b
              ),
            }
          : prev
      )

      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!res.ok) {
          const err = await res.json()
          // Rollback
          if (original) {
            setTableData((prev) =>
              prev
                ? {
                    ...prev,
                    data: prev.data.map((b) =>
                      b.id === bookingId ? { ...b, status: original.status } : b
                    ),
                  }
                : prev
            )
          }
          throw new Error(err.error ?? t('dashboard', 'statusError'))
        }
        showToast('success', 'Статус обновлён')
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : t('dashboard', 'errorStatus'))
        throw err // re-throw so calendar dialog can handle
      }
    } else {
      // Calendar path: just call API, calendar re-fetches
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? t('dashboard', 'statusError'))
      }
      showToast('success', t('dashboard', 'statusUpdated'))
      fetchCalendar()
    }
  }

  // ---- filter toggle --------------------------------------------------------

  function toggleStatus(s: BookingStatusValue) {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
    setPage(1)
  }

  function handleResourceChange(id: string) {
    setResourceId(id)
    setPage(1)
  }

  // ---- render ---------------------------------------------------------------

  return (
    <div className="space-y-4">

      {/* Header row: Tabs + New Booking button */}
      <div className="flex w-full justify-between items-center mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-lg neu-inset bg-[var(--neu-bg)] p-1 w-fit">
          <button
            onClick={() => setTab('table')}
            className={[
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              tab === 'table'
                ? 'neu-raised bg-[var(--neu-bg)] font-medium'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Table2 className="h-4 w-4" />
            {t('dashboard', 'table')}
          </button>
          <button
            onClick={() => setTab('calendar')}
            className={[
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              tab === 'calendar'
                ? 'neu-raised bg-[var(--neu-bg)] font-medium'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <CalendarDays className="h-4 w-4" />
            {t('dashboard', 'calendar')}
          </button>
        </div>

        {/* New Booking button */}
        {canEdit && (
          <Button
            onClick={() => setSheetOpen(true)}
            className="neu-raised rounded-xl"
          >
            {t('dashboard', 'newBooking') ?? '➕ Новая запись'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Status chips (non-CANCELLED statuses) */}
        <div className="flex flex-wrap gap-1">
          {ALL_STATUSES.filter((s) => s !== 'CANCELLED').map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              aria-pressed={selectedStatuses.includes(s)}
              className={[
                'rounded-xl px-3 py-1 text-sm transition-colors',
                selectedStatuses.includes(s)
                  ? 'neu-inset bg-[var(--neu-bg)] text-neu-accent font-medium'
                  : 'neu-raised bg-[var(--neu-bg)] text-muted-foreground',
              ].join(' ')}
            >
              {t('status', STATUS_FILTER_LABELS[s])}
            </button>
          ))}
          {/* Cancelled toggle chip */}
          <button
            onClick={() => { setShowCancelled((prev) => !prev); setPage(1) }}
            aria-pressed={showCancelled}
            className={[
              'rounded-xl px-3 py-1 text-sm cursor-pointer transition-colors',
              showCancelled
                ? 'neu-inset bg-[var(--neu-bg)] text-neu-accent font-medium'
                : 'neu-raised bg-[var(--neu-bg)] text-muted-foreground',
            ].join(' ')}
          >
            {t('dashboard', 'showCancelled') ?? 'Отменено'}
          </button>
        </div>

        {/* Resource filter */}
        <select
          value={resourceId}
          onChange={(e) => handleResourceChange(e.target.value)}
          className="h-8 rounded-md neu-inset bg-[var(--neu-bg)] border-0 px-2 text-sm"
        >
          <option value="">{t('dashboard', 'allResources')}</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="h-8 rounded-md neu-inset bg-[var(--neu-bg)] border-0 px-2 text-sm"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="h-8 rounded-md neu-inset bg-[var(--neu-bg)] border-0 px-2 text-sm"
          />
        </div>

        {/* Reset */}
        {(selectedStatuses.length > 0 || resourceId || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedStatuses([])
              setResourceId('')
              setDateFrom('')
              setDateTo('')
              setPage(1)
            }}
          >
            {t('dashboard', 'reset')}
          </Button>
        )}
      </div>

      {/* ---- TABLE VIEW ---- */}
      {tab === 'table' && (
        <div className="space-y-3">
          {tableLoading && (
            <div className="flex justify-center py-10 text-sm text-muted-foreground">
              {t('common', 'loading')}
            </div>
          )}

          {!tableLoading && tableData && tableData.data.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
                📅
              </div>
              <div>
                <p className="font-medium">{t('dashboard', 'noBookings')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('dashboard', 'noBookingsDesc')}
                </p>
              </div>
            </div>
          )}

          {!tableLoading && tableData && tableData.data.length > 0 && (
            <>
              {/* Day-grouped booking sections */}
              <div>
                {groupBookingsByDay(tableData.data, timezone).map(([dateKey, dayBookings]) => {
                  // Sort bookings within the day by start time ascending (API returns desc)
                  const sorted = [...dayBookings].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                  return (
                    <div key={dateKey} className="mt-8 first:mt-0">
                      {/* Sticky day header */}
                      <div className="sticky top-0 z-10 bg-[var(--neu-bg)] py-2 px-4 mb-4 border-t border-border/30">
                        <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                          {getDayLabel(dateKey, timezone)}
                        </span>
                      </div>

                      {/* Booking rows as neu-raised cards */}
                      <div className="space-y-2 px-1 pb-2">
                        {sorted.map((booking) => {
                          const localTime = toZonedTime(new Date(booking.startsAt), timezone)
                          const time = format(localTime, 'HH:mm')
                          const clientName = booking.user?.name ?? booking.guestName
                          const isExpiredPending =
                            booking.status === 'PENDING' &&
                            booking.paymentExpiresAt != null &&
                            new Date(booking.paymentExpiresAt) < new Date()
                          const allowed = isExpiredPending ? [] : (TRANSITIONS[booking.status] ?? [])

                          return (
                            <div
                              key={booking.id}
                              className={[
                                'neu-raised rounded-xl bg-[var(--neu-bg)] px-4 py-2 flex items-center gap-4 hover:bg-muted/30 transition-colors',
                                isExpiredPending ? 'opacity-60' : '',
                              ].join(' ')}
                            >
                              {/* Time — dominant visual element */}
                              <span className="font-semibold text-lg tabular-nums w-14 shrink-0">{time}</span>

                              {/* Client name */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm min-w-0 truncate">{clientName ?? '—'}</p>
                                {booking.guestPhone && (
                                  <p className="text-xs text-muted-foreground font-mono">{formatPhone(booking.guestPhone)}</p>
                                )}
                              </div>

                              {/* Service */}
                              <span className="text-sm text-muted-foreground hidden md:block flex-1 min-w-0 truncate">
                                {booking.service?.name ?? '—'}
                              </span>

                              {/* Resource */}
                              <span className="text-sm text-muted-foreground hidden lg:block flex-1 min-w-0 truncate">
                                {booking.resource.name}
                              </span>

                              {/* Status badge — expired PENDING gets its own label */}
                              {isExpiredPending ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                  Истекло время оплаты
                                </span>
                              ) : (
                                <BookingStatusBadge status={booking.status} />
                              )}

                              {/* Status change actions */}
                              {canEdit && allowed.length > 0 && (
                                <div className="flex gap-1 flex-wrap shrink-0">
                                  {allowed.map((s) => (
                                    <Button
                                      key={s}
                                      size="sm"
                                      variant={s === 'CANCELLED' || s === 'NO_SHOW' ? 'outline' : 'ghost'}
                                      className="h-7 text-xs"
                                      onClick={() => handleStatusChange(booking.id, s)}
                                    >
                                      {t('status', ACTION_LABELS[s])}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                 {t('dashboard', 'shown')} {(page - 1) * LIMIT + 1}–
                  {Math.min(page * LIMIT, tableData.total)} {t('dashboard', 'outOf')} {tableData.total}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2">
                    {page} / {tableData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= tableData.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---- CALENDAR VIEW ---- */}
      {tab === 'calendar' && (
        <BookingCalendar
          calendarData={calendarData}
          timezone={timezone}
          tenantSlug={tenantSlug}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
          onStatusChange={handleStatusChange}
          canEdit={canEdit}
          loading={calendarLoading}
        />
      )}

      {/* Manual Booking Sheet */}
      {canEdit && services && (
        <ManualBookingSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          tenantSlug={tenantSlug}
          resources={resources}
          services={services}
          onSuccess={() => fetchTable()}
        />
      )}
    </div>
  )
}
