// Server Component — niche-aware public tenant page

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Instagram, MessageCircle, Send } from 'lucide-react'
import { formatPhone, normalizePhone } from '@/lib/utils/phone'
import { basePrisma } from '@/lib/db'
import { getNicheConfig, type NicheConfig, type AttributeField } from '@/lib/niche/config'
import { BookingForm } from '@/components/booking-form'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { getServerT } from '@/lib/i18n/server'
import { cookies } from 'next/headers'
import { getDbTranslation } from '@/lib/i18n/db-translations'

// ---- Niche color palette (static strings so Tailwind includes them) ---------

type ColorClasses = {
  accent: string
  light: string
  border: string
  avatarBg: string
  badge: string
  heroGradient: string
  heroBtn: string
  heroHint: string
  stickyBtn: string
  priceAccent: string
}

const COLORS: Record<string, ColorClasses> = {
  blue: {
    accent:       'text-blue-600',
    light:        'bg-blue-50',
    border:       'border-blue-200',
    avatarBg:     'bg-blue-100 text-blue-700',
    badge:        'bg-blue-100 text-blue-700',
    heroGradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
    heroBtn:      'bg-white text-blue-700 hover:bg-blue-50',
    heroHint:     'text-blue-100',
    stickyBtn:    'bg-blue-600 text-white hover:bg-blue-700',
    priceAccent:  'text-blue-600',
  },
  pink: {
    accent:       'text-pink-600',
    light:        'bg-pink-50',
    border:       'border-pink-200',
    avatarBg:     'bg-pink-100 text-pink-700',
    badge:        'bg-pink-100 text-pink-700',
    heroGradient: 'bg-gradient-to-br from-pink-500 to-pink-700',
    heroBtn:      'bg-white text-pink-700 hover:bg-pink-50',
    heroHint:     'text-pink-100',
    stickyBtn:    'bg-pink-600 text-white hover:bg-pink-700',
    priceAccent:  'text-pink-600',
  },
  orange: {
    accent:       'text-orange-600',
    light:        'bg-orange-50',
    border:       'border-orange-200',
    avatarBg:     'bg-orange-100 text-orange-700',
    badge:        'bg-orange-100 text-orange-700',
    heroGradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
    heroBtn:      'bg-white text-orange-700 hover:bg-orange-50',
    heroHint:     'text-orange-100',
    stickyBtn:    'bg-orange-600 text-white hover:bg-orange-700',
    priceAccent:  'text-orange-600',
  },
  green: {
    accent:       'text-green-600',
    light:        'bg-green-50',
    border:       'border-green-200',
    avatarBg:     'bg-green-100 text-green-700',
    badge:        'bg-green-100 text-green-700',
    heroGradient: 'bg-gradient-to-br from-green-600 to-green-800',
    heroBtn:      'bg-white text-green-700 hover:bg-green-50',
    heroHint:     'text-green-100',
    stickyBtn:    'bg-green-600 text-white hover:bg-green-700',
    priceAccent:  'text-green-600',
  },
}

const FALLBACK_COLORS = COLORS.blue

// ---- Types -----------------------------------------------------------------

type TenantResource = {
  id: string
  name: string
  type: string
  description: string | null
  attributes: unknown
  services: { serviceId: string }[]
  schedules: { dayOfWeek: number; isActive: boolean }[]
}

type SocialLinks = {
  instagram?: string
  whatsapp?:  string
  telegram?:  string
}

// ---- Helpers ---------------------------------------------------------------

function parseSocialLinks(raw: unknown): SocialLinks {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as SocialLinks
  }
  return {}
}

function instagramUrl(handle: string): string {
  if (handle.startsWith('http')) return handle
  return `https://instagram.com/${handle.replace('@', '')}`
}

function telegramUrl(handle: string): string {
  if (handle.startsWith('http')) return handle
  return `https://t.me/${handle.replace('@', '')}`
}

function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
}

// ---- Page component --------------------------------------------------------

type Translator = (section: string, key: string) => string

export async function TenantPublicPage({ slug }: { slug: string }) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('omnibook-locale')?.value || 'ru'

  const [t, tenant] = await Promise.all([
    getServerT(),
    basePrisma.tenant.findUnique({
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
    }),
  ])

  if (!tenant) notFound()

  const SHORT_DAYS: Record<number, string> = {
    0: t('days', 'sun'), 1: t('days', 'mon'), 2: t('days', 'tue'),
    3: t('days', 'wed'), 4: t('days', 'thu'), 5: t('days', 'fri'), 6: t('days', 'sat'),
  }

  const nicheConfig = getNicheConfig(tenant.niche)
  const colors      = COLORS[nicheConfig.color] ?? FALLBACK_COLORS
  const sections    = nicheConfig.publicPageSections
  const social      = parseSocialLinks(tenant.socialLinks)
  
  const tenantName = getDbTranslation(tenant, 'name', locale)
  const tenantDesc = getDbTranslation(tenant, 'description', locale)

  const bookableResources = tenant.resources.filter(
    (r) => r.schedules.some((s) => s.isActive)
  )

  const bookingServices = tenant.services.map((s) => ({
    id:          s.id,
    name:        getDbTranslation(s, 'name', locale),
    description: getDbTranslation(s, 'description', locale),
    durationMin: s.durationMin,
    price:       s.price,
    currency:    s.currency,
  }))

  const bookingResources = bookableResources.map((r) => {
    const attrs = parseAttrs(r.attributes)
    return {
      id:             r.id,
      name:           getDbTranslation(r, 'name', locale),
      type:           r.type,
      description:    getDbTranslation(r, 'description', locale),
      specialization: (attrs.specialization as string)   ?? null,
      experienceYears:(attrs.experience_years as number) ?? null,
      attributes:     attrs,
      serviceIds:     r.services.map((rs) => rs.serviceId),
    }
  })

  const staffResources = tenant.resources.filter((r) => r.type === 'staff')
  const tableResources = tenant.resources.filter((r) => r.type === 'table' || r.type === 'room')
  const courtResources = tenant.resources.filter((r) => r.type === 'court' || r.type === 'room')

  const canBook = bookableResources.length > 0 && bookingServices.length > 0

  const hasContacts = !!(tenant.phone || tenant.address || tenant.workingHours || tenant.email)
  const hasSocial   = !!(social.instagram || social.whatsapp || social.telegram)

  return (
    <div className="min-h-screen bg-white">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {tenant.logoUrl && (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-7 h-7 rounded-lg object-cover shrink-0"
              />
            )}
            <span className="font-bold text-zinc-900 truncate">{tenantName}</span>
            <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
              {t('niche', nicheConfig.label)}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LocaleSwitcher className="h-8 text-xs" />
            {canBook && (
              <a
                href="#booking"
                className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${colors.stickyBtn}`}
              >
                {t('niche', nicheConfig.bookingLabel)}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className={`${colors.heroGradient} py-20 md:py-32`}
        style={tenant.coverUrl ? {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.72)), url(${tenant.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <div className="max-w-5xl mx-auto px-4 text-center md:text-left">
          {/* Logo */}
          {tenant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
            alt={tenantName}
            className="w-16 h-16 rounded-2xl mb-4 object-cover shadow-lg"
          />
        )}

        <span className={`inline-block mb-3 text-xs font-semibold uppercase tracking-widest ${colors.heroHint}`}>
          {t('niche', nicheConfig.label)}
        </span>
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
          {tenantName}
        </h1>

        {/* Tenant description (from settings) */}
        {tenantDesc && (
          <p className="text-lg text-white/85 mb-3 max-w-2xl leading-relaxed">
            {tenantDesc}
          </p>
        )}

          <p className="text-xl md:text-2xl font-medium text-white/80 mb-2">
            {t('niche', nicheConfig.heroTitle)}
          </p>
          <p className="text-base text-white/60 mb-8">
            {t('niche', nicheConfig.heroSubtitle)}
          </p>

          {canBook && (
            <a
              href="#booking"
              className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-base transition-colors shadow-lg ${colors.heroBtn} w-full sm:w-auto`}
            >
              {t('niche', nicheConfig.bookingLabel)} →
            </a>
          )}
        </div>
      </section>

      {/* ── Contact info bar ──────────────────────────────────────────────── */}
      {hasContacts && (
        <section className={`border-b ${colors.border} ${colors.light}`}>
          <div className="max-w-5xl mx-auto px-4 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {tenant.workingHours && (
                <InfoBlock icon="🕐" label={t('public', 'workingHours')} value={tenant.workingHours} />
              )}
              {tenant.address && (
                <InfoBlock
                  icon="📍"
                  label={t('public', 'address')}
                  value={tenant.address + (tenant.city ? `, ${tenant.city}` : '')}
                />
              )}
              {tenant.phone && (
                <InfoBlock icon="📞" label={t('public', 'phone')} value={formatPhone(tenant.phone)} href={`tel:${normalizePhone(tenant.phone)}`} />
              )}
              {tenant.email && (
                <InfoBlock icon="✉️" label="Email" value={tenant.email} href={`mailto:${tenant.email}`} />
              )}
            </div>
          </div>
        </section>
      )}

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-16">

        {/* ── Specialists / Staff ─────────────────────────────────────────── */}
        {sections.includes('specialists') && staffResources.length > 0 && (
          <section>
            <SectionHeading title={t('niche', nicheConfig.resourceLabelPlural)} />
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {staffResources.map((r) => (
                <ResourceCard key={r.id} resource={r} nicheConfig={nicheConfig} colors={colors} shortDays={SHORT_DAYS} t={t} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ── Tables / HoReCa ─────────────────────────────────────────────── */}
        {sections.includes('tables') && tableResources.length > 0 && (
          <section>
            <SectionHeading title={t('niche', nicheConfig.resourceLabelPlural)} />
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {tableResources.map((r) => (
                <ResourceCard key={r.id} resource={r} nicheConfig={nicheConfig} colors={colors} isTable shortDays={SHORT_DAYS} t={t} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ── Courts / Sports ─────────────────────────────────────────────── */}
        {sections.includes('courts') && courtResources.length > 0 && (
          <section>
            <SectionHeading title={t('niche', nicheConfig.resourceLabelPlural)} />
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {courtResources.map((r) => (
                <ResourceCard key={r.id} resource={r} nicheConfig={nicheConfig} colors={colors} shortDays={SHORT_DAYS} t={t} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ── Trainers ────────────────────────────────────────────────────── */}
        {sections.includes('trainers') && staffResources.length > 0 && (
          <section>
            <SectionHeading title={t('public', 'trainers')} />
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {staffResources.map((r) => (
                <ResourceCard key={r.id} resource={r} nicheConfig={nicheConfig} colors={colors} shortDays={SHORT_DAYS} t={t} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ── Services (horizontal scroll on mobile) ──────────────────────── */}
        {tenant.services.length > 0 && !sections.includes('pricing') && (
          <section>
            <SectionHeading title={t('public', 'services')} />
            <div className="flex gap-4 overflow-x-auto snap-x scroll-smooth pb-2 -mx-4 px-4">
              {tenant.services.map((s) => (
                <div
                  key={s.id}
                  className={`snap-start shrink-0 w-56 rounded-2xl border-2 ${colors.border} ${colors.light} p-4 flex flex-col gap-2`}
                >
                  <p className="font-semibold text-zinc-900 text-sm">{getDbTranslation(s, 'name', locale)}</p>
                  {getDbTranslation(s, 'description', locale) && (
                    <p className="text-xs text-zinc-500 leading-relaxed">{getDbTranslation(s, 'description', locale)}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className={`text-sm font-bold ${colors.priceAccent}`}>
                      {s.price === null || s.price === 0
                        ? t('booking', 'free')
                        : new Intl.NumberFormat('ru-RU', { style: 'currency', currency: s.currency, maximumFractionDigits: 0 }).format(s.price / 100)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white text-zinc-500 border border-zinc-200">
                      {s.durationMin} {t('booking', 'minutes')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Gallery placeholder (beauty) ────────────────────────────────── */}
        {sections.includes('gallery') && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <SectionHeading title={t('public', 'portfolio')} className="mb-0" />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>{t('public', 'soon')}</span>
            </div>
            <div className={`rounded-2xl border-2 border-dashed ${colors.border} ${colors.light} p-12 text-center`}>
              <p className="text-zinc-400 text-sm">{t('public', 'galleryPlaceholder')}</p>
            </div>
          </section>
        )}

        {/* ── Menu placeholder (horeca) ───────────────────────────────────── */}
        {sections.includes('menu') && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <SectionHeading title={t('public', 'menu')} className="mb-0" />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>{t('public', 'soon')}</span>
            </div>
            <div className={`rounded-2xl border-2 border-dashed ${colors.border} ${colors.light} p-12 text-center`}>
              <p className="text-zinc-400 text-sm">{t('public', 'menuPlaceholder')}</p>
            </div>
          </section>
        )}

        {/* ── Pricing / Sports ────────────────────────────────────────────── */}
        {sections.includes('pricing') && tenant.services.length > 0 && (
          <section>
            <SectionHeading title={t('public', 'priceList')} />
            <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
              {tenant.services.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 bg-white hover:bg-zinc-50 transition-colors">
                  <div>
                    <p className="font-semibold text-zinc-900 text-sm">{getDbTranslation(s, 'name', locale)}</p>
                    {getDbTranslation(s, 'description', locale) && (
                      <p className="text-xs text-zinc-400 mt-0.5">{getDbTranslation(s, 'description', locale)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 pl-4">
                    <p className={`font-bold text-sm ${colors.priceAccent}`}>
                      {s.price === null || s.price === 0
                        ? t('booking', 'free')
                        : new Intl.NumberFormat('ru-RU', { style: 'currency', currency: s.currency, maximumFractionDigits: 0 }).format(s.price / 100)}
                    </p>
                    <p className="text-xs text-zinc-400">{s.durationMin} {t('booking', 'minutes')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Booking form ────────────────────────────────────────────────── */}
        <section id="booking" className={`rounded-2xl ${colors.light} border-2 ${colors.border} p-6 md:p-8`}>
          <h2 className="text-2xl font-bold text-zinc-900 mb-1">{t('niche', nicheConfig.bookingLabel)}</h2>
          <p className="text-zinc-500 text-sm mb-8">
            {t('public', 'bookingHint').replace('{resource}', t('niche', nicheConfig.resourceLabel).toLowerCase())}
          </p>

          {!canBook ? (
            <div className="py-12 text-center">
              <p className="text-lg font-medium text-zinc-400">{t('public', 'soonOpening')}</p>
              <p className="mt-1 text-sm text-zinc-300">{t('public', 'ownerSetup')}</p>
            </div>
          ) : (
            <BookingForm
              tenantSlug={tenant.slug}
              services={bookingServices}
              resources={bookingResources}
              bookingLabel={t('niche', nicheConfig.bookingLabel)}
              resourceLabel={t('niche', nicheConfig.resourceLabel)}
              nicheColor={nicheConfig.color}
            />
          )}
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-zinc-900 text-zinc-400 mt-8 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-5">

          {/* Tenant info */}
          <div className="text-center md:text-left">
            <p className="font-semibold text-white">{tenantName}</p>
            {(tenant.address || tenant.city) && (
              <p className="text-sm mt-0.5">
                {[tenant.address, tenant.city].filter(Boolean).join(', ')}
              </p>
            )}
            {tenant.phone && (
              <a href={`tel:${normalizePhone(tenant.phone)}`} className="text-sm hover:text-white transition-colors">
                {formatPhone(tenant.phone)}
              </a>
            )}
          </div>

          {/* Social links */}
          {hasSocial && (
            <div className="flex items-center gap-4">
              {social.instagram && (
                <a
                  href={instagramUrl(social.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {social.whatsapp && (
                <a
                  href={whatsappUrl(social.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {social.telegram && (
                <a
                  href={telegramUrl(social.telegram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  title="Telegram"
                >
                  <Send className="w-5 h-5" />
                </a>
              )}
            </div>
          )}

          {/* Platform link */}
          <p className="text-xs">
            {t('public', 'poweredBy')}{' '}
            <Link href="/" className="hover:text-white transition-colors font-medium">
              omnibook
            </Link>
          </p>
        </div>
      </footer>

    </div>
  )
}

// ---- Sub-components --------------------------------------------------------

function SectionHeading({ title, className = "mb-6" }: { title: string; className?: string }) {
  return (
    <h2 className={`text-2xl font-bold text-zinc-900 ${className}`}>{title}</h2>
  )
}

function ResourceCard({
  resource,
  nicheConfig,
  colors,
  isTable = false,
  shortDays,
  t,
  locale,
}: {
  resource: TenantResource
  nicheConfig: NicheConfig
  colors: ColorClasses
  isTable?: boolean
  shortDays: Record<number, string>
  t: Translator
  locale: string
}) {
  const attrs        = parseAttrs(resource.attributes)
  const displayFields = nicheConfig.attributeFields.filter(
    (f) => f.showInTable && (!f.forTypes || f.forTypes.includes(resource.type))
  )

  const resourceName = getDbTranslation(resource, 'name', locale)
  const resourceDesc = getDbTranslation(resource, 'description', locale)

  const workDays = resource.schedules
    .filter((s) => s.isActive)
    .sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek))
    .map((s) => shortDays[s.dayOfWeek])
    .join(', ')

  return (
    <div className="group rounded-2xl border-2 border-zinc-100 bg-white p-5 flex flex-col gap-4 hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-100 hover:-translate-y-0.5 transition-all duration-200">
      {/* Avatar / Icon */}
      {isTable ? (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.light}`}>
          🍽️
        </div>
      ) : (
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${colors.avatarBg}`}>
          {resource.name.charAt(0)}
        </div>
      )}

      {/* Name */}
      <div>
        <p className="font-semibold text-zinc-900">{resourceName}</p>
        {resourceDesc && (
          <p className="text-sm text-zinc-500 mt-0.5">{resourceDesc}</p>
        )}
      </div>

      {/* Attribute badges */}
      {displayFields.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayFields.map((field) => {
            const label = formatAttrForCard(field, attrs[field.key], t)
            if (!label) return null
            return (
              <span
                key={field.key}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}
              >
                {label}
              </span>
            )
          })}
        </div>
      )}

      {/* Work days */}
      {workDays && (
        <p className="text-xs text-zinc-400 mt-auto">{t('public', 'workDays')} {workDays}</p>
      )}
    </div>
  )
}

function InfoBlock({
  icon,
  label,
  value,
  href,
}: {
  icon: string
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        {href ? (
          <a href={href} className="font-semibold text-zinc-800 text-sm hover:underline">
            {value}
          </a>
        ) : (
          <p className="font-semibold text-zinc-800 text-sm">{value}</p>
        )}
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

function formatAttrForCard(field: AttributeField, value: unknown, t: Translator): string | null {
  if (value == null || value === '') return null
  if (field.type === 'checkbox')  return (value as boolean) ? field.label : null
  if (field.type === 'multitext') return null
  if (field.key === 'experience_years') return t('public', 'experienceYears').replace('{n}', String(value))
  if (field.key === 'capacity')         return t('public', 'capacity').replace('{n}', String(value))
  return String(value)
}
