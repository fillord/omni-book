'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Table2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BookingStatusBadge, type BookingStatusValue } from '@/components/booking-status-badge'
import { BookingCalendar, type CalendarData, type CalendarBooking, getMonday } from '@/components/booking-calendar'

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
}

export type ResourceOption = { id: string; name: string; type: string }

type Props = {
  tenantSlug: string
  timezone: string
  canEdit: boolean
  resources: ResourceOption[]
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
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
  NO_SHOW: 'Не пришёл',
}

// ---- allowed transitions ---------------------------------------------------

const TRANSITIONS: Partial<Record<BookingStatusValue, BookingStatusValue[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
}

const ACTION_LABELS: Record<BookingStatusValue, string> = {
  CONFIRMED: 'Подтвердить',
  COMPLETED: 'Завершить',
  CANCELLED: 'Отменить',
  NO_SHOW: 'Не пришёл',
  PENDING: 'В ожидание',
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

// ---- component -------------------------------------------------------------

export function BookingsDashboard({ tenantSlug, timezone, canEdit, resources }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Tab
  const [tab, setTab] = useState<'table' | 'calendar'>('table')

  // Filters
  const [selectedStatuses, setSelectedStatuses] = useState<BookingStatusValue[]>([])
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

  // Error / toast
  const [toastMsg, setToastMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  function showToast(type: 'error' | 'success', text: string) {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 4000)
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
      if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','))
      if (resourceId) params.set('resourceId', resourceId)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await fetch(`/api/bookings?${params}`)
      if (!res.ok) throw new Error('Failed to load bookings')
      const json = await res.json()
      setTableData(json)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setTableLoading(false)
    }
  }, [tenantSlug, page, selectedStatuses, resourceId, dateFrom, dateTo])

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
      showToast('error', err instanceof Error ? err.message : 'Ошибка загрузки')
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
          throw new Error(err.error ?? 'Ошибка смены статуса')
        }
        showToast('success', 'Статус обновлён')
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'Ошибка')
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
        throw new Error(err.error ?? 'Ошибка смены статуса')
      }
      showToast('success', 'Статус обновлён')
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

      {/* Toast */}
      {toastMsg && (
        <div
          className={[
            'rounded-md border px-4 py-2 text-sm',
            toastMsg.type === 'error'
              ? 'border-destructive/40 bg-destructive/5 text-destructive'
              : 'border-green-400/40 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-300',
          ].join(' ')}
        >
          {toastMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        <button
          onClick={() => setTab('table')}
          className={[
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
            tab === 'table'
              ? 'bg-background shadow-sm font-medium'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          <Table2 className="h-4 w-4" />
          Таблица
        </button>
        <button
          onClick={() => setTab('calendar')}
          className={[
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
            tab === 'calendar'
              ? 'bg-background shadow-sm font-medium'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          <CalendarDays className="h-4 w-4" />
          Календарь
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        {/* Status chips */}
        <div className="flex flex-wrap gap-1">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={[
                'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                selectedStatuses.includes(s)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-muted-foreground/50',
              ].join(' ')}
            >
              {STATUS_FILTER_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Resource filter */}
        <select
          value={resourceId}
          onChange={(e) => handleResourceChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">Все ресурсы</option>
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
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
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
            Сбросить
          </Button>
        )}
      </div>

      {/* ---- TABLE VIEW ---- */}
      {tab === 'table' && (
        <div className="space-y-3">
          {tableLoading && (
            <div className="flex justify-center py-10 text-sm text-muted-foreground">
              Загрузка…
            </div>
          )}

          {!tableLoading && tableData && tableData.data.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
                📅
              </div>
              <div>
                <p className="font-medium">Нет бронирований</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Нет бронирований за выбранный период
                </p>
              </div>
            </div>
          )}

          {!tableLoading && tableData && tableData.data.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата / время</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Услуга</TableHead>
                    <TableHead>Ресурс</TableHead>
                    <TableHead>Статус</TableHead>
                    {canEdit && <TableHead className="text-right">Действия</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.data.map((booking) => {
                    const { date, time } = formatDateTimeRu(booking.startsAt, timezone)
                    const clientName = booking.user?.name ?? booking.guestName
                    const allowed = TRANSITIONS[booking.status] ?? []

                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{date}</div>
                          <div className="text-xs text-muted-foreground">{time}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{clientName ?? '—'}</div>
                          {booking.guestPhone && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {booking.guestPhone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{booking.service?.name ?? '—'}</div>
                          {booking.service && (
                            <div className="text-xs text-muted-foreground">
                              {booking.service.durationMin} мин
                              {booking.service.price != null && (
                                <> · {formatPrice(booking.service.price, booking.service.currency)}</>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{booking.resource.name}</div>
                        </TableCell>
                        <TableCell>
                          <BookingStatusBadge status={booking.status} />
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            {allowed.length > 0 && (
                              <div className="flex justify-end gap-1 flex-wrap">
                                {allowed.map((s) => (
                                  <Button
                                    key={s}
                                    size="sm"
                                    variant={s === 'CANCELLED' || s === 'NO_SHOW' ? 'outline' : 'ghost'}
                                    className="h-7 text-xs"
                                    onClick={() => handleStatusChange(booking.id, s)}
                                  >
                                    {ACTION_LABELS[s]}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Показано {(page - 1) * LIMIT + 1}–
                  {Math.min(page * LIMIT, tableData.total)} из {tableData.total}
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
    </div>
  )
}
