// Server Component — niche-aware public tenant page

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Instagram, MessageCircle, Send } from 'lucide-react'
import { formatPhone, normalizePhone } from '@/lib/utils/phone'
import { basePrisma } from '@/lib/db'
import { getNicheConfig, type AttributeField } from '@/lib/niche/config'
import { BookingForm } from '@/components/booking-form'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { getServerT } from '@/lib/i18n/server'
import { cookies } from 'next/headers'
import { getDbTranslation } from '@/lib/i18n/db-translations'
import { PublicThemeToggle } from '@/components/public-theme-toggle'
import {
  PublicSectionsTabs,
  type PublicTabSection,
  type ResourceTabItem,
  type ServiceTabItem,
  type TabColorConfig,
} from '@/components/public-sections-tabs'

// ---- Niche color palette (static strings so Tailwind includes them) ---------

type ColorClasses = {
  accent: string
  light: string
  border: string
  avatarBg: string
  badge: string
  priceAccent: string
}

const COLORS: Record<string, ColorClasses> = {
  blue: {
    accent:      'text-blue-500',
    light:       'bg-[var(--neu-bg)]',
    border:      'border-[var(--neu-shadow-dark)]',
    avatarBg:    'neu-raised bg-[var(--neu-bg)] text-blue-500',
    badge:       'neu-raised bg-[var(--neu-bg)] text-blue-500',
    priceAccent: 'text-blue-500',
  },
  pink: {
    accent:      'text-pink-500',
    light:       'bg-[var(--neu-bg)]',
    border:      'border-[var(--neu-shadow-dark)]',
    avatarBg:    'neu-raised bg-[var(--neu-bg)] text-pink-500',
    badge:       'neu-raised bg-[var(--neu-bg)] text-pink-500',
    priceAccent: 'text-pink-500',
  },
  orange: {
    accent:      'text-orange-500',
    light:       'bg-[var(--neu-bg)]',
    border:      'border-[var(--neu-shadow-dark)]',
    avatarBg:    'neu-raised bg-[var(--neu-bg)] text-orange-500',
    badge:       'neu-raised bg-[var(--neu-bg)] text-orange-500',
    priceAccent: 'text-orange-500',
  },
  green: {
    accent:      'text-green-500',
    light:       'bg-[var(--neu-bg)]',
    border:      'border-[var(--neu-shadow-dark)]',
    avatarBg:    'neu-raised bg-[var(--neu-bg)] text-green-500',
    badge:       'neu-raised bg-[var(--neu-bg)] text-green-500',
    priceAccent: 'text-green-500',
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
  
  const tenantName = getDbTranslation(tenant as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> }, 'name', locale)
  const tenantDesc = getDbTranslation(tenant as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> }, 'description', locale)

  const bookableResources = tenant.resources.filter(
    (r) => r.schedules.some((s) => s.isActive)
  )

  const bookingServices = tenant.services.map((s) => ({
    id:          s.id,
    name:        getDbTranslation(s as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> }, 'name', locale),
    description: getDbTranslation(s as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> }, 'description', locale),
    durationMin: s.durationMin,
    price:       s.price,
    currency:    s.currency,
  }))

  const bookingResources = bookableResources.map((r) => {
    const attrs = parseAttrs(r.attributes)
    return {
      id:             r.id,
      name:           getDbTranslation(r as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> }, 'name', locale),
      type:           r.type,
      description:    getDbTranslation(r as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> }, 'description', locale),
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

  // ---- Build serialisable tab sections for PublicSectionsTabs -------------

  function buildResourceItem(
    r: TenantResource,
    isTable = false,
  ): ResourceTabItem {
    const name = getDbTranslation(
      r as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> },
      'name', locale,
    )
    const description = getDbTranslation(
      r as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> },
      'description', locale,
    )
    const attrs = parseAttrs(r.attributes)
    const displayFields = nicheConfig.attributeFields.filter(
      (f) => f.showInTable && (!f.forTypes || f.forTypes.includes(r.type)),
    )
    const badges = displayFields
      .map((field) => formatAttrForCard(field, attrs[field.key], t))
      .filter((b): b is string => b !== null)
    const workDayStr = r.schedules
      .filter((s) => s.isActive)
      .sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek))
      .map((s) => SHORT_DAYS[s.dayOfWeek])
      .join(', ')
    return {
      id:           r.id,
      name,
      description,
      avatarInitial: name.charAt(0),
      isTable,
      workDays:     workDayStr ? `${t('public', 'workDays')} ${workDayStr}` : '',
      badges,
    }
  }

  type TenantService = NonNullable<typeof tenant>['services'][number]
  function buildServiceItem(s: TenantService): ServiceTabItem {
    return {
      id: s.id,
      name: getDbTranslation(
        s as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> },
        'name', locale,
      ),
      description: getDbTranslation(
        s as unknown as { name: string; description: string | null; translations: Record<string, Record<string, string>> },
        'description', locale,
      ),
      priceFormatted: s.price === null || s.price === 0
        ? t('booking', 'free')
        : new Intl.NumberFormat('ru-RU', { style: 'currency', currency: s.currency, maximumFractionDigits: 0 }).format(s.price / 100),
      durationLabel: `${s.durationMin} ${t('booking', 'minutes')}`,
    }
  }

  const tabSections: PublicTabSection[] = []

  if (sections.includes('specialists') && staffResources.length > 0) {
    tabSections.push({
      id:    'specialists',
      label: t('niche', nicheConfig.resourceLabelPlural),
      type:  'resources',
      items: staffResources.map((r) => buildResourceItem(r)),
    })
  }
  if (sections.includes('trainers') && staffResources.length > 0) {
    tabSections.push({
      id:    'trainers',
      label: t('public', 'trainers'),
      type:  'resources',
      items: staffResources.map((r) => buildResourceItem(r)),
    })
  }
  if (sections.includes('tables') && tableResources.length > 0) {
    tabSections.push({
      id:    'tables',
      label: t('niche', nicheConfig.resourceLabelPlural),
      type:  'resources',
      items: tableResources.map((r) => buildResourceItem(r, true)),
    })
  }
  if (sections.includes('courts') && courtResources.length > 0) {
    tabSections.push({
      id:    'courts',
      label: t('niche', nicheConfig.resourceLabelPlural),
      type:  'resources',
      items: courtResources.map((r) => buildResourceItem(r)),
    })
  }
  if (tenant.services.length > 0 && !sections.includes('pricing')) {
    tabSections.push({
      id:    'services',
      label: t('public', 'services'),
      type:  'services',
      items: tenant.services.map(buildServiceItem),
    })
  }
  if (sections.includes('pricing') && tenant.services.length > 0) {
    tabSections.push({
      id:    'pricing',
      label: t('public', 'priceList'),
      type:  'pricing',
      items: tenant.services.map(buildServiceItem),
    })
  }

  const tabColors: TabColorConfig = {
    accent:      colors.accent,
    avatarBg:    colors.avatarBg,
    badge:       colors.badge,
    priceAccent: colors.priceAccent,
  }

  return (
    <div className="min-h-screen bg-[var(--neu-bg)] text-foreground transition-colors duration-300">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[var(--neu-bg)] backdrop-blur neu-raised transition-colors duration-300">
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
            <span className="font-bold text-foreground truncate">{tenantName}</span>
            <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
              {t('niche', nicheConfig.label)}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasSocial && (
              <div className="hidden sm:flex items-center gap-2 mr-1">
                {social.instagram && (
                  <a href={instagramUrl(social.instagram)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Instagram">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {social.whatsapp && (
                  <a href={whatsappUrl(social.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                {social.telegram && (
                  <a href={telegramUrl(social.telegram)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Telegram">
                    <Send className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
            <LocaleSwitcher className="h-8 text-xs" />
            <PublicThemeToggle className="inline-flex" />
            {canBook && (
              <a
                href="#booking"
                className={`text-sm font-semibold px-4 py-2 rounded-xl neu-btn ${colors.accent} transition-colors`}
              >
                {t('niche', nicheConfig.bookingLabel)}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="bg-[var(--neu-bg)] py-20 md:py-32"
        style={tenant.coverUrl ? {
          backgroundImage: `url(${tenant.coverUrl})`,
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
              className="w-16 h-16 rounded-2xl mb-4 object-cover neu-raised"
            />
          )}

          <span className={`inline-block mb-3 text-xs font-semibold uppercase tracking-widest ${colors.accent}`}>
            {t('niche', nicheConfig.label)}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-4">
            {tenantName}
          </h1>

          {/* Tenant description (from settings) */}
          {tenantDesc && (
            <p className="text-lg text-muted-foreground mb-3 max-w-2xl leading-relaxed">
              {tenantDesc}
            </p>
          )}

          <p className="text-xl md:text-2xl font-medium text-foreground mb-2">
            {t('niche', nicheConfig.heroTitle)}
          </p>
          <p className="text-base text-muted-foreground mb-8">
            {t('niche', nicheConfig.heroSubtitle)}
          </p>

          {canBook && (
            <a
              href="#booking"
              className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-base neu-btn ${colors.accent} transition-colors w-full sm:w-auto`}
            >
              {t('niche', nicheConfig.bookingLabel)} →
            </a>
          )}
        </div>
      </section>

      {/* ── Contact info bar ──────────────────────────────────────────────── */}
      {hasContacts && (
        <section className="bg-[var(--neu-bg)]">
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

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-16 bg-[var(--neu-bg)]">

        {/* ── Sections: Resources + Services (tab-switched, grid, truncated) ── */}
        {tabSections.length > 0 && (
          <PublicSectionsTabs
            sections={tabSections}
            colors={tabColors}
            showAllLabel={t('public', 'showAll')}
          />
        )}

        {/* ── Gallery placeholder (beauty) ────────────────────────────────── */}
        {sections.includes('gallery') && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <SectionHeading title={t('public', 'portfolio')} className="mb-0" />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>{t('public', 'soon')}</span>
            </div>
            <div className="rounded-2xl bg-[var(--neu-bg)] neu-inset p-12 text-center">
              <p className="text-muted-foreground text-sm">{t('public', 'galleryPlaceholder')}</p>
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
            <div className="rounded-2xl bg-[var(--neu-bg)] neu-inset p-12 text-center">
              <p className="text-muted-foreground text-sm">{t('public', 'menuPlaceholder')}</p>
            </div>
          </section>
        )}

        {/* ── Booking form ────────────────────────────────────────────────── */}
        <section id="booking" className="rounded-2xl bg-[var(--neu-bg)] neu-raised p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">{t('niche', nicheConfig.bookingLabel)}</h2>
          <p className="text-muted-foreground text-sm mb-8">
            {t('public', 'bookingHint').replace('{resource}', t('niche', nicheConfig.resourceLabel).toLowerCase())}
          </p>

          {!canBook ? (
            <div className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">{t('public', 'soonOpening')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('public', 'ownerSetup')}</p>
            </div>
          ) : (
            <BookingForm
              tenantSlug={tenant.slug}
              services={bookingServices}
              resources={bookingResources}
              bookingLabel={t('niche', nicheConfig.bookingLabel)}
              resourceLabel={t('niche', nicheConfig.resourceLabel)}
              nicheColor={nicheConfig.color}
              bookingWindowDays={(tenant as unknown as { bookingWindowDays: number }).bookingWindowDays ?? 14}
              requireDeposit={(tenant as unknown as { requireDeposit: boolean }).requireDeposit ?? false}
              depositAmount={(tenant as unknown as { depositAmount: number | null }).depositAmount ?? 0}
            />
          )}
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      {/* intentional: fixed dark footer surface -- brand design choice, dark in both modes */}
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
    <h2 className={`text-2xl font-bold text-foreground ${className}`}>{title}</h2>
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
    <div className="flex items-center gap-3 neu-inset bg-[var(--neu-bg)] rounded-xl p-3">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="font-semibold text-foreground text-sm hover:underline">
            {value}
          </a>
        ) : (
          <p className="font-semibold text-foreground text-sm">{value}</p>
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
  const strVal = String(value)
  if (strVal.startsWith('opt_')) return t('niche', strVal)
  return strVal
}
