// Server Component — niche-aware public tenant page
// Used by app/(tenant)/clinic/page.tsx (static) and app/(tenant)/[slug]/page.tsx (dynamic)

import { notFound } from 'next/navigation'
import { basePrisma } from '@/lib/db'
import { getNicheConfig, type NicheConfig, type AttributeField } from '@/lib/niche/config'
import { BookingForm } from '@/components/booking-form'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ---- Niche color palette (hardcoded strings so Tailwind includes them) ------

type ColorClasses = {
  accent: string
  light: string
  border: string
  avatarBg: string
  badge: string
}

const COLORS: Record<string, ColorClasses> = {
  blue: {
    accent:   'text-blue-600',
    light:    'bg-blue-50',
    border:   'border-blue-200',
    avatarBg: 'bg-blue-100 text-blue-700',
    badge:    'bg-blue-100 text-blue-700',
  },
  pink: {
    accent:   'text-pink-600',
    light:    'bg-pink-50',
    border:   'border-pink-200',
    avatarBg: 'bg-pink-100 text-pink-700',
    badge:    'bg-pink-100 text-pink-700',
  },
  orange: {
    accent:   'text-orange-600',
    light:    'bg-orange-50',
    border:   'border-orange-200',
    avatarBg: 'bg-orange-100 text-orange-700',
    badge:    'bg-orange-100 text-orange-700',
  },
  green: {
    accent:   'text-green-600',
    light:    'bg-green-50',
    border:   'border-green-200',
    avatarBg: 'bg-green-100 text-green-700',
    badge:    'bg-green-100 text-green-700',
  },
}

const FALLBACK_COLORS = COLORS.blue

// ---- Constants -------------------------------------------------------------

const SHORT_DAYS: Record<number, string> = {
  0: 'Вс', 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб',
}

// ---- DB query type ----------------------------------------------------------

type TenantResource = {
  id: string
  name: string
  type: string
  description: string | null
  attributes: unknown
  services: { serviceId: string }[]
  schedules: { dayOfWeek: number; isActive: boolean }[]
}

// ---- Page component --------------------------------------------------------

export async function TenantPublicPage({ slug }: { slug: string }) {
  const tenant = await basePrisma.tenant.findUnique({
    where: { slug },
    include: {
      services: {
        where:   { isActive: true },
        orderBy: { name: 'asc' },
      },
      resources: {
        where:   { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          services:  { select: { serviceId: true } },
          schedules: { select: { dayOfWeek: true, isActive: true } },
        },
      },
    },
  })

  if (!tenant) notFound()

  const nicheConfig = getNicheConfig(tenant.niche)
  const colors      = COLORS[nicheConfig.color] ?? FALLBACK_COLORS
  const sections    = nicheConfig.publicPageSections

  // Resources that have at least one active working day (otherwise unbookable)
  const bookableResources = tenant.resources.filter(
    (r) => r.schedules.some((s) => s.isActive)
  )

  // Map to BookingForm-compatible types
  const bookingServices = tenant.services.map((s) => ({
    id:          s.id,
    name:        s.name,
    description: s.description,
    durationMin: s.durationMin,
    price:       s.price,
    currency:    s.currency,
  }))

  const bookingResources = bookableResources.map((r) => {
    const attrs = parseAttrs(r.attributes)
    return {
      id:             r.id,
      name:           r.name,
      type:           r.type,
      description:    r.description,
      specialization: (attrs.specialization as string)    ?? null,
      experienceYears:(attrs.experience_years as number)  ?? null,
      attributes:     attrs,
      serviceIds:     r.services.map((rs) => rs.serviceId),
    }
  })

  // Group resources by type for different section renders
  const staffResources = tenant.resources.filter((r) => r.type === 'staff')
  const tableResources = tenant.resources.filter((r) => r.type === 'table' || r.type === 'room')
  const courtResources = tenant.resources.filter((r) => r.type === 'court' || r.type === 'room')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">

      {/* Sticky header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-lg">{tenant.name}</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}>
            {nicheConfig.label}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Hero — solid niche accent color */}
        <section className={`rounded-2xl ${nicheConfig.accentClass} text-white p-8 space-y-3`}>
          <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-lg font-medium opacity-90">{nicheConfig.heroTitle}</p>
          <p className="text-sm opacity-75">{nicheConfig.heroSubtitle}</p>
          {bookableResources.length > 0 && bookingServices.length > 0 && (
            <a
              href="#booking"
              className="mt-1 inline-flex items-center rounded-md bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors"
            >
              {nicheConfig.bookingLabel} →
            </a>
          )}
        </section>

        {/* Info card */}
        <section className={`rounded-2xl border ${colors.border} ${colors.light} p-6 space-y-4`}>
          <div className="grid gap-6 sm:grid-cols-3 text-sm">
            <InfoBlock icon="🕐" label="Часы работы"  value="Пн–Пт: 9:00–19:00" />
            <InfoBlock icon="📍" label="Адрес"        value="Алматы" />
            <InfoBlock icon="📞" label="Телефон"      value="+7 700 000 00 00" />
          </div>

          <Separator />

          {/* Services quick-list */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {nicheConfig.serviceLabel}и
            </p>
            <div className="flex flex-wrap gap-2">
              {tenant.services.map((s) => (
                <Badge key={s.id} variant="outline">{s.name}</Badge>
              ))}
            </div>
          </div>
        </section>

        {/* --- MEDICINE / BEAUTY: specialists (staff) --- */}
        {sections.includes('specialists') && staffResources.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{nicheConfig.resourceLabelPlural}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {staffResources.map((r) => (
                <NicheResourceCard key={r.id} resource={r} nicheConfig={nicheConfig} colors={colors} />
              ))}
            </div>
          </section>
        )}

        {/* --- HORECA: tables & rooms --- */}
        {sections.includes('tables') && tableResources.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{nicheConfig.resourceLabelPlural}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tableResources.map((r) => (
                <NicheResourceCard key={r.id} resource={r} nicheConfig={nicheConfig} colors={colors} />
              ))}
            </div>
          </section>
        )}

        {/* --- SPORTS: courts & rooms --- */}
        {sections.includes('courts') && courtResources.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{nicheConfig.resourceLabelPlural}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courtResources.map((r) => (
                <NicheResourceCard key={r.id} resource={r} nicheConfig={nicheConfig} colors={colors} />
              ))}
            </div>
          </section>
        )}

        {/* --- SPORTS: trainers (staff) --- */}
        {sections.includes('trainers') && staffResources.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Тренеры</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {staffResources.map((r) => (
                <NicheResourceCard key={r.id} resource={r} nicheConfig={nicheConfig} colors={colors} />
              ))}
            </div>
          </section>
        )}

        {/* --- BEAUTY: portfolio placeholder --- */}
        {sections.includes('gallery') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Портфолио</h2>
              <Badge variant="outline">Скоро</Badge>
            </div>
            <div className={`rounded-xl border ${colors.border} ${colors.light} p-10 text-center`}>
              <p className="text-muted-foreground text-sm">Работы наших мастеров появятся здесь совсем скоро</p>
            </div>
          </section>
        )}

        {/* --- HORECA: menu placeholder --- */}
        {sections.includes('menu') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Меню</h2>
              <Badge variant="outline">Скоро</Badge>
            </div>
            <div className={`rounded-xl border ${colors.border} ${colors.light} p-10 text-center`}>
              <p className="text-muted-foreground text-sm">Электронное меню скоро будет доступно здесь</p>
            </div>
          </section>
        )}

        {/* --- SPORTS: pricing (services list) --- */}
        {sections.includes('pricing') && tenant.services.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Прайс-лист</h2>
            <div className="divide-y rounded-xl border overflow-hidden">
              {tenant.services.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-card">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 pl-4">
                    {s.price ? (
                      <p className={`font-semibold ${colors.accent}`}>
                        {new Intl.NumberFormat('ru-RU', {
                          style: 'currency',
                          currency: s.currency,
                          maximumFractionDigits: 0,
                        }).format(s.price / 100)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Бесплатно</p>
                    )}
                    <p className="text-xs text-muted-foreground">{s.durationMin} мин</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Booking form */}
        <section className="space-y-4" id="booking">
          <h2 className="text-xl font-semibold">{nicheConfig.bookingLabel}</h2>
          {bookableResources.length === 0 || bookingServices.length === 0 ? (
            <div className={`rounded-xl border ${colors.border} ${colors.light} py-12 text-center`}>
              <p className="text-lg font-medium text-muted-foreground">Скоро здесь появится онлайн-запись</p>
              <p className="mt-2 text-sm text-muted-foreground">Владелец ещё настраивает сервис</p>
            </div>
          ) : (
            <BookingForm
              tenantSlug={tenant.slug}
              services={bookingServices}
              resources={bookingResources}
              bookingLabel={nicheConfig.bookingLabel}
              resourceLabel={nicheConfig.resourceLabel}
            />
          )}
        </section>

      </main>

      <footer className="border-t mt-16 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {tenant.name} · Работает на{' '}
        <span className="font-medium">OmniBook</span>
      </footer>
    </div>
  )
}

// ---- Sub-components --------------------------------------------------------

function NicheResourceCard({
  resource,
  nicheConfig,
  colors,
}: {
  resource: TenantResource
  nicheConfig: NicheConfig
  colors: ColorClasses
}) {
  const attrs        = parseAttrs(resource.attributes)
  const displayFields = nicheConfig.attributeFields.filter(
    (f) => f.showInTable && (!f.forTypes || f.forTypes.includes(resource.type))
  )

  const workDays = resource.schedules
    .filter((s) => s.isActive)
    .sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek))
    .map((s) => SHORT_DAYS[s.dayOfWeek])
    .join(', ')

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${colors.avatarBg}`}>
        {resource.name.charAt(0)}
      </div>

      {/* Name & description */}
      <div>
        <p className="font-medium">{resource.name}</p>
        {resource.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{resource.description}</p>
        )}
      </div>

      {/* Attribute badges */}
      {displayFields.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayFields.map((field) => {
            const label = formatAttrForCard(field, attrs[field.key])
            if (!label) return null
            return (
              <span
                key={field.key}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors.badge}`}
              >
                {label}
              </span>
            )
          })}
        </div>
      )}

      {/* Work days */}
      {workDays && (
        <p className="text-xs text-muted-foreground">Дни приёма: {workDays}</p>
      )}
    </div>
  )
}

function InfoBlock({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}

// ---- Utilities -------------------------------------------------------------

function parseAttrs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

function formatAttrForCard(field: AttributeField, value: unknown): string | null {
  if (value == null || value === '') return null
  if (field.type === 'checkbox')  return (value as boolean) ? field.label : null
  if (field.type === 'multitext') return null  // skip arrays on cards
  if (field.key === 'experience_years') return `${value} лет`
  if (field.key === 'capacity')         return `до ${value} чел.`
  return String(value)
}
