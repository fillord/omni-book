"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

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
  /** Generic bag of niche attributes for card display */
  attributes?: Record<string, unknown>
  serviceIds: string[]
}

type Props = {
  tenantSlug: string
  services: ServiceOption[]
  resources: ResourceOption[]
  /** Button label on the confirm step, e.g. "Забронировать столик" */
  bookingLabel?: string
  /** Step-2 heading & resource card label, e.g. "Столик" */
  resourceLabel?: string
}

type Step = "service" | "resource" | "datetime" | "confirm"

// ---- helpers ---------------------------------------------------------------

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "Бесплатно"
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
    { id: "datetime", label: "Дата и время" },
    { id: "confirm",  label: "Подтверждение" },
  ]
}

// ---- StepIndicator ---------------------------------------------------------

function StepIndicator({ current, steps }: { current: Step; steps: { id: Step; label: string }[] }) {
  const currentIdx = steps.findIndex((s) => s.id === current)
  return (
    <ol className="flex items-center gap-0 w-full mb-8">
      {steps.map((step, idx) => {
        const done   = idx < currentIdx
        const active = idx === currentIdx
        return (
          <li key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                done   ? "bg-primary border-primary text-primary-foreground"
                       : active ? "border-primary text-primary"
                       : "border-muted text-muted-foreground",
              ].join(" ")}>
                {done ? "✓" : idx + 1}
              </span>
              <span className={[
                "text-xs whitespace-nowrap",
                active ? "text-primary font-medium" : "text-muted-foreground",
              ].join(" ")}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={[
                "flex-1 h-0.5 mx-2 mb-5 transition-colors",
                done ? "bg-primary" : "bg-border",
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
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
        ✓
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">Вы записаны!</h3>
        <p className="text-muted-foreground text-sm">
          {guestName}, ваша запись подтверждена.
        </p>
      </div>

      <div className="w-full rounded-lg border bg-muted/30 p-4 text-sm space-y-2 text-left max-w-sm">
        <SummaryRow label="Услуга"      value={service.name} />
        <SummaryRow label="Специалист"  value={resource.name} />
        <Separator />
        <SummaryRow
          label="Дата"
          value={new Date(date).toLocaleDateString("ru-RU", { dateStyle: "long" })}
        />
        <SummaryRow label="Время" value={time} />
        <Separator />
        <p className="text-xs text-muted-foreground pt-1">
          № записи: <span className="font-mono">{bookingId}</span>
        </p>
      </div>

      <Button variant="outline" onClick={onReset}>
        Записаться ещё раз
      </Button>
    </div>
  )
}

// ---- BookingForm -----------------------------------------------------------

export function BookingForm({ tenantSlug, services, resources, bookingLabel, resourceLabel }: Props) {
  const steps = buildSteps(resourceLabel ?? 'Специалист')

  // wizard state
  const [step, setStep] = useState<Step>("service")
  const [selectedServiceId,  setSelectedServiceId]  = useState("")
  const [selectedResourceId, setSelectedResourceId] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")

  // guest state
  const [guestName,  setGuestName]  = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [guestEmail, setGuestEmail] = useState("")

  // slots state
  const [slots,       setSlots]       = useState<{ time: string; startsAt: string; endsAt: string; available: boolean }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [dayOff,       setDayOff]      = useState(false)

  // submission state
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  // fetch slots whenever resource, service, or date changes
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
      .catch(() => {/* aborted or network error — silently ignore */})
      .finally(() => setSlotsLoading(false))
    return () => controller.abort()
  }, [selectedResourceId, selectedServiceId, selectedDate])

  const selectedService  = services.find((s) => s.id === selectedServiceId)
  const selectedResource = resources.find((r) => r.id === selectedResourceId)

  // Map slot time → startsAt UTC ISO string for submission
  const slotStartsAtMap = Object.fromEntries(slots.map((s) => [s.time, s.startsAt]))

  const availableResources = selectedServiceId
    ? resources.filter((r) => r.serviceIds.includes(selectedServiceId))
    : resources

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split("T")[0]

  // ---- submit ---------------------------------------------------------------

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

  // ---- reset ----------------------------------------------------------------

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

  // ---- success screen -------------------------------------------------------

  if (successId && selectedService && selectedResource) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <SuccessScreen
            bookingId={successId}
            guestName={guestName}
            service={selectedService}
            resource={selectedResource}
            date={selectedDate}
            time={selectedTime}
            onReset={handleReset}
          />
        </CardContent>
      </Card>
    )
  }

  // ---- wizard ---------------------------------------------------------------

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{bookingLabel ?? 'Записаться'}</CardTitle>
        <CardDescription>Выберите услугу, {resourceLabel?.toLowerCase() ?? 'специалиста'} и удобное время</CardDescription>
      </CardHeader>
      <CardContent>
        <StepIndicator current={step} steps={steps} />

        {/* STEP 1 — Service */}
        {step === "service" && (
          <div className="space-y-4">
            <h3 className="font-medium">Выберите услугу</h3>
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
                    "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                    selectedServiceId === service.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40",
                  ].join(" ")}
                >
                  <RadioGroupItem value={service.id} id={`service-${service.id}`} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">
                        {formatPrice(service.price, service.currency)}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                    )}
                    <Badge variant="secondary" className="mt-2 text-xs">{service.durationMin} мин</Badge>
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <div className="flex justify-end pt-2">
              <Button disabled={!selectedServiceId} onClick={() => setStep("resource")}>
                Далее →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — Resource */}
        {step === "resource" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Выберите {resourceLabel ?? 'специалиста'}</h3>
              <Badge variant="outline">{selectedService?.name}</Badge>
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
                    "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                    selectedResourceId === resource.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40",
                  ].join(" ")}
                >
                  <RadioGroupItem value={resource.id} id={`resource-${resource.id}`} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{resource.name}</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {resource.type === "staff" ? "Врач" : "Кабинет"}
                      </Badge>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{resource.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {resource.specialization && (
                        <Badge variant="outline" className="text-xs">{resource.specialization}</Badge>
                      )}
                      {resource.experienceYears != null && (
                        <Badge variant="outline" className="text-xs">Опыт: {resource.experienceYears} лет</Badge>
                      )}
                      {/* Niche-specific attributes (capacity, surface, etc.) */}
                      {!resource.specialization && resource.attributes && Object.entries(resource.attributes)
                        .filter(([k]) => !['experience_years', 'languages', 'features', 'equipment_included'].includes(k))
                        .slice(0, 2)
                        .map(([k, v]) => {
                          if (typeof v === 'boolean') return v ? <Badge key={k} variant="outline" className="text-xs">{k === 'indoor' ? 'Крытый' : String(k)}</Badge> : null
                          if (Array.isArray(v) || v == null) return null
                          if (k === 'capacity') return <Badge key={k} variant="outline" className="text-xs">до {String(v)} чел.</Badge>
                          return <Badge key={k} variant="outline" className="text-xs">{String(v)}</Badge>
                        })
                      }
                    </div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("service")}>← Назад</Button>
              <Button disabled={!selectedResourceId} onClick={() => setStep("datetime")}>Далее →</Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Date & Time */}
        {step === "datetime" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Выберите дату и время</h3>
              <div className="flex gap-2">
                <Badge variant="outline">{selectedService?.name}</Badge>
                <Badge variant="outline">{selectedResource?.name}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Дата</Label>
              <Input
                id="date"
                type="date"
                min={minDateStr}
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime("") }}
                className="max-w-xs"
              />
            </div>
            {selectedDate && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label>Время</Label>
                  {slotsLoading && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Загрузка…
                    </span>
                  )}
                </div>

                {slotsLoading ? (
                  /* Skeleton while loading */
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : dayOff ? (
                  <p className="text-sm text-muted-foreground py-2">
                    В этот день специалист не работает. Выберите другую дату.
                  </p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Нет доступных слотов на этот день.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          title={!slot.available ? "Время занято" : undefined}
                          className={[
                            "px-2 py-2 rounded-md text-sm border transition-colors",
                            !slot.available
                              ? "border-border bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                              : selectedTime === slot.time
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:border-primary hover:text-primary",
                          ].join(" ")}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Серые слоты уже заняты</p>
                  </>
                )}
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("resource")}>← Назад</Button>
              <Button disabled={!selectedDate || !selectedTime} onClick={() => setStep("confirm")}>
                Далее →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Confirm */}
        {step === "confirm" && (
          <div className="space-y-5">
            <h3 className="font-medium">Подтвердите запись</h3>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
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
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Ваши данные
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="guest-name">
                    Имя <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guest-name"
                    placeholder="Иван Иванов"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guest-phone">
                    Телефон <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guest-phone"
                    type="tel"
                    placeholder="+7 000 000 00 00"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="guest-email">Email (необязательно)</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    placeholder="example@mail.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("datetime")} disabled={loading}>
                ← Назад
              </Button>
              <Button
                className="min-w-36"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Сохраняем…
                  </span>
                ) : (
                  bookingLabel ?? 'Записаться'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---- SummaryRow ------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
