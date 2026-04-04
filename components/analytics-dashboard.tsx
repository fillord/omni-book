"use client"

'use client'

import { useState, useTransition } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, Calendar, DollarSign, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAnalytics, type AnalyticsPeriod, type AnalyticsResult } from '@/lib/actions/analytics'
import { useI18n } from '@/lib/i18n/context'

// ---- types -----------------------------------------------------------------

type Props = {
  initial: AnalyticsResult
  color:   string       // niche color: blue | pink | orange | green
}

// ---- niche palette (static strings) ----------------------------------------

const NICHE_COLOR: Record<string, string> = {
  blue:   '#2563eb',
  pink:   '#db2777',
  orange: '#ea580c',
  green:  '#16a34a',
}

const PIE_COLORS = ['#2563eb', '#db2777', '#ea580c', '#16a34a', '#7c3aed', '#0891b2', '#b45309', '#be123c']

// ---- helpers ----------------------------------------------------------------

function fmtRevenue(v: number) {
  if (v === 0) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style:                'currency',
    currency:             'KZT',
    maximumFractionDigits: 0,
  }).format(v / 100)
}

// Custom tooltip for bar/area charts
function BookingTooltip({ active, payload, label }: {
  active?:  boolean
  payload?: { name: string; value: number; color: string }[]
  label?:   string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function RevenueTooltip({ active, payload, label }: {
  active?:  boolean
  payload?: { name: string; value: number; color: string }[]
  label?:   string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{fmtRevenue(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Calendar className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

// ---- Summary card ----------------------------------------------------------

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
}: {
  icon:   React.ElementType
  label:  string
  value:  string
  sub?:   string
  iconBg: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{label}</p>
            <p className="text-2xl font-bold leading-tight mt-0.5">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Main component --------------------------------------------------------

export function AnalyticsDashboard({ initial, color }: Props) {
  const { t }     = useI18n()
  const [period,  setPeriod]  = useState<AnalyticsPeriod>('30d')
  const [data,    setData]    = useState<AnalyticsResult>(initial)
  const [pending, startTransition] = useTransition()

  const nicheColor = NICHE_COLOR[color] ?? NICHE_COLOR.blue

  const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
    { value: '7d',  label: t('analytics', 'period7d')  },
    { value: '30d', label: t('analytics', 'period30d') },
    { value: '90d', label: t('analytics', 'period90d') },
  ]

  function changePeriod(p: AnalyticsPeriod) {
    setPeriod(p)
    startTransition(async () => {
      const result = await getAnalytics(p)
      setData(result)
    })
  }

  const { bookingsChart, resourceChart, servicesChart, summary } = data
  const hasBookings  = bookingsChart.some((d) => d.total > 0)
  const hasResources = resourceChart.some((d) => d.bookings > 0)
  const hasServices  = servicesChart.some((d) => d.bookings > 0)

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header + period switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('dashboard', 'analytics')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('analytics', 'subtitle')}</p>
        </div>
        <div className={`flex rounded-xl border border-border overflow-hidden text-sm transition-opacity ${pending ? 'opacity-60 pointer-events-none' : ''}`}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => changePeriod(p.value)}
              className={[
                'flex-1 sm:flex-none px-4 py-2 font-medium transition-colors',
                period === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards — 2×2 on mobile, 4 in a row on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={Calendar}
          label={t('analytics', 'totalBookings')}
          value={String(summary.totalBookings)}
          sub={period === '7d' ? t('analytics', 'forPeriod7') : period === '30d' ? t('analytics', 'forPeriod30') : t('analytics', 'forPeriod90')}
          iconBg="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          icon={DollarSign}
          label={t('analytics', 'revenue')}
          value={fmtRevenue(summary.totalRevenue)}
          sub={t('analytics', 'confirmedSub')}
          iconBg="bg-green-50 text-green-600"
        />
        <SummaryCard
          icon={TrendingUp}
          label={t('analytics', 'completionRate')}
          value={`${summary.completionRate}%`}
          sub={t('analytics', 'ofAllBookings')}
          iconBg="bg-purple-50 text-purple-600"
        />
        <SummaryCard
          icon={XCircle}
          label={t('analytics', 'cancelRate')}
          value={`${summary.cancelRate}%`}
          sub={t('analytics', 'ofAllBookings')}
          iconBg="bg-red-50 text-red-600"
        />
      </div>

      {/* Charts — dimmed while period is loading */}
      <div className={`space-y-6 transition-opacity duration-200 ${pending ? 'opacity-40 pointer-events-none' : ''}`}>

      {/* Bookings by day */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t('analytics', 'bookingsByDay')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasBookings ? <EmptyState label={t('analytics', 'noDataPeriod')} /> : (
            <div className="overflow-x-auto -mx-2">
              <div className="min-w-[340px] px-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={bookingsChart} barCategoryGap="30%" barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={period === '7d' ? 0 : period === '30d' ? 4 : 8}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={28}
                    />
                    <Tooltip content={<BookingTooltip />} cursor={{ fill: 'var(--color-muted)' }} />
                    <Bar dataKey="confirmed" fill="#22c55e"  name={t('analytics', 'confirmed')} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="cancelled" fill="#ef4444"  name={t('analytics', 'cancelled')} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue over time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t('analytics', 'revenueByDay')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasBookings ? <EmptyState label={t('analytics', 'noDataPeriod')} /> : (
            <div className="overflow-x-auto -mx-2">
              <div className="min-w-[340px] px-2">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={bookingsChart}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={nicheColor} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={nicheColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={period === '7d' ? 0 : period === '30d' ? 4 : 8}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => {
                        if (v === 0) return '0'
                        const kzt = Math.round(v / 100)
                        return kzt >= 1000 ? `${Math.round(kzt / 1000)}к₸` : `${kzt}₸`
                      }}
                      width={48}
                    />
                    <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
                    <Area
                      type="linear"
                      dataKey="revenue"
                      stroke={nicheColor}
                      strokeWidth={2}
                      fill="url(#revenueGrad)"
                      name={t('analytics', 'revenue')}
                      dot={false}
                      activeDot={{ r: 4, fill: nicheColor }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom row: resource load + top services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Resource utilisation — horizontal bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('analytics', 'resourceLoad')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasResources ? <EmptyState label={t('analytics', 'noDataPeriod')} /> : (
              <ResponsiveContainer width="100%" height={Math.max(180, resourceChart.length * 44)}>
                <BarChart
                  data={resourceChart}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--color-muted)' }}
                    formatter={(v) => [v, t('analytics', 'bookingsLabel')]}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', fontSize: 13 }}
                  />
                  <Bar dataKey="bookings" fill={nicheColor} radius={[0, 4, 4, 0]} name={t('analytics', 'bookingsLabel')} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top services — donut + custom list */}
        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('analytics', 'popularServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasServices ? <EmptyState label={t('analytics', 'noDataPeriod')} /> : (
              <div className="flex flex-col gap-3">
                {/* Donut — fixed 250px so the list below never gets squashed */}
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={servicesChart.filter(s => s.bookings > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="bookings"
                      nameKey="name"
                    >
                      {servicesChart
                        .filter(s => s.bookings > 0)
                        .map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [v, name]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--color-border)',
                        fontSize: 13,
                        background: 'var(--neu-bg)',
                      }}
                    />
                    {/* No <Legend /> — the custom list below is the legend */}
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom legend list — color dot, name left / count + revenue right */}
                <div className="rounded-xl neu-inset bg-[var(--neu-bg)] divide-y divide-border text-sm px-1">
                  {servicesChart.slice(0, 5).map((s, i) => (
                    <div
                      key={s.name}
                      className={`flex justify-between items-center gap-3 py-2.5 px-2 ${s.bookings === 0 ? 'opacity-40' : ''}`}
                    >
                      {/* Left: dot + name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="truncate text-foreground">{s.name}</span>
                      </div>
                      {/* Right: count + optional revenue */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold tabular-nums text-card-foreground">
                          {s.bookings}
                        </span>
                        {s.revenue > 0 && (
                          <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
                            {fmtRevenue(s.revenue)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      </div>{/* end charts loading wrapper */}
    </div>
  )
}
