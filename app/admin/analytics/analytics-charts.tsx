'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ChartDataItem = {
  name: string
  count: number
  mrr: number
}

const PLAN_COLORS: Record<string, string> = {
  FREE: '#94a3b8',
  PRO: '#4299e1',
  ENTERPRISE: '#8b5cf6',
}

function PlanBar({ fill }: { fill: string }) {
  return (
    <div
      className="w-3 h-3 rounded-sm inline-block"
      style={{ background: fill }}
    />
  )
}

function CustomTooltipCount({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-card shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        Компаний:{' '}
        <span className="font-medium text-foreground">{payload[0].value}</span>
      </p>
    </div>
  )
}

function CustomTooltipMRR({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-card shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        MRR:{' '}
        <span className="font-medium text-foreground">
          ${payload[0].value}
        </span>
      </p>
    </div>
  )
}

export function AnalyticsCharts({ data }: { data: ChartDataItem[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Plan count chart */}
      <Card className="neu-raised bg-[var(--neu-bg)]">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Распределение по тарифам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barCategoryGap="40%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--muted)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip content={<CustomTooltipCount />} cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                fill="#4299e1"
                label={false}
                // Per-bar color based on plan name
                isAnimationActive={true}
              >
                {data.map((entry) => (
                  <rect
                    key={entry.name}
                    fill={PLAN_COLORS[entry.name] ?? '#94a3b8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 justify-center text-xs text-muted-foreground">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <PlanBar fill={PLAN_COLORS[entry.name] ?? '#94a3b8'} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MRR per plan chart */}
      <Card className="neu-raised bg-[var(--neu-bg)]">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Доход по тарифам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barCategoryGap="40%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--muted)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
                width={48}
              />
              <Tooltip content={<CustomTooltipMRR />} cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }} />
              <Bar
                dataKey="mrr"
                radius={[4, 4, 0, 0]}
                fill="#8b5cf6"
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 justify-center text-xs text-muted-foreground">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <PlanBar fill={PLAN_COLORS[entry.name] ?? '#94a3b8'} />
                <span>
                  {entry.name}: ${entry.mrr}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
