import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { getNicheConfig } from '@/lib/niche/config'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookingStatusBadge } from '@/components/booking-status-badge'
import {
  Briefcase,
  Scissors,
  CalendarCheck,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

// ---- helpers ---------------------------------------------------------------

function formatUpcomingTime(utcStr: Date | string): string {
  const d = new Date(utcStr)
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d)
  const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(d)
  return `${date}, ${time}`
}

function getGreeting(hour: number, t: (section: string, key: string) => string): string {
  if (hour >= 5 && hour < 12) return t('dashboard', 'goodMorning')
  if (hour >= 12 && hour < 17) return t('dashboard', 'goodAfternoon')
  if (hour >= 17 && hour < 22) return t('dashboard', 'goodEvening')
  return t('dashboard', 'goodNight')
}

// ---- data ------------------------------------------------------------------

async function getDashboardData(tenantId: string) {
  const now = new Date()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [tenant, todayBookingsCount, recentActivity] = await Promise.all([
    basePrisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        resources: { where: { isActive: true }, select: { id: true } },
        services:  { where: { isActive: true }, select: { id: true } },
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            startsAt: { gt: now },
          },
          orderBy: { startsAt: 'asc' },
          take: 5,
          include: {
            resource: { select: { name: true } },
            service:  { select: { name: true } },
          },
        },
        _count: {
          select: { bookings: true, users: true },
        },
      },
    }),
    basePrisma.booking.count({
      where: {
        tenantId,
        startsAt: { gte: todayStart, lte: todayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    }),
    basePrisma.booking.findMany({
      where: { tenantId },
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

  return { tenant, todayBookingsCount, recentActivity }
}

// ---- page ------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) redirect('/login')

  const [{ tenant, todayBookingsCount, recentActivity }, t] = await Promise.all([
    getDashboardData(session.user.tenantId),
    getServerT(),
  ])
  if (!tenant) redirect('/login')

  const nicheConfig = getNicheConfig(tenant.niche)

  const NICHE_LABELS: Record<string, string> = {
    medicine: t('dashboard', 'nicheMedicine'),
    beauty:   t('dashboard', 'nicheBeauty'),
    horeca:   t('dashboard', 'nicheHoreca'),
    sports:   t('dashboard', 'nicheSports'),
  }

  const hour = new Date().getHours()
  const greeting = getGreeting(hour, t)
  const firstName = session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || ''

  // Map recent activity to timeline format
  const activities = recentActivity.map((b) => ({
    id: b.id,
    type: (
      b.status === 'CANCELLED' ? 'booking_cancelled'
      : b.status === 'COMPLETED' ? 'booking_completed'
      : b.status === 'NO_SHOW' ? 'booking_no_show'
      : 'booking_created'
    ) as 'booking_created' | 'booking_cancelled' | 'booking_completed' | 'booking_no_show',
    guestName: b.guestName,
    serviceName: b.service?.name ?? null,
    resourceName: b.resource.name,
    createdAt: b.createdAt.toISOString(),
  }))

  const stats = [
    { label: t('niche', nicheConfig.resourceLabelPlural), value: tenant.resources.length, icon: Briefcase, iconCls: 'text-blue-600 dark:text-blue-400' },
    { label: t('dashboard', 'servicesCount'), value: tenant.services.length, icon: Scissors, iconCls: 'text-purple-600 dark:text-purple-400' },
    { label: t('dashboard', 'bookingsCount'), value: tenant._count.bookings, icon: CalendarCheck, iconCls: 'text-green-600 dark:text-green-400' },
    { label: t('dashboard', 'usersCount'), value: tenant._count.users, icon: Users, iconCls: 'text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-700 dark:via-indigo-600 dark:to-violet-700 p-6 text-white animate-gradient">
        {/* Decorative elements */}
        <div aria-hidden className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
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

      {/* Stat cards with CountUp */}
      <DashboardClient stats={stats} activities={activities}>
        {/* Upcoming bookings - rendered as server component child */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {t('dashboard', 'upcoming')}
            </CardTitle>
            <CardDescription>{t('dashboard', 'upcomingHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            {tenant.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('dashboard', 'noUpcoming')}
              </p>
            ) : (
              <div className="space-y-3">
                {tenant.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 hover-lift"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {b.guestName ?? '—'}
                      </p>
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
      </DashboardClient>

    </div>
  )
}
