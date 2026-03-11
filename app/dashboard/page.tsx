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
} from 'lucide-react'

// ---- helpers ---------------------------------------------------------------

const NICHE_LABELS: Record<string, string> = {
  medicine: 'Медицина',
  beauty:   'Красота',
  horeca:   'HoReCa',
  sports:   'Спорт и досуг',
}

function formatUpcomingTime(utcStr: Date | string): string {
  const d = new Date(utcStr)
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d)
  const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(d)
  return `${date}, ${time}`
}

// ---- data ------------------------------------------------------------------

async function getDashboardData(tenantId: string) {
  const now = new Date()
  return basePrisma.tenant.findUnique({
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
  })
}

// ---- page ------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) redirect('/login')

  const tenant = await getDashboardData(session.user.tenantId)
  if (!tenant) redirect('/login')

  const nicheConfig = getNicheConfig(tenant.niche)

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{tenant.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {NICHE_LABELS[tenant.niche ?? ''] ?? tenant.niche} · Тариф:{' '}
            <span className="font-medium capitalize">{tenant.plan}</span>
          </p>
        </div>
        <Badge variant={tenant.isActive ? 'default' : 'secondary'} className="shrink-0">
          {tenant.isActive ? 'Активен' : 'Неактивен'}
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={nicheConfig.resourceLabelPlural}
          value={tenant.resources.length}
          icon={Briefcase}
          iconCls="text-blue-600"
        />
        <StatCard
          label="Услуги"
          value={tenant.services.length}
          icon={Scissors}
          iconCls="text-purple-600"
        />
        <StatCard
          label="Бронирований"
          value={tenant._count.bookings}
          icon={CalendarCheck}
          iconCls="text-green-600"
        />
        <StatCard
          label="Пользователей"
          value={tenant._count.users}
          icon={Users}
          iconCls="text-orange-600"
        />
      </div>

      {/* Upcoming bookings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Предстоящие записи
          </CardTitle>
          <CardDescription>Ближайшие 5 активных бронирований</CardDescription>
        </CardHeader>
        <CardContent>
          {tenant.bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Нет предстоящих записей
            </p>
          ) : (
            <div className="space-y-3">
              {tenant.bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
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

    </div>
  )
}

// ---- sub-components --------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  iconCls,
}: {
  label: string
  value: number
  icon: React.ElementType
  iconCls: string
}) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4 flex-row items-center justify-between space-y-0">
        <CardDescription className="text-xs">{label}</CardDescription>
        <Icon className={`h-4 w-4 ${iconCls}`} />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
