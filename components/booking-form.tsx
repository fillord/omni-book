"use client"

import { useState, useEffect, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { useI18n } from '@/lib/i18n/context'

// ---- types -----------------------------------------------------------------

export type ServiceOption = {
  id:             string
  name:           string
  description:    string | null
  durationMin:    number
  price:          number | null
  currency:       string
}

export type ResourceOption = {
  id:              string
  name:            string
  type:            string
  description:     string | null
  specialization:  string | null
  experienceYears: number | null
  attributes?:     Record<string, unknown>
  serviceIds:      string[]
}

type Props = {
  tenantSlug:    string
  services:      ServiceOption[]
  resources:     ResourceOption[]
  bookingLabel?: string
  resourceLabel?:string
  /** Niche color key: "blue" | "pink" | "orange" | "green" */
  nicheColor?:   string
  /** Rolling booking window: max days ahead for booking */
  bookingWindowDays?: number
  /** Tenant phone number used for WhatsApp prepayment deep link */
  tenantPhone?:  string | null
}

type Step = 'service' | 'resource' | 'datetime' | 'confirm'

// ---- niche colors ----------------------------------------------------------
// Neumorphic accent palette. Most surfaces use neu-raised/neu-inset; the
// submit CTA uses a solid bg fill for conversion prominence.

type NicheColorClasses = {
  stepActive:       string   // border + text for the active step circle
  stepDone:         string   // text color for the completed step circle (circle itself uses neu-raised)
  stepLine:         string   // bg color for the connecting progress line
  slotSelectedText: string   // text color for the pressed/selected time-slot button
  slotHoverText:    string   // hover text color for available slots
  accentText:       string   // text color for Next buttons
  submitBtn:        string   // solid fill for the main Book CTA
  serviceSelected:  string   // selected service card: border + dark mode tint
  resourceSelected: string   // selected resource card: border + dark mode tint
}

const BOOKING_COLORS: Record<string, NicheColorClasses> = {
  blue: {
    stepActive:       'border-blue-500 text-blue-500',
    stepDone:         'text-blue-500',
    stepLine:         'bg-blue-500',
    slotSelectedText: 'text-blue-500',
    slotHoverText:    'hover:text-blue-500',
    accentText:       'text-blue-500',
    submitBtn:        'bg-blue-600 hover:bg-blue-700 text-white',
    serviceSelected:  'border-blue-600 bg-card dark:bg-blue-950/40',
    resourceSelected: 'border-blue-600 bg-card dark:bg-blue-950/40',
  },
  pink: {
    stepActive:       'border-pink-500 text-pink-500',
    stepDone:         'text-pink-500',
    stepLine:         'bg-pink-500',
    slotSelectedText: 'text-pink-500',
    slotHoverText:    'hover:text-pink-500',
    accentText:       'text-pink-500',
    submitBtn:        'bg-pink-600 hover:bg-pink-700 text-white',
    serviceSelected:  'border-pink-600 bg-card dark:bg-pink-950/40',
    resourceSelected: 'border-pink-600 bg-card dark:bg-pink-950/40',
  },
  orange: {
    stepActive:       'border-orange-500 text-orange-500',
    stepDone:         'text-orange-500',
    stepLine:         'bg-orange-500',
    slotSelectedText: 'text-orange-500',
    slotHoverText:    'hover:text-orange-500',
    accentText:       'text-orange-500',
    submitBtn:        'bg-orange-600 hover:bg-orange-700 text-white',
    serviceSelected:  'border-orange-600 bg-card dark:bg-orange-950/40',
    resourceSelected: 'border-orange-600 bg-card dark:bg-orange-950/40',
  },
  green: {
    stepActive:       'border-green-500 text-green-500',
    stepDone:         'text-green-500',
    stepLine:         'bg-green-500',
    slotSelectedText: 'text-green-500',
    slotHoverText:    'hover:text-green-500',
    accentText:       'text-green-500',
    submitBtn:        'bg-green-600 hover:bg-green-700 text-white',
    serviceSelected:  'border-green-600 bg-card dark:bg-green-950/40',
    resourceSelected: 'border-green-600 bg-card dark:bg-green-950/40',
  },
}

const FALLBACK_COLORS = BOOKING_COLORS.blue

// ---- helpers ---------------------------------------------------------------

function generateICS(params: {
  summary:     string
  description: string
  date:        string
  time:        string
  durationMin: number
}): string {
  const [year, month, day] = params.date.split('-').map(Number)
  const [hour, min]        = params.time.split(':').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(min)}00`
  const endDate = new Date(year, month - 1, day, hour, min + params.durationMin)
  const dtEnd   = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OmniBook//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${params.summary}`,
    `DESCRIPTION:${params.description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// ---- StepIndicator ---------------------------------------------------------

function StepIndicator({
  current,
  steps,
  colors,
}: {
  current: Step
  steps:   { id: Step; label: string }[]
  colors:  NicheColorClasses
}) {
  const currentIdx = steps.findIndex((s) => s.id === current)
  return (
    <ol className="flex items-center w-full mb-8">
      {steps.map((step, idx) => {
        const done     = idx < currentIdx
        const isActive = idx === currentIdx
        return (
          <li key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 min-w-[2.5rem]">
              <span className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                done
                  ? `neu-raised bg-[var(--neu-bg)] ${colors.stepDone}`
                  : isActive
                  ? `border-2 ${colors.stepActive}`
                  : 'border-2 border-border text-muted-foreground',
              ].join(' ')}>
                {done ? '✓' : idx + 1}
              </span>
              <span className={[
                'text-xs whitespace-nowrap hidden sm:block',
                isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
              ].join(' ')}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={[
                'flex-1 h-0.5 mx-1 mb-5 transition-colors',
                done ? colors.stepLine : 'bg-border',
              ].join(' ')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ---- SuccessScreen ---------------------------------------------------------

function SuccessScreen({
  bookingId,
  guestName,
  service,
  resource,
  date,
  time,
  onReset,
}: {
  bookingId: string
  guestName: string
  service:   ServiceOption
  resource:  ResourceOption
  date:      string
  time:      string
  onReset:   () => void
}) {
  const { t, locale } = useI18n()
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  const confettiColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

  function downloadICS() {
    const ics = generateICS({
      summary:     service.name,
      description: resource.name,
      date,
      time,
      durationMin: service.durationMin,
    })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'booking.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const dateLocale = locale === 'en' ? 'en-US' : locale === 'kz' ? 'kk-KZ' : 'ru-RU'

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center relative">
      <div
        className={[
          'w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center transition-all duration-500',
          visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
        ].join(' ')}
      >
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path
            style={{ strokeDasharray: 30, strokeDashoffset: visible ? 0 : 30, transition: 'stroke-dashoffset 0.5s' }}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Confetti */}
      {visible && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `-5%`,
                backgroundColor: confettiColors[i % confettiColors.length],
                animation: `confetti-fall ${1.5 + Math.random()}s ease-out ${Math.random() * 0.8}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">{t('booking', 'success')}</h3>
        <p className="text-muted-foreground text-sm">{guestName}, {t('booking', 'successSub')}</p>
      </div>

      {/* Summary card */}
      <div className="w-full rounded-2xl bg-[var(--neu-bg)] neu-raised p-5 text-sm space-y-3 text-left max-w-sm">
        <SummaryRow label={t('booking', 'service')}    value={service.name} />
        <SummaryRow label={t('booking', 'specialist')} value={resource.name} />
        <div className="border-t border-foreground/5 pt-3 space-y-3">
          <SummaryRow
            label={t('booking', 'date')}
            value={new Date(date).toLocaleDateString(dateLocale, { dateStyle: 'long' })}
          />
          <SummaryRow label={t('booking', 'timeSlot')} value={time} />
        </div>
        <div className="border-t border-foreground/5 pt-3">
          <p className="text-xs text-muted-foreground">
            {t('booking', 'bookingNumber')}: <span className="font-mono font-medium text-foreground">{bookingId}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {/* Telegram deep-link — only shown when bot username is configured */}
        {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME && (
          <a
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=b_${bookingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] text-sm font-semibold text-foreground transition-all duration-300 active:neu-inset flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#229ED9]" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.68l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.88z"/>
            </svg>
            {t('booking', 'connectTelegram')}
          </a>
        )}

        <div className="flex sm:flex-row flex-col gap-3">
          <button
            onClick={onReset}
            className="flex-1 py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] text-sm font-semibold text-foreground transition-all duration-300 active:neu-inset"
          >
            {t('booking', 'bookAgain')}
          </button>
          <button
            onClick={downloadICS}
            className="flex-1 py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] text-sm font-semibold text-foreground transition-all duration-300 active:neu-inset"
          >
            📅 {t('booking', 'addToCalendar')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- buildWhatsAppPrepaymentUrl --------------------------------------------

function buildWhatsAppPrepaymentUrl(params: {
  tenantPhone: string
  guestName:   string
  serviceName: string
  date:        string
  time:        string
  price:       number | null
  currency:    string
}): string {
  const priceText = params.price
    ? `${new Intl.NumberFormat('ru-RU').format(params.price)} ${params.currency}`
    : ''

  const template = [
    `Здравствуйте! Я хочу подтвердить бронирование.`,
    `📋 Услуга: ${params.serviceName}`,
    `📅 Дата и время: ${params.date}, ${params.time}`,
    priceText ? `💰 Стоимость: ${priceText}` : '',
    ``,
    `Мне необходимо внести предоплату. Подскажите, как это сделать?`,
  ].filter(Boolean).join('\n')

  const phone = params.tenantPhone.replace(/[^0-9]/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(template)}`
}

// ---- BookingForm -----------------------------------------------------------

export function BookingForm({
  tenantSlug,
  services,
  resources,
  bookingLabel,
  resourceLabel,
  nicheColor,
  bookingWindowDays = 14,
  tenantPhone,
}: Props) {
  const { t, locale } = useI18n()
  const colors = BOOKING_COLORS[nicheColor ?? 'blue'] ?? FALLBACK_COLORS

  const steps: { id: Step; label: string }[] = [
    { id: 'service',  label: t('booking', 'stepService') },
    { id: 'resource', label: resourceLabel ?? t('booking', 'specialist') },
    { id: 'datetime', label: t('booking', 'stepDate') },
    { id: 'confirm',  label: t('booking', 'stepDetails') },
  ]

  const [step,               setStep]               = useState<Step>('service')
  const [selectedServiceId,  setSelectedServiceId]  = useState('')
  const [selectedResourceId, setSelectedResourceId] = useState('')
  const [selectedDate,       setSelectedDate]       = useState('')
  const [selectedTime,       setSelectedTime]       = useState('')

  const [guestName,  setGuestName]  = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  const [slots,        setSlots]        = useState<{ time: string; startsAt: string; endsAt: string; available: boolean }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [dayOff,       setDayOff]       = useState(false)
  const [slotsFrozen,  setSlotsFrozen]  = useState(false)

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left')

  function goForward(nextStep: Step) {
    setSlideDir('left')
    setStep(nextStep)
  }
  function goBack(prevStep: Step) {
    setSlideDir('right')
    setStep(prevStep)
  }

  useEffect(() => {
    if (!selectedResourceId || !selectedServiceId || !selectedDate) {
      setSlots([])
      setDayOff(false)
      return
    }
    const controller = new AbortController()
    setSlotsLoading(true)
    setDayOff(false)
    setSlotsFrozen(false)
    fetch(
      `/api/bookings/slots?tenantSlug=${encodeURIComponent(tenantSlug)}&resourceId=${selectedResourceId}&serviceId=${selectedServiceId}&date=${selectedDate}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? [])
        setDayOff(!!data.dayOff)
        setSlotsFrozen(!!data.frozen)
      })
      .catch(() => {})
      .finally(() => setSlotsLoading(false))
    return () => controller.abort()
  }, [selectedResourceId, selectedServiceId, selectedDate, tenantSlug])

  const selectedService  = services.find((s) => s.id === selectedServiceId)
  const selectedResource = resources.find((r) => r.id === selectedResourceId)
  const slotStartsAtMap  = Object.fromEntries(slots.map((s) => [s.time, s.startsAt]))

  const availableResources = selectedServiceId
    ? resources.filter((r) => r.serviceIds.includes(selectedServiceId))
    : resources

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const toDateStr = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  const minDateStr = toDateStr(today)

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + bookingWindowDays)
  const maxDateStr = toDateStr(maxDate)

  const dateLocale = locale === 'en' ? 'en-US' : locale === 'kz' ? 'kk-KZ' : 'ru-RU'

  function formatPrice(price: number | null, currency: string): string {
    if (price === null || price === 0) return t('booking', 'free')
    return new Intl.NumberFormat('ru-RU', {
      style:                'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price / 100)
  }

  async function handleSubmit() {
    if (!guestName.trim() || !guestPhone.trim()) {
      setError(t('booking', 'nameRequired'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings?tenantSlug=${encodeURIComponent(tenantSlug)}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId:  selectedServiceId,
          resourceId: selectedResourceId,
          startsAt:   slotStartsAtMap[selectedTime],
          guestName,
          guestPhone,
          guestEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t('booking', 'genericError'))
        return
      }
      setSuccessId(data.booking.id)
    } catch {
      setError(t('booking', 'networkError'))
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    sessionStorage.removeItem('pendingBooking')
    setStep('service')
    setSelectedServiceId('')
    setSelectedResourceId('')
    setSelectedDate('')
    setSelectedTime('')
    setGuestName('')
    setGuestPhone('')
    setGuestEmail('')
    setError(null)
    setSuccessId(null)
    // TODO(12-02): remove setPendingPaymentId / setPaymentExpiresAt state — Kaspi deposit flow
  }

  // TODO(12-02): WaitingForPaymentScreen block removed — Kaspi deposit flow deleted in Phase 12-01

  if (successId && selectedService && selectedResource) {
    return (
      <SuccessScreen
        bookingId={successId}
        guestName={guestName}
        service={selectedService}
        resource={selectedResource}
        date={selectedDate}
        time={selectedTime}
        onReset={handleReset}
      />
    )
  }

  return (
    <div>
      <StepIndicator current={step} steps={steps} colors={colors} />

      {/* ── STEP 1 — Service ───────────────────────────────────────────────── */}
      {step === 'service' && (
        <div className={`space-y-4 animate-slide-${slideDir}`}>
          <h3 className="font-semibold text-foreground">{t('booking', 'selectService')}</h3>
          <RadioGroup
            value={selectedServiceId}
            onValueChange={(val) => { setSelectedServiceId(val); setSelectedResourceId('') }}
            className="space-y-3"
          >
            {services.map((service) => (
              <Label
                key={service.id}
                htmlFor={`service-${service.id}`}
                className={[
                  'flex items-start gap-3 p-4 rounded-2xl bg-[var(--neu-bg)] cursor-pointer transition-all duration-200',
                  selectedServiceId === service.id ? `neu-inset ${colors.serviceSelected}` : 'neu-raised',
                ].join(' ')}
              >
                <RadioGroupItem value={service.id} id={`service-${service.id}`} className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{service.name}</span>
                    <span className={[
                      'text-sm font-bold whitespace-nowrap',
                      selectedServiceId === service.id ? colors.accentText : 'text-foreground',
                    ].join(' ')}>
                      {formatPrice(service.price, service.currency)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                  )}
                  <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground">
                    {service.durationMin} {t('booking', 'minutes')}
                  </span>
                </div>
              </Label>
            ))}
          </RadioGroup>
          <div className="flex justify-end pt-2">
            <button
              disabled={!selectedServiceId}
              onClick={() => goForward('resource')}
              className={`px-5 py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] text-sm font-semibold transition-all duration-300 active:neu-inset disabled:opacity-40 disabled:cursor-not-allowed ${colors.accentText}`}
            >
              {t('common', 'next')} →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 — Resource ──────────────────────────────────────────────── */}
      {step === 'resource' && (
        <div className={`space-y-4 animate-slide-${slideDir}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground">
              {t('booking', 'selectResource').replace('{resource}', (resourceLabel ?? t('booking', 'specialist')).toLowerCase())}
            </h3>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground truncate max-w-[120px]">
              {selectedService?.name}
            </span>
          </div>
          <RadioGroup
            value={selectedResourceId}
            onValueChange={(val) => { setSelectedResourceId(val); setSelectedTime('') }}
            className="space-y-3"
          >
            {availableResources.map((resource) => (
              <Label
                key={resource.id}
                htmlFor={`resource-${resource.id}`}
                className={[
                  'flex items-start gap-3 p-4 rounded-2xl bg-[var(--neu-bg)] cursor-pointer transition-all duration-200',
                  selectedResourceId === resource.id ? `neu-inset ${colors.resourceSelected}` : 'neu-raised',
                ].join(' ')}
              >
                <RadioGroupItem value={resource.id} id={`resource-${resource.id}`} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-foreground">{resource.name}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {resource.specialization && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground">
                        {resource.specialization.startsWith('opt_') ? t('niche', resource.specialization) : resource.specialization}
                      </span>
                    )}
                    {resource.experienceYears != null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground">
                        {t('booking', 'experience').replace('{n}', String(resource.experienceYears))}
                      </span>
                    )}
                    {!resource.specialization && resource.attributes &&
                      Object.entries(resource.attributes)
                        .filter(([k]) => !['experience_years', 'languages', 'features', 'equipment_included'].includes(k))
                        .slice(0, 2)
                        .map(([k, v]) => {
                          if (typeof v === 'boolean') return v
                            ? <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground">{k === 'indoor' ? t('booking', 'indoor') : k}</span>
                            : null
                          if (Array.isArray(v) || v == null) return null
                          if (k === 'capacity') return (
                            <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground">
                              {t('booking', 'capacity').replace('{n}', String(v))}
                            </span>
                          )
                          const strVal = String(v)
                          return (
                            <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground">
                              {strVal.startsWith('opt_') ? t('niche', strVal) : strVal}
                            </span>
                          )
                        })
                    }
                  </div>
                </div>
              </Label>
            ))}
          </RadioGroup>
          <div className="flex justify-between pt-2">
            <button
              onClick={() => goBack('service')}
              className="px-5 py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] text-sm font-semibold text-foreground transition-all duration-300 active:neu-inset"
            >
              ← {t('common', 'back')}
            </button>
            <button
              disabled={!selectedResourceId}
              onClick={() => goForward('datetime')}
              className={`px-5 py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] text-sm font-semibold transition-all duration-300 active:neu-inset disabled:opacity-40 disabled:cursor-not-allowed ${colors.accentText}`}
            >
              {t('common', 'next')} →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 — Date & Time ───────────────────────────────────────────── */}
      {step === 'datetime' && (
        <div className={`space-y-5 animate-slide-${slideDir}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <h3 className="font-semibold text-foreground shrink-0">{t('booking', 'datetime')}</h3>
            <div className="flex flex-wrap gap-1.5 sm:ml-auto">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground">{selectedService?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground">{selectedResource?.name}</span>
            </div>
          </div>

          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('booking', 'date')}</label>
            <input
              type="date"
              min={minDateStr}
              max={maxDateStr}
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value
                const yearMatch = val.match(/^(\d{4})/)
                if (yearMatch && (parseInt(yearMatch[1]) < 2000 || parseInt(yearMatch[1]) > 2099)) return
                setSelectedDate(val)
                setSelectedTime('')
              }}
              className="block w-full min-h-[50px] rounded-xl neu-inset bg-[var(--neu-bg)] border-0 px-3 py-2.5 text-sm focus:outline-none text-foreground opacity-100 transition-colors"
              style={{
                // WebKit/iOS Safari: strip native OS date chrome that fights our custom shadow,
                // force opaque text (iOS sometimes renders date value as transparent),
                // and pin a min-width so the element cannot collapse to 0 on real devices.
                WebkitAppearance: 'none',
                appearance: 'none',
                color: 'var(--foreground)',
                opacity: 1,
                minWidth: '0',
                width: '100%',
              }}
            />
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">{t('booking', 'timeSlot')}</label>
                {slotsLoading && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    {t('common', 'loading')}
                  </span>
                )}
              </div>

              {slotsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-[var(--neu-bg)] neu-raised animate-pulse" />
                  ))}
                </div>
              ) : slotsFrozen ? (
                <div className="flex items-start gap-2 rounded-xl neu-inset bg-[var(--neu-bg)] px-4 py-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-muted-foreground">{t('public', 'bookingFrozenHint')}</p>
                </div>
              ) : dayOff ? (
                <p className="text-sm text-muted-foreground py-2">{t('booking', 'dayOff')}</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">{t('booking', 'noSlots')}</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        className={[
                          'py-2.5 rounded-xl text-sm font-medium bg-[var(--neu-bg)] transition-all duration-200',
                          !slot.available
                            ? 'neu-raised opacity-30 text-muted-foreground cursor-not-allowed'
                            : selectedTime === slot.time
                            ? `neu-inset ${colors.slotSelectedText}`
                            : `neu-raised text-foreground ${colors.slotHoverText}`,
                        ].join(' ')}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('booking', 'slotsHint')}</p>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => goBack('resource')}
              className="px-5 py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] text-sm font-semibold text-foreground transition-all duration-300 active:neu-inset"
            >
              ← {t('common', 'back')}
            </button>
            <button
              disabled={!selectedDate || !selectedTime}
              onClick={() => goForward('confirm')}
              className={`px-5 py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] text-sm font-semibold transition-all duration-300 active:neu-inset disabled:opacity-40 disabled:cursor-not-allowed ${colors.accentText}`}
            >
              {t('common', 'next')} →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4 — Confirm ───────────────────────────────────────────────── */}
      {step === 'confirm' && (
        <div className={`space-y-5 animate-slide-${slideDir}`}>
          <h3 className="font-semibold text-foreground">{t('booking', 'confirmBooking')}</h3>

          {/* Booking summary */}
          <div className="rounded-2xl bg-[var(--neu-bg)] neu-raised p-4 space-y-3 text-sm">
            <SummaryRow label={t('booking', 'service')}  value={selectedService?.name ?? '—'} />
            <SummaryRow label={t('booking', 'price')}    value={formatPrice(selectedService?.price ?? null, selectedService?.currency ?? 'KZT')} />
            <SummaryRow label={t('booking', 'duration')} value={`${selectedService?.durationMin} ${t('booking', 'minutes')}`} />
            <div className="border-t border-foreground/5 pt-3 space-y-3">
              <SummaryRow label={t('booking', 'specialist')} value={selectedResource?.name ?? '—'} />
              {selectedResource?.specialization && (
                <SummaryRow
                  label={t('booking', 'specialization')}
                  value={selectedResource.specialization.startsWith('opt_') ? t('niche', selectedResource.specialization) : selectedResource.specialization}
                />
              )}
            </div>
            <div className="border-t border-foreground/5 pt-3 space-y-3">
              <SummaryRow
                label={t('booking', 'date')}
                value={new Date(selectedDate).toLocaleDateString(dateLocale, { dateStyle: 'long' })}
              />
              <SummaryRow label={t('booking', 'timeSlot')} value={selectedTime} />
            </div>
          </div>

          {/* Guest details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">{t('booking', 'yourDetails')}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t('booking', 'guestName')} <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={t('booking', 'namePlaceholder')}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t('booking', 'guestPhone')} <span className="text-red-500">*</span>
                </label>
                <PhoneInput value={guestPhone} onChange={(formatted) => setGuestPhone(formatted)} required disabled={loading} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">{t('booking', 'guestEmail')}</label>
                <Input type="email" placeholder="example@mail.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} disabled={loading} />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* TODO(12-02): Deposit display removed — Kaspi deposit flow removed in Phase 12-01 */}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => goBack('datetime')}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl neu-raised bg-[var(--neu-bg)] text-sm font-semibold text-foreground transition-all duration-300 active:neu-inset disabled:opacity-40"
            >
              ← {t('common', 'back')}
            </button>
            {/* Main CTA */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`min-w-40 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${colors.submitBtn}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  {t('booking', 'saving')}
                </span>
              ) : (
                bookingLabel ?? t('booking', 'bookButton')
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- SummaryRow ------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground text-right">{value}</span>
    </div>
  )
}
