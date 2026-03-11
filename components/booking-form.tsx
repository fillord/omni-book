"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"

// ---- types -----------------------------------------------------------------

export type ServiceOption = {
  id: string
  name: string
  description: string | null
  durationMin: number
  price: number | null
  currency: string
}

export type ResourceOption = {
  id: string
  name: string
  type: string
  description: string | null
  specialization: string | null
  experienceYears: number | null
  attributes?: Record<string, unknown>
  serviceIds: string[]
}

type Props = {
  tenantSlug: string
  services: ServiceOption[]
  resources: ResourceOption[]
  bookingLabel?: string
  resourceLabel?: string
  /** Niche color key: "blue" | "pink" | "orange" | "green" */
  nicheColor?: string
}

type Step = "service" | "resource" | "datetime" | "confirm"

// ---- niche colors ----------------------------------------------------------

type NicheColorClasses = {
  stepActive: string
  stepDone: string
  stepLine: string
  slotSelected: string
  slotHover: string
  submitBtn: string
  serviceSelected: string
  resourceSelected: string
}

const BOOKING_COLORS: Record<string, NicheColorClasses> = {
  blue: {
    stepActive:       "border-blue-600 text-blue-600",
    stepDone:         "bg-blue-600 border-blue-600 text-white",
    stepLine:         "bg-blue-600",
    slotSelected:     "bg-blue-600 text-white border-blue-600",
    slotHover:        "hover:border-blue-500 hover:text-blue-600",
    submitBtn:        "bg-blue-600 hover:bg-blue-700 text-white",
    serviceSelected:  "border-blue-600 bg-blue-50",
    resourceSelected: "border-blue-600 bg-blue-50",
  },
  pink: {
    stepActive:       "border-pink-600 text-pink-600",
    stepDone:         "bg-pink-600 border-pink-600 text-white",
    stepLine:         "bg-pink-600",
    slotSelected:     "bg-pink-600 text-white border-pink-600",
    slotHover:        "hover:border-pink-500 hover:text-pink-600",
    submitBtn:        "bg-pink-600 hover:bg-pink-700 text-white",
    serviceSelected:  "border-pink-600 bg-pink-50",
    resourceSelected: "border-pink-600 bg-pink-50",
  },
  orange: {
    stepActive:       "border-orange-600 text-orange-600",
    stepDone:         "bg-orange-600 border-orange-600 text-white",
    stepLine:         "bg-orange-600",
    slotSelected:     "bg-orange-600 text-white border-orange-600",
    slotHover:        "hover:border-orange-500 hover:text-orange-600",
    submitBtn:        "bg-orange-600 hover:bg-orange-700 text-white",
    serviceSelected:  "border-orange-600 bg-orange-50",
    resourceSelected: "border-orange-600 bg-orange-50",
  },
  green: {
    stepActive:       "border-green-600 text-green-600",
    stepDone:         "bg-green-600 border-green-600 text-white",
    stepLine:         "bg-green-600",
    slotSelected:     "bg-green-600 text-white border-green-600",
    slotHover:        "hover:border-green-500 hover:text-green-600",
    submitBtn:        "bg-green-600 hover:bg-green-700 text-white",
    serviceSelected:  "border-green-600 bg-green-50",
    resourceSelected: "border-green-600 bg-green-50",
  },
}

const FALLBACK_COLORS = BOOKING_COLORS.blue

// ---- helpers ---------------------------------------------------------------

function formatPrice(price: number | null, currency: string): string {
  if (price === null || price === 0) return "Бесплатно"
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price / 100)
}

function buildSteps(resourceLabel: string): { id: Step; label: string }[] {
  return [
    { id: "service",  label: "Услуга" },
    { id: "resource", label: resourceLabel },
    { id: "datetime", label: "Дата" },
    { id: "confirm",  label: "Данные" },
  ]
}

function generateICS(params: {
  summary: string
  description: string
  date: string
  time: string
  durationMin: number
}): string {
  const [year, month, day] = params.date.split("-").map(Number)
  const [hour, min] = params.time.split(":").map(Number)
  const pad = (n: number) => String(n).padStart(2, "0")
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(min)}00`
  const endDate = new Date(year, month - 1, day, hour, min + params.durationMin)
  const dtEnd = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OmniBook//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${params.summary}`,
    `DESCRIPTION:${params.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

// ---- StepIndicator ---------------------------------------------------------

function StepIndicator({
  current,
  steps,
  colors,
}: {
  current: Step
  steps: { id: Step; label: string }[]
  colors: NicheColorClasses
}) {
  const currentIdx = steps.findIndex((s) => s.id === current)
  return (
    <ol className="flex items-center w-full mb-8">
      {steps.map((step, idx) => {
        const done   = idx < currentIdx
        const active = idx === currentIdx
        return (
          <li key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 min-w-[2.5rem]">
              <span className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                done   ? colors.stepDone
                : active ? colors.stepActive
                : "border-zinc-200 text-zinc-400",
              ].join(" ")}>
                {done ? "✓" : idx + 1}
              </span>
              <span className={[
                "text-xs whitespace-nowrap hidden sm:block",
                active ? "font-medium text-zinc-800" : "text-zinc-400",
              ].join(" ")}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={[
                "flex-1 h-0.5 mx-1 mb-5 transition-colors",
                done ? colors.stepLine : "bg-zinc-200",
              ].join(" ")} />
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
  service: ServiceOption
  resource: ResourceOption
  date: string
  time: string
  onReset: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  function downloadICS() {
    const ics = generateICS({
      summary: service.name,
      description: resource.name,
      date,
      time,
      durationMin: service.durationMin,
    })
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = "booking.ics"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div
        className={[
          "w-20 h-20 rounded-full bg-green-100 flex items-center justify-center transition-all duration-500",
          visible ? "scale-100 opacity-100" : "scale-50 opacity-0",
        ].join(" ")}
      >
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path className={`transition-[stroke-dashoffset] duration-500 ${visible ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:30]"}`}
            style={{ strokeDasharray: 30, strokeDashoffset: visible ? 0 : 30 }}
            d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-zinc-900">Вы записаны!</h3>
        <p className="text-zinc-500 text-sm">{guestName}, ваша запись подтверждена.</p>
      </div>

      <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm space-y-3 text-left max-w-sm">
        <SummaryRow label="Услуга"     value={service.name} />
        <SummaryRow label="Специалист" value={resource.name} />
        <Separator />
        <SummaryRow
          label="Дата"
          value={new Date(date).toLocaleDateString("ru-RU", { dateStyle: "long" })}
        />
        <SummaryRow label="Время" value={time} />
        <Separator />
        <p className="text-xs text-zinc-400 pt-1">
          № записи: <span className="font-mono font-medium text-zinc-600">{bookingId}</span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Записаться ещё раз
        </button>
        <button
          onClick={downloadICS}
          className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          📅 В календарь
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
}: Props) {
  const colors = BOOKING_COLORS[nicheColor ?? "blue"] ?? FALLBACK_COLORS
  const steps  = buildSteps(resourceLabel ?? "Специалист")

  const [step, setStep]                     = useState<Step>("service")
  const [selectedServiceId, setSelectedServiceId]   = useState("")
  const [selectedResourceId, setSelectedResourceId] = useState("")
  const [selectedDate, setSelectedDate]     = useState("")
  const [selectedTime, setSelectedTime]     = useState("")

  const [guestName,  setGuestName]  = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [guestEmail, setGuestEmail] = useState("")

  const [slots,        setSlots]        = useState<{ time: string; startsAt: string; endsAt: string; available: boolean }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [dayOff,       setDayOff]       = useState(false)

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

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
  }, [selectedResourceId, selectedServiceId, selectedDate])

  const selectedService  = services.find((s) => s.id === selectedServiceId)
  const selectedResource = resources.find((r) => r.id === selectedResourceId)
  const slotStartsAtMap  = Object.fromEntries(slots.map((s) => [s.time, s.startsAt]))

  const availableResources = selectedServiceId
    ? resources.filter((r) => r.serviceIds.includes(selectedServiceId))
    : resources

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split("T")[0]

  async function handleSubmit() {
    if (!guestName.trim() || !guestPhone.trim()) {
      setError("Пожалуйста, заполните имя и номер телефона.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings?tenantSlug=${encodeURIComponent(tenantSlug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setError(data.error ?? "Что-то пошло не так. Попробуйте ещё раз.")
        return
      }
      setSuccessId(data.booking.id)
    } catch {
      setError("Нет соединения с сервером. Проверьте интернет и попробуйте снова.")
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setStep("service")
    setSelectedServiceId("")
    setSelectedResourceId("")
    setSelectedDate("")
    setSelectedTime("")
    setGuestName("")
    setGuestPhone("")
    setGuestEmail("")
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
      {step === "service" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-zinc-900">Выберите услугу</h3>
          <RadioGroup
            value={selectedServiceId}
            onValueChange={(val) => { setSelectedServiceId(val); setSelectedResourceId("") }}
            className="space-y-3"
          >
            {services.map((service) => (
              <Label
                key={service.id}
                htmlFor={`service-${service.id}`}
                className={[
                  "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  selectedServiceId === service.id
                    ? colors.serviceSelected
                    : "border-zinc-200 hover:border-zinc-300",
                ].join(" ")}
              >
                <RadioGroupItem value={service.id} id={`service-${service.id}`} className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900">{service.name}</span>
                    <span className="text-sm font-bold text-zinc-700 whitespace-nowrap">
                      {formatPrice(service.price, service.currency)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-sm text-zinc-500 mt-0.5">{service.description}</p>
                  )}
                  <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                    {service.durationMin} мин
                  </span>
                </div>
              </Label>
            ))}
          </RadioGroup>
          <div className="flex justify-end pt-2">
            <button
              disabled={!selectedServiceId}
              onClick={() => setStep("resource")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors.submitBtn}`}
            >
              Далее →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Resource */}
      {step === "resource" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-zinc-900">Выберите {resourceLabel ?? "специалиста"}</h3>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 truncate max-w-[120px]">
              {selectedService?.name}
            </span>
          </div>
          <RadioGroup
            value={selectedResourceId}
            onValueChange={(val) => { setSelectedResourceId(val); setSelectedTime("") }}
            className="space-y-3"
          >
            {availableResources.map((resource) => (
              <Label
                key={resource.id}
                htmlFor={`resource-${resource.id}`}
                className={[
                  "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  selectedResourceId === resource.id
                    ? colors.resourceSelected
                    : "border-zinc-200 hover:border-zinc-300",
                ].join(" ")}
              >
                <RadioGroupItem value={resource.id} id={`resource-${resource.id}`} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">{resource.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {resource.specialization && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{resource.specialization}</span>
                    )}
                    {resource.experienceYears != null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">Опыт: {resource.experienceYears} лет</span>
                    )}
                    {!resource.specialization && resource.attributes && Object.entries(resource.attributes)
                      .filter(([k]) => !["experience_years", "languages", "features", "equipment_included"].includes(k))
                      .slice(0, 2)
                      .map(([k, v]) => {
                        if (typeof v === "boolean") return v ? <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{k === "indoor" ? "Крытый" : k}</span> : null
                        if (Array.isArray(v) || v == null) return null
                        if (k === "capacity") return <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">до {String(v)} чел.</span>
                        return <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{String(v)}</span>
                      })
                    }
                  </div>
                </div>
              </Label>
            ))}
          </RadioGroup>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("service")} className="px-5 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">
              ← Назад
            </button>
            <button
              disabled={!selectedResourceId}
              onClick={() => setStep("datetime")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors.submitBtn}`}
            >
              Далее →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Date & Time */}
      {step === "datetime" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-zinc-900">Дата и время</h3>
            <div className="flex gap-1.5 ml-auto">
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{selectedService?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{selectedResource?.name}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Дата</label>
            <input
              type="date"
              min={minDateStr}
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime("") }}
              className="block w-full sm:max-w-xs rounded-xl border-2 border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-400 transition-colors bg-white"
            />
          </div>

          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-700">Время</label>
                {slotsLoading && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Загрузка…
                  </span>
                )}
              </div>

              {slotsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-zinc-100 animate-pulse" />
                  ))}
                </div>
              ) : dayOff ? (
                <p className="text-sm text-zinc-400 py-2">В этот день специалист не работает. Выберите другую дату.</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-zinc-400 py-2">Нет доступных слотов на этот день.</p>
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
                          "py-2.5 rounded-xl text-sm font-medium border-2 transition-all",
                          !slot.available
                            ? "border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed"
                            : selectedTime === slot.time
                            ? colors.slotSelected
                            : `border-zinc-200 text-zinc-700 ${colors.slotHover}`,
                        ].join(" ")}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400">Серые слоты уже заняты</p>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("resource")} className="px-5 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">
              ← Назад
            </button>
            <button
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep("confirm")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors.submitBtn}`}
            >
              Далее →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Confirm */}
      {step === "confirm" && (
        <div className="space-y-5">
          <h3 className="font-semibold text-zinc-900">Подтвердите запись</h3>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3 text-sm">
            <SummaryRow label="Услуга"       value={selectedService?.name ?? "—"} />
            <SummaryRow label="Цена"         value={formatPrice(selectedService?.price ?? null, selectedService?.currency ?? "KZT")} />
            <SummaryRow label="Длительность" value={`${selectedService?.durationMin} мин`} />
            <Separator />
            <SummaryRow label="Специалист"   value={selectedResource?.name ?? "—"} />
            {selectedResource?.specialization && (
              <SummaryRow label="Специализация" value={selectedResource.specialization} />
            )}
            <Separator />
            <SummaryRow
              label="Дата"
              value={new Date(selectedDate).toLocaleDateString("ru-RU", { dateStyle: "long" })}
            />
            <SummaryRow label="Время" value={selectedTime} />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-700">Ваши данные</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Имя <span className="text-red-500">*</span>
                </label>
                <Input placeholder="Иван Иванов" value={guestName} onChange={(e) => setGuestName(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Телефон <span className="text-red-500">*</span>
                </label>
                <PhoneInput value={guestPhone} onChange={(formatted) => setGuestPhone(formatted)} required disabled={loading} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-zinc-700">Email (необязательно)</label>
                <Input type="email" placeholder="example@mail.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} disabled={loading} />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("datetime")} disabled={loading} className="px-5 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-40">
              ← Назад
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
                  Сохраняем…
                </span>
              ) : (
                bookingLabel ?? "Записаться"
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
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold text-zinc-800 text-right">{value}</span>
    </div>
  )
}
