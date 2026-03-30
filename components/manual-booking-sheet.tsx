'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'
import { createManualBooking } from '@/lib/actions/bookings'
import type { ResourceOption } from '@/components/bookings-dashboard'

// ---- types -----------------------------------------------------------------

type ServiceOption = {
  id: string
  name: string
  durationMin: number
  resources: { resourceId: string }[]
}

type Slot = {
  start: string
  end: string
}

type ManualBookingSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  resources: ResourceOption[]
  services: ServiceOption[]
  onSuccess: () => void
}

// ---- component -------------------------------------------------------------

export function ManualBookingSheet({
  open,
  onOpenChange,
  tenantSlug,
  resources,
  services,
  onSuccess,
}: ManualBookingSheetProps) {
  const { t } = useI18n()

  // Form state
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedResourceId, setSelectedResourceId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  // UI state
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Filtered services based on selected resource
  const filteredServices = selectedResourceId
    ? services.filter((s) => s.resources.some((r) => r.resourceId === selectedResourceId))
    : services

  // Reset service and slots when resource changes
  useEffect(() => {
    setSelectedServiceId('')
    setSelectedSlot(null)
    setSlots([])
  }, [selectedResourceId])

  // Reset slot when service changes
  useEffect(() => {
    setSelectedSlot(null)
    setSlots([])
  }, [selectedServiceId])

  // Load slots when date + resource + service are all selected
  useEffect(() => {
    if (!selectedDate || !selectedResourceId || !selectedServiceId) {
      setSlots([])
      return
    }

    let cancelled = false
    setSlotsLoading(true)

    const params = new URLSearchParams({
      tenantSlug,
      date: selectedDate,
      resourceId: selectedResourceId,
      serviceId: selectedServiceId,
    })

    fetch(`/api/bookings/slots?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setSlots(json.slots ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) setSlots([])
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantSlug, selectedDate, selectedResourceId, selectedServiceId])

  // Reset form state
  function resetForm() {
    setSelectedDate('')
    setSelectedResourceId('')
    setSelectedServiceId('')
    setSelectedSlot(null)
    setClientName('')
    setClientPhone('')
    setSlots([])
  }

  // Form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return

    setSubmitting(true)
    try {
      const result = await createManualBooking({
        date: selectedDate,
        resourceId: selectedResourceId,
        serviceId: selectedServiceId,
        startsAt: selectedSlot.start,
        endsAt: selectedSlot.end,
        clientName,
        clientPhone,
      })

      if (result.success) {
        toast.success(t('dashboard', 'bookingCreated'))
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        toast.error(result.error || t('common', 'error'))
      }
    } catch {
      toast.error(t('common', 'error'))
    } finally {
      setSubmitting(false)
    }
  }

  // Format slot time display (HH:MM)
  function formatSlotTime(isoString: string): string {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoString
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-md overflow-y-auto bg-[var(--neu-bg)] backdrop-blur-sm"
        aria-label={t('dashboard', 'manualBookingTitle') ?? 'Create Booking'}
      >
        <SheetHeader>
          <SheetTitle>{t('dashboard', 'manualBookingTitle') ?? 'Создать запись'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-2">

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label htmlFor="booking-date" className="text-sm font-medium text-foreground">
              {t('dashboard', 'manualDate') ?? 'Выберите дату'}
            </label>
            <input
              id="booking-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="neu-inset rounded-xl bg-[var(--neu-bg)] border-0 px-3 py-2 text-sm"
            />
          </div>

          {/* Resource */}
          <div className="flex flex-col gap-1">
            <label htmlFor="booking-resource" className="text-sm font-medium text-foreground">
              {t('dashboard', 'manualResource') ?? 'Выберите ресурс'}
            </label>
            <select
              id="booking-resource"
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              required
              className="neu-inset rounded-xl bg-[var(--neu-bg)] border-0 px-3 py-2 text-sm"
            >
              <option value="">{t('dashboard', 'manualResource') ?? 'Выберите ресурс'}</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Service (filtered by resource) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="booking-service" className="text-sm font-medium text-foreground">
              {t('dashboard', 'manualService') ?? 'Выберите услугу'}
            </label>
            <select
              id="booking-service"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              disabled={!selectedResourceId}
              className="neu-inset rounded-xl bg-[var(--neu-bg)] border-0 px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">{t('dashboard', 'manualService') ?? 'Выберите услугу'}</option>
              {filteredServices.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Time Slot Picker */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              {t('dashboard', 'manualTime') ?? 'Выберите время'}
            </span>

            {slotsLoading && (
              <div className="text-sm text-muted-foreground py-2">
                {t('common', 'loading') ?? 'Загрузка…'}
              </div>
            )}

            {!slotsLoading && selectedDate && selectedResourceId && selectedServiceId && slots.length === 0 && (
              <div className="text-sm text-muted-foreground py-2">
                {t('dashboard', 'noSlotsAvailable') ?? 'Нет доступного времени'}
              </div>
            )}

            {!slotsLoading && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const timeLabel = formatSlotTime(slot.start)
                  const isSelected = selectedSlot?.start === slot.start
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      aria-label={`Select ${timeLabel}`}
                      aria-pressed={isSelected}
                      className={[
                        'rounded-lg text-sm px-2 py-1 cursor-pointer transition-colors',
                        isSelected
                          ? 'neu-inset bg-[var(--neu-bg)] text-neu-accent'
                          : 'neu-raised bg-[var(--neu-bg)]',
                      ].join(' ')}
                    >
                      {timeLabel}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Client Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="booking-client-name" className="text-sm font-medium text-foreground">
              {t('dashboard', 'clientName') ?? 'Имя клиента'}
            </label>
            <input
              id="booking-client-name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="neu-inset rounded-xl bg-[var(--neu-bg)] border-0 px-3 py-2 text-sm"
            />
          </div>

          {/* Client Phone */}
          <div className="flex flex-col gap-1">
            <label htmlFor="booking-client-phone" className="text-sm font-medium text-foreground">
              {t('dashboard', 'clientPhone') ?? 'Телефон клиента'}
            </label>
            <input
              id="booking-client-phone"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              required
              className="neu-inset rounded-xl bg-[var(--neu-bg)] border-0 px-3 py-2 text-sm"
            />
          </div>

          <SheetFooter>
            <Button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="neu-raised rounded-xl w-full"
            >
              {submitting
                ? (t('dashboard', 'savingLabel') ?? 'Сохранение…')
                : (t('dashboard', 'saveBooking') ?? 'Сохранить запись')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
