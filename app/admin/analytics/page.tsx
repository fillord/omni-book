import { basePrisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, Banknote } from 'lucide-react'

const formatKZT = (amount: number) =>
  new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(amount)
// AnalyticsCharts renders two Recharts BarChart + ResponsiveContainer — see ./analytics-charts.tsx
import { AnalyticsCharts } from './analytics-charts'

export default async function AdminAnalyticsPage() {
  const [planCounts, totalTenants, planPrices] = await Promise.all([
    basePrisma.tenant.groupBy({
      by: ['plan'],
      where: { planStatus: 'ACTIVE' },
      _count: { _all: true },
    }),
    basePrisma.tenant.count({ where: { planStatus: 'ACTIVE' } }),
    basePrisma.subscriptionPlan.findMany({
      select: { plan: true, priceMonthly: true },
    }),
  ])

  const PLAN_MRR: Record<string, number> = Object.fromEntries(
    planPrices.map(p => [p.plan, p.priceMonthly < 0 ? 0 : p.priceMonthly])
  )

  const mrr = planCounts.reduce(
    (sum, row) => sum + (PLAN_MRR[row.plan] ?? 0) * row._count._all,
    0,
  )

  const chartData = planCounts.map((row) => ({
    name: row.plan,
    count: row._count._all,
    mrr: (PLAN_MRR[row.plan] ?? 0) * row._count._all,
  }))

  const avgMRR = totalTenants > 0 ? Math.round(mrr / totalTenants) : 0

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Аналитика платформы
        </h1>
        <p className="text-sm text-muted-foreground">
          Финансовые показатели и распределение компаний по тарифным планам.
        </p>
      </header>

      {/* KPI stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* MRR */}
        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
            <div className="h-9 w-9 rounded-full neu-raised bg-[var(--neu-bg)] text-neu-accent flex items-center justify-center">
              <Banknote className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">
              {formatKZT(mrr)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ежемесячный доход
            </p>
          </CardContent>
        </Card>

        {/* Active tenants */}
        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активных компаний
            </CardTitle>
            <div className="h-9 w-9 rounded-full neu-raised bg-[var(--neu-bg)] text-neu-accent flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">
              {totalTenants.toLocaleString('ru-RU')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              С активным статусом плана
            </p>
          </CardContent>
        </Card>

        {/* Avg MRR per tenant */}
        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Средний MRR/компания
            </CardTitle>
            <div className="h-9 w-9 rounded-full neu-raised bg-[var(--neu-bg)] text-neu-accent flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">
              {formatKZT(avgMRR)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              В среднем на компанию
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Charts */}
      <AnalyticsCharts data={chartData} />
    </div>
  )
}
