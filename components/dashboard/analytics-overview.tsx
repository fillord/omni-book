'use client'

import { useState, useTransition } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  CalendarCheck, TrendingUp, CheckCircle2, XCircle, BarChart3, Award,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CountUp } from '@/components/dashboard/count-up'
import { getAnalytics, type AnalyticsPeriod, type AnalyticsResult } from '@/lib/actions/analytics'

// ---- palette ----------------------------------------------------------------

const NICHE_COLOR: Record<string, string> = {
  blue:   '#3b82f6',
  pink:   '#ec4899',
  orange: '#f97316',
  green:  '#22c55e',
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: 'Завершено',    color: '#10b981' },
  CONFIRMED: { label: 'Подтверждено', color: '#3b82f6' },
  PENDING:   { label: 'Ожидает',      color: '#f59e0b' },
  CANCELLED: { label: 'Отменено',     color: '#ef4444' },
  NO_SHOW:   { label: 'Не пришёл',    color: '#8b5cf6' },
}

const SERVICE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

// ---- helpers ----------------------------------------------------------------

function fmtRevenue(v: number): string {
  if (v === 0) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'KZT', maximumFractionDigits: 0,
  }).format(v / 100)
}

// ---- custom tooltips --------------------------------------------------------

function BarTooltip({
  active, payload, label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl px-4 py-3 text-sm neu-raised bg-[var(--neu-bg)]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({
  active, payload,
}: {
  active?: boolean
  payload?: { name: string; value: number }[]
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const meta  = STATUS_META[entry.name] ?? { label: entry.name, color: '#888' }
  return (
    <div className="rounded-2xl px-3 py-2 text-sm neu-raised bg-[var(--neu-bg)]">
      <span className="font-medium text-foreground">{meta.label}: </span>
      <span className="text-foreground">{entry.value}</span>
    </div>
  )
}

// ---- sub-components ---------------------------------------------------------

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  sub?: string
  iconClass: string
  delay?: number
}

function KpiCard({ icon: Icon, label, value, sub, iconClass, delay = 0 }: KpiCardProps) {
  return (
    <div
      className="neu-raised rounded-2xl p-4 sm:p-5 flex items-start gap-3 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-snug">{label}</p>
        <p className="text-2xl font-bold mt-0.5 text-foreground tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ---- main component ---------------------------------------------------------

interface Props {
  initial:    AnalyticsResult
  color:      string          // niche color key: blue | pink | orange | green
  todayCount: number          // bookings today (from welcome banner data)
}

export function AnalyticsOverview({ initial, color, todayCount }: Props) {
  const [period,  setPeriod]  = useState<AnalyticsPeriod>('30d')
  const [data,    setData]    = useState<AnalyticsResult>(initial)
  const [pending, startTransition] = useTransition()

  const nicheColor = NICHE_COLOR[color] ?? NICHE_COLOR.blue

  function changePeriod(p: AnalyticsPeriod) {
    if (p === period) return
    setPeriod(p)
    startTransition(async () => {
      const result = await getAnalytics(p)
      setData(result)
    })
  }

  const { bookingsChart, servicesChart, statusDistribution, summary } = data

  // Show last 7 bars for 7d period, last 14 for 30d (14 bars is readable, 30 is cramped)
  const visibleBars = period === '7d' ? 7 : 14
  const barData     = bookingsChart.slice(-visibleBars)
  const hasBookings = barData.some((d) => d.total > 0)
  const hasPie      = statusDistribution.length > 0
  const hasServices = servicesChart.some((s) => s.bookings > 0)

  const periodLabel = period === '7d' ? 'за 7 дней' : 'за 30 дней'

  const maxServiceBookings = servicesChart[0]?.bookings || 1

  return (
    <div className="space-y-4">

      {/* ── Section header + period switcher ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Аналитика</h2>
        </div>
        <div className={`flex rounded-xl overflow-hidden text-sm neu-raised transition-opacity ${pending ? 'opacity-50 pointer-events-none' : ''}`}>
          {(['7d', '30d'] as AnalyticsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => changePeriod(p)}
              className={[
                'px-4 py-1.5 font-medium transition-all',
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {p === '7d' ? '7 дней' : '30 дней'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 transition-opacity duration-200 ${pending ? 'opacity-40' : ''}`}>
        <KpiCard
          icon={CalendarCheck}
          label="Всего записей"
          value={<CountUp end={summary.totalBookings} />}
          sub={periodLabel}
          iconClass="bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
          delay={50}
        />
        <KpiCard
          icon={TrendingUp}
          label="Выручка"
          value={fmtRevenue(summary.totalRevenue)}
          sub="подтверждённые"
          iconClass="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
          delay={100}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Завершено"
          value={<><CountUp end={summary.completionRate} />%</>}
          sub="от всех записей"
          iconClass="bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
          delay={150}
        />
        <KpiCard
          icon={XCircle}
          label="Отменено"
          value={<><CountUp end={summary.cancelRate} />%</>}
          sub="от всех записей"
          iconClass="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
          delay={200}
        />
      </div>

      {/* ── Charts row: Bar + Donut ── */}
      <div className={`grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 transition-opacity duration-200 ${pending ? 'opacity-40 pointer-events-none' : ''}`}>

        {/* Bookings by day — Bar chart */}
        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-foreground">
              Записи по дням
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {!hasBookings ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CalendarCheck className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Нет данных за период</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[280px]">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} barCategoryGap="35%" barGap={2} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(128,128,128,0.12)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        interval={period === '7d' ? 0 : 1}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={24}
                      />
                      <Tooltip
                        content={<BarTooltip />}
                        cursor={{ fill: 'rgba(128,128,128,0.06)', radius: 4 }}
                      />
                      <Bar
                        dataKey="confirmed"
                        name="Подтверждено"
                        fill="#22c55e"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="cancelled"
                        name="Отменено"
                        fill="#ef4444"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status distribution — Donut */}
        <Card className="neu-raised bg-[var(--neu-bg)]">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-foreground">
              По статусам
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {!hasPie ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Нет данных за период</p>
              </div>
            ) : (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="status"
                      strokeWidth={0}
                    >
                      {statusDistribution.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={(STATUS_META[entry.status] ?? { color: '#888' }).color}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom legend */}
                <div className="neu-inset rounded-xl px-3 py-2 space-y-1.5">
                  {statusDistribution.map((entry) => {
                    const meta  = STATUS_META[entry.status] ?? { label: entry.status, color: '#888' }
                    const pct   = summary.totalBookings > 0
                      ? Math.round((entry.count / summary.totalBookings) * 100)
                      : 0
                    return (
                      <div key={entry.status} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                          <span className="text-muted-foreground truncate">{meta.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-foreground tabular-nums">{entry.count}</span>
                          <span className="text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top 5 Services ── */}
      <Card className={`neu-raised bg-[var(--neu-bg)] transition-opacity duration-200 ${pending ? 'opacity-40' : ''}`}>
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            Топ-5 услуг
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {!hasServices ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Award className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Нет завершённых записей за период</p>
            </div>
          ) : (
            <div className="space-y-4">
              {servicesChart.slice(0, 5).map((s, i) => (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                      />
                      <span className="text-foreground truncate font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold tabular-nums text-foreground">{s.bookings}</span>
                      {s.revenue > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {fmtRevenue(s.revenue)}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full neu-inset overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width:      `${Math.round((s.bookings / maxServiceBookings) * 100)}%`,
                        background: SERVICE_COLORS[i % SERVICE_COLORS.length],
                        opacity:    0.85,
                      }}
                    />
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
