"use client"

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { useI18n } from '@/lib/i18n/context'

// ---- types -----------------------------------------------------------------

export type ServiceOption = {
  id:          string
  name:        string
  description: string | null
  durationMin: number
  price:       number | null
  currency:    string
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
}

type Step = 'service' | 'resource' | 'datetime' | 'confirm'

// ---- niche colors ----------------------------------------------------------

type NicheColorClasses = {
  stepActive:       string
  stepDone:         string
  stepLine:         string
  slotSelected:     string
  slotHover:        string
  submitBtn:        string
  serviceSelected:  string
  resourceSelected: string
}

const BOOKING_COLORS: Record<string, NicheColorClasses> = {
  blue: {
    stepActive:       'border-blue-600 text-blue-600',
    stepDone:         'bg-blue-600 border-blue-600 text-white',
    stepLine:         'bg-blue-600',
    slotSelected:     'bg-blue-600 text-white border-blue-600',
    slotHover:        'hover:border-blue-500 hover:text-blue-600',
    submitBtn:        'bg-blue-600 hover:bg-blue-700 text-white',
    serviceSelected:  'border-blue-600 bg-card',
    resourceSelected: 'border-blue-600 bg-card',
  },
  pink: {
    stepActive:       'border-pink-600 text-pink-600',
    stepDone:         'bg-pink-600 border-pink-600 text-white',
    stepLine:         'bg-pink-600',
    slotSelected:     'bg-pink-600 text-white border-pink-600',
    slotHover:        'hover:border-pink-500 hover:text-pink-600',
    submitBtn:        'bg-pink-600 hover:bg-pink-700 text-white',
    serviceSelected:  'border-pink-600 bg-card',
    resourceSelected: 'border-pink-600 bg-card',
  },
  orange: {
    stepActive:       'border-orange-600 text-orange-600',
    stepDone:         'bg-orange-600 border-orange-600 text-white',
    stepLine:         'bg-orange-600',
    slotSelected:     'bg-orange-600 text-white border-orange-600',
    slotHover:        'hover:border-orange-500 hover:text-orange-600',
    submitBtn:        'bg-orange-600 hover:bg-orange-700 text-white',
    serviceSelected:  'border-orange-600 bg-card',
    resourceSelected: 'border-orange-600 bg-card',
  },
  green: {
    stepActive:       'border-green-600 text-green-600',
    stepDone:         'bg-green-600 border-green-600 text-white',
    stepLine:         'bg-green-600',
    slotSelected:     'bg-green-600 text-white border-green-600',
    slotHover:        'hover:border-green-500 hover:text-green-600',
    submitBtn:        'bg-green-600 hover:bg-green-700 text-white',
    serviceSelected:  'border-green-600 bg-card',
    resourceSelected: 'border-green-600 bg-card',
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
        const done   = idx < currentIdx
        const isActive = idx === currentIdx
        return (
          <li key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 min-w-[2.5rem]">
              <span className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                done     ? colors.stepDone
                : isActive ? colors.stepActive
                : 'border-border text-muted-foreground',
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

  // Confetti particles
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

      <div className="w-full rounded-xl border border-border bg-card p-5 text-sm space-y-3 text-left max-w-sm">
        <SummaryRow label={t('booking', 'service')}    value={service.name} />
        <SummaryRow label={t('booking', 'specialist')} value={resource.name} />
        <Separator />
        <SummaryRow
          label={t('booking', 'date')}
          value={new Date(date).toLocaleDateString(dateLocale, { dateStyle: 'long' })}
        />
        <SummaryRow label={t('booking', 'timeSlot')} value={time} />
        <Separator />
        <p className="text-xs text-muted-foreground pt-1">
          {t('booking', 'bookingNumber')}: <span className="font-mono font-medium text-foreground">{bookingId}</span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          {t('booking', 'bookAgain')}
        </button>
        <button
          onClick={downloadICS}
          className="flex-1 py-2.5 rounded-xl bg-foreground text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
        >
          📅 {t('booking', 'addToCalendar')}
        </button>
      </div>
    </div>
  )
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

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [slideDir,  setSlideDir]  = useState<'left' | 'right'>('left')

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
    fetch(
      `/api/bookings/slots?tenantSlug=${encodeURIComponent(tenantSlug)}&resourceId=${selectedResourceId}&serviceId=${selectedServiceId}&date=${selectedDate}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? [])
        setDayOff(!!data.dayOff)
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
  }

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

      {/* STEP 1 — Service */}
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
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selectedServiceId === service.id
                    ? colors.serviceSelected
                    : 'border-border hover:border-border/80',
                ].join(' ')}
              >
                <RadioGroupItem value={service.id} id={`service-${service.id}`} className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{service.name}</span>
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">
                      {formatPrice(service.price, service.currency)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                  )}
                  <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
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
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors.submitBtn}`}
            >
              {t('common', 'next')} →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Resource */}
      {step === 'resource' && (
        <div className={`space-y-4 animate-slide-${slideDir}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground">
              {t('booking', 'selectResource').replace('{resource}', (resourceLabel ?? t('booking', 'specialist')).toLowerCase())}
            </h3>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground truncate max-w-[120px]">
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
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selectedResourceId === resource.id
                    ? colors.resourceSelected
                    : 'border-border hover:border-border/80',
                ].join(' ')}
              >
                <RadioGroupItem value={resource.id} id={`resource-${resource.id}`} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{resource.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {resource.specialization && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {resource.specialization.startsWith('opt_') ? t('niche', resource.specialization) : resource.specialization}
                      </span>
                    )}
                    {resource.experienceYears != null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {t('booking', 'experience').replace('{n}', String(resource.experienceYears))}
                      </span>
                    )}
                    {!resource.specialization && resource.attributes &&
                      Object.entries(resource.attributes)
                        .filter(([k]) => !['experience_years', 'languages', 'features', 'equipment_included'].includes(k))
                        .slice(0, 2)
                        .map(([k, v]) => {
                          if (typeof v === 'boolean') return v
                            ? <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{k === 'indoor' ? t('booking', 'indoor') : k}</span>
                            : null
                          if (Array.isArray(v) || v == null) return null
                          if (k === 'capacity') return (
                            <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {t('booking', 'capacity').replace('{n}', String(v))}
                            </span>
                          )
                          const strVal = String(v)
                          return <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {strVal.startsWith('opt_') ? t('niche', strVal) : strVal}
                          </span>
                        })
                    }
                  </div>
                </div>
              </Label>
            ))}
          </RadioGroup>
          <div className="flex justify-between pt-2">
            <button onClick={() => goBack('service')} className="px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              ← {t('common', 'back')}
            </button>
            <button
              disabled={!selectedResourceId}
              onClick={() => goForward('datetime')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors.submitBtn}`}
            >
              {t('common', 'next')} →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Date & Time */}
      {step === 'datetime' && (
        <div className={`space-y-5 animate-slide-${slideDir}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{t('booking', 'datetime')}</h3>
            <div className="flex gap-1.5 ml-auto">
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{selectedService?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{selectedResource?.name}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('booking', 'date')}</label>
            <input
              type="date"
              min={minDateStr}
              max={maxDateStr}
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value
                // Guard against malformed years (e.g. "0020" instead of "2026")
                const yearMatch = val.match(/^(\d{4})/)
                if (yearMatch && (parseInt(yearMatch[1]) < 2000 || parseInt(yearMatch[1]) > 2099)) return
                setSelectedDate(val)
                setSelectedTime('')
              }}
              className="block w-full sm:max-w-xs rounded-xl border-2 border-input px-3 py-2.5 text-sm focus:outline-none focus:border-ring transition-colors bg-background text-foreground"
            />
          </div>

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
                    <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />
                  ))}
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
                          'py-2.5 rounded-xl text-sm font-medium border-2 transition-all',
                          !slot.available
                            ? 'border-border/50 bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                            : selectedTime === slot.time
                            ? colors.slotSelected
                            : `border-border text-foreground ${colors.slotHover}`,
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
            <button onClick={() => goBack('resource')} className="px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              ← {t('common', 'back')}
            </button>
            <button
              disabled={!selectedDate || !selectedTime}
              onClick={() => goForward('confirm')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors.submitBtn}`}
            >
              {t('common', 'next')} →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Confirm */}
      {step === 'confirm' && (
        <div className={`space-y-5 animate-slide-${slideDir}`}>
          <h3 className="font-semibold text-foreground">{t('booking', 'confirmBooking')}</h3>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-sm">
            <SummaryRow label={t('booking', 'service')}  value={selectedService?.name ?? '—'} />
            <SummaryRow label={t('booking', 'price')}    value={formatPrice(selectedService?.price ?? null, selectedService?.currency ?? 'KZT')} />
            <SummaryRow label={t('booking', 'duration')} value={`${selectedService?.durationMin} ${t('booking', 'minutes')}`} />
            <Separator />
            <SummaryRow label={t('booking', 'specialist')} value={selectedResource?.name ?? '—'} />
            {selectedResource?.specialization && (
              <SummaryRow
                label={t('booking', 'specialization')}
                value={selectedResource.specialization.startsWith('opt_') ? t('niche', selectedResource.specialization) : selectedResource.specialization}
              />
            )}
            <Separator />
            <SummaryRow
              label={t('booking', 'date')}
              value={new Date(selectedDate).toLocaleDateString(dateLocale, { dateStyle: 'long' })}
            />
            <SummaryRow label={t('booking', 'timeSlot')} value={selectedTime} />
          </div>

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

          <div className="flex justify-between pt-2">
            <button onClick={() => goBack('datetime')} disabled={loading} className="px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-40">
              ← {t('common', 'back')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`min-w-40 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors.submitBtn}`}
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
