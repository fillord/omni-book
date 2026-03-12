'use server'

import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'

export type AnalyticsPeriod = '7d' | '30d' | '90d'

export interface AnalyticsResult {
  bookingsChart: {
    date:      string
    label:     string
    total:     number
    confirmed: number
    cancelled: number
    revenue:   number
  }[]
  resourceChart: {
    name:     string
    bookings: number
  }[]
  servicesChart: {
    name:     string
    bookings: number
    revenue:  number
  }[]
  summary: {
    totalBookings:  number
    totalRevenue:   number
    completionRate: number
    cancelRate:     number
  }
}

export async function getAnalytics(period: AnalyticsPeriod): Promise<AnalyticsResult> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) throw new Error('Unauthorized')
  const tenantId = session.user.tenantId

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const from = new Date()
  from.setDate(from.getDate() - days)

  // ---- 1. Бронирования (flat) -----------------------------------------------
  const bookings = await basePrisma.booking.findMany({
    where:  { tenantId, createdAt: { gte: from } },
    select: {
      createdAt: true,
      status:    true,
      service:   { select: { price: true } },
    },
  })

  // Инициализируем все дни в диапазоне
  const bookingsByDay: Record<string, {
    total:     number
    confirmed: number
    cancelled: number
    revenue:   number
  }> = {}

  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().split('T')[0]
    bookingsByDay[key] = { total: 0, confirmed: 0, cancelled: 0, revenue: 0 }
  }

  for (const b of bookings) {
    const key = b.createdAt.toISOString().split('T')[0]
    if (!bookingsByDay[key]) continue
    bookingsByDay[key].total++
    if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
      bookingsByDay[key].confirmed++
      bookingsByDay[key].revenue += b.service?.price ?? 0
    }
    if (b.status === 'CANCELLED') bookingsByDay[key].cancelled++
  }

  const bookingsChart = Object.entries(bookingsByDay).map(([date, data]) => ({
    date,
    label: new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', {
      day:   'numeric',
      month: 'short',
    }),
    ...data,
  }))

  // ---- 2. Загрузка по ресурсам -----------------------------------------------
  const resourceBookings = await basePrisma.booking.groupBy({
    by:    ['resourceId'],
    where: {
      tenantId,
      createdAt: { gte: from },
      status:    { in: ['CONFIRMED', 'COMPLETED'] },
    },
    _count: true,
  })

  const resources = await basePrisma.resource.findMany({
    where:  { tenantId, isActive: true },
    select: { id: true, name: true },
  })

  const resourceChart = resources
    .map((r) => ({
      name:     r.name,
      bookings: resourceBookings.find((rb) => rb.resourceId === r.id)?._count ?? 0,
    }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10)

  // ---- 3. Популярные услуги --------------------------------------------------
  const serviceBookings = await basePrisma.booking.groupBy({
    by:    ['serviceId'],
    where: {
      tenantId,
      createdAt: { gte: from },
      status:    { in: ['CONFIRMED', 'COMPLETED'] },
    },
    _count: true,
  })

  const services = await basePrisma.service.findMany({
    where:  { tenantId, isActive: true },
    select: { id: true, name: true, price: true },
  })

  const servicesChart = services
    .map((s) => {
      const cnt = serviceBookings.find((sb) => sb.serviceId === s.id)?._count ?? 0
      return {
        name:     s.name,
        bookings: cnt,
        revenue:  cnt * (s.price ?? 0),
      }
    })
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 8)

  // ---- 4. Summary ------------------------------------------------------------
  const totalBookings = bookings.length
  const totalRevenue  = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.service?.price ?? 0), 0)
  const completionRate = totalBookings > 0
    ? Math.round((bookings.filter((b) => b.status === 'COMPLETED').length / totalBookings) * 100)
    : 0
  const cancelRate = totalBookings > 0
    ? Math.round((bookings.filter((b) => b.status === 'CANCELLED').length / totalBookings) * 100)
    : 0

  return {
    bookingsChart,
    resourceChart,
    servicesChart,
    summary: { totalBookings, totalRevenue, completionRate, cancelRate },
  }
}
