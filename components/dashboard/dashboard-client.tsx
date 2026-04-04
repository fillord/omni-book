'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Briefcase, Scissors, CalendarCheck, Users, TrendingUp } from 'lucide-react'
import { CountUp } from '@/components/dashboard/count-up'
import { ActivityTimeline, type ActivityItem } from '@/components/dashboard/activity-timeline'
import { useI18n } from '@/lib/i18n/context'
import { SupportButtons } from '@/components/dashboard/support-buttons'

const STAT_ICONS: Record<'resources' | 'services' | 'bookings' | 'users', React.ElementType> = {
  resources: Briefcase,
  services: Scissors,
  bookings: CalendarCheck,
  users: Users,
}

interface StatItem {
  label: string
  value: number
  iconKey: 'resources' | 'services' | 'bookings' | 'users'
  iconCls: string
}

interface Props {
  stats: StatItem[]
  activities: ActivityItem[]
  children: React.ReactNode
}

export function DashboardClient({ stats, activities, children }: Props) {
  const { locale } = useI18n()

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, iconKey, iconCls }, idx) => {
          const Icon = STAT_ICONS[iconKey]
          return (
            <Card key={label} className={`hover-lift animate-slide-up stagger-${idx + 1}`}>
              <CardHeader className="pb-1 pt-4 px-4 flex-row items-center justify-between space-y-0">
                <CardDescription className="text-xs">{label}</CardDescription>
                <Icon className={`h-4 w-4 ${iconCls}`} />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold">
                  <CountUp end={value} />
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Timeline */}
        <Card className="animate-slide-up stagger-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {locale === 'en' ? 'Recent Activity' : 'Недавняя активность'}
            </CardTitle>
            <CardDescription>
              {locale === 'en' ? 'Last actions in your business' : 'Последние действия в вашем бизнесе'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={activities} />
          </CardContent>
        </Card>

        {/* Upcoming bookings (server-rendered children) */}
        <div className="animate-slide-up stagger-5">
          {children}
        </div>
      </div>

      {/* Support contact — bottom right */}
      <div className="flex justify-end">
        <SupportButtons />
      </div>
    </>
  )
}
