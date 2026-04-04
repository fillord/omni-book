import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { getNicheConfig } from '@/lib/niche/config'
import { getAnalytics } from '@/lib/actions/analytics'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookingStatusBadge } from '@/components/booking-status-badge'
import { ActivityTimeline, type ActivityItem } from '@/components/dashboard/activity-timeline'
import { AnalyticsOverview } from '@/components/dashboard/analytics-overview'
import { CalendarCheck, Clock, Sparkles, TrendingUp } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

// ---- helpers ---------------------------------------------------------------

function formatUpcomingTime(utcStr: Date | string): string {
  const d = new Date(utcStr)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(d)
}

function getGreeting(hour: number): string {
  if (hour >= 5  && hour < 12) return 'Доброе утро'
  if (hour >= 12 && hour < 17) return 'Добрый день'
  if (hour >= 17 && hour < 22) return 'Добрый вечер'
  return 'Доброй ночи'
}

// ---- page ------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) redirect('/login')

  const tenantId = session.user.tenantId
  const now      = new Date()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  // Parallel fetches — analytics runs alongside the dashboard queries
  const [t, analyticsData, tenant, todayBookingsCount, recentActivity] = await Promise.all([
    getServerT(),
    getAnalytics('30d'),
    basePrisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        niche: true,
        plan: true,
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            startsAt: { gt: now },
          },
          orderBy: { startsAt: 'asc' },
          take: 5,
          select: {
            id: true,
            guestName: true,
            startsAt: true,
            status: true,
            resource: { select: { name: true } },
            service:  { select: { name: true } },
          },
        },
      },
    }),
    basePrisma.booking.count({
      where: {
        tenantId,
        startsAt: { gte: todayStart, lte: todayEnd },
        status:   { in: ['PENDING', 'CONFIRMED'] },
      },
    }),
    basePrisma.booking.findMany({
      where:   { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        status: true,
        guestName: true,
        createdAt: true,
        resource: { select: { name: true } },
        service:  { select: { name: true } },
      },
    }),
  ])

  if (!tenant) redirect('/login')

  const nicheConfig  = getNicheConfig(tenant.niche)
  const nicheColor   = nicheConfig.color
  const firstName    = session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || ''
  const greeting     = getGreeting(new Date().getHours())

  const NICHE_LABELS: Record<string, string> = {
    medicine: t('dashboard', 'nicheMedicine'),
    beauty:   t('dashboard', 'nicheBeauty'),
    horeca:   t('dashboard', 'nicheHoreca'),
    sports:   t('dashboard', 'nicheSports'),
  }

  const activities: ActivityItem[] = recentActivity.map((b) => ({
    id: b.id,
    type: (
      b.status === 'CANCELLED' ? 'booking_cancelled'
      : b.status === 'COMPLETED' ? 'booking_completed'
      : b.status === 'NO_SHOW'   ? 'booking_no_show'
      : 'booking_created'
    ) as ActivityItem['type'],
    guestName:    b.guestName,
    serviceName:  b.service?.name ?? null,
    resourceName: b.resource.name,
    createdAt:    b.createdAt.toISOString(),
  }))

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Welcome Banner — bg-white/10, bg-white/15, text-white/* values below are intentional:
          semi-transparent white overlays on the indigo gradient surface.
          The gradient has its own dark: variants — overlays remain white/10 in both modes. ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-700 dark:via-indigo-600 dark:to-violet-700 p-6 text-white animate-gradient">
        <div aria-hidden className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-8 -left-8  h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute top-4 right-8 animate-float">
          <Sparkles className="h-6 w-6 text-white/20" />
        </div>
        <div className="relative">
          <p className="text-indigo-100 text-sm font-medium">{greeting}</p>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">{firstName}!</h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-sm font-medium">
              <CalendarCheck className="h-4 w-4" />
              {todayBookingsCount} {t('dashboard', 'bookingsToday')}
            </div>
            <Badge variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm">
              {NICHE_LABELS[tenant.niche ?? ''] ?? tenant.niche} · {tenant.plan}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Analytics Overview (KPIs + charts + top services) ── */}
      <AnalyticsOverview
        initial={analyticsData}
        color={nicheColor}
        todayCount={todayBookingsCount}
      />

      {/* ── Operations row: activity feed + upcoming bookings ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Activity feed */}
        <Card className="neu-raised bg-[var(--neu-bg)] animate-slide-up">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Недавняя активность
            </CardTitle>
            <CardDescription>Последние действия в вашем бизнесе</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <ActivityTimeline activities={activities} />
          </CardContent>
        </Card>

        {/* Upcoming bookings */}
        <Card className="neu-raised bg-[var(--neu-bg)] animate-slide-up">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {t('dashboard', 'upcoming')}
            </CardTitle>
            <CardDescription>{t('dashboard', 'upcomingHint')}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {tenant.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('dashboard', 'noUpcoming')}
              </p>
            ) : (
              <div className="space-y-2">
                {tenant.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover-lift neu-inset"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{b.guestName ?? '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {b.service?.name ?? '—'} · {b.resource.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatUpcomingTime(b.startsAt)}
                      </span>
                      <BookingStatusBadge status={b.status as 'PENDING' | 'CONFIRMED'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>


    </div>
  )
}
