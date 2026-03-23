import { basePrisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building2, CalendarCheck, Activity, Users } from 'lucide-react'

export default async function AdminIndexPage() {
  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const [
    totalTenants,
    totalBookings,
    recentBookingsCount,
    topTenants,
    recentTenants,
  ] = await Promise.all([
    basePrisma.tenant.count(),
    basePrisma.booking.count(),
    basePrisma.booking.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    }),
    basePrisma.tenant.findMany({
      take: 5,
      orderBy: {
        bookings: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    }),
    basePrisma.tenant.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ])

  const formatDate = (date: Date | string) =>
    new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(
      typeof date === 'string' ? new Date(date) : date,
    )

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Обзор платформы
        </h1>
        <p className="text-sm text-muted-foreground">
          Высокоуровневая статистика по всем компаниям и бронированиям в системе.
        </p>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего компаний
            </CardTitle>
            <div className="h-9 w-9 rounded-full neu-raised bg-[var(--neu-bg)] text-neu-accent flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">
              {totalTenants.toLocaleString('ru-RU')}
            </p>
          </CardContent>
        </Card>

        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего бронирований
            </CardTitle>
            <div className="h-9 w-9 rounded-full neu-raised bg-[var(--neu-bg)] text-neu-accent flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">
              {totalBookings.toLocaleString('ru-RU')}
            </p>
          </CardContent>
        </Card>

        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Новых бронирований за 30 дней
            </CardTitle>
            <div className="h-9 w-9 rounded-full neu-raised bg-[var(--neu-bg)] text-neu-accent flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">
              {recentBookingsCount.toLocaleString('ru-RU')}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Main two-column grid */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Top tenants by bookings */}
        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-4 w-4 text-muted-foreground" />
              Топ бизнесы по бронированиям
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Компании с наибольшим количеством бронирований за всё время.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Пока нет активных компаний с бронированиями.
              </p>
            ) : (
              <div className="space-y-1 text-sm">
                {topTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-card-foreground truncate">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tenant.slug}.omnibook.com
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-card-foreground">
                        {tenant._count.bookings.toLocaleString('ru-RU')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        бронирований
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent tenants */}
        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Новые регистрации
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Последние компании, зарегистрированные на платформе.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Новых регистраций пока нет.
              </p>
            ) : (
              <div className="space-y-1 text-sm">
                {recentTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-card-foreground truncate">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tenant.slug}.omnibook.com
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        Зарегистрирован
                      </p>
                      <p className="text-sm font-medium text-card-foreground">
                        {formatDate(tenant.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}