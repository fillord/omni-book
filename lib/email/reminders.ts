import { basePrisma } from '@/lib/db'
import { sendBookingReminder } from './resend'

/**
 * Обработка email-напоминаний в нескольких временных окнах.
 *
 * - 24–25 часов до визита  → reminder24hSentAt
 * - 2–2.5 часа до визита   → reminder2hSentAt
 * - 1–1.5 часа до визита   → reminder1hSentAt
 *
 * Эндпоинт дергается каждые 15 минут, поэтому окна перекрывают
 * возможные сдвиги запуска, но одно и то же бронирование помечается
 * соответствующим полем и повторно не попадает в выборку.
 */
export async function processReminders(): Promise<{ total: number; sent: number }> {
  const now = new Date()
  const minutes = (h: number) => h * 60

  const window24h = {
    from: new Date(now.getTime() + minutes(24) * 60 * 1000),
    to:   new Date(now.getTime() + minutes(25) * 60 * 1000),
  }

  const window2h = {
    from: new Date(now.getTime() + minutes(2) * 60 * 1000),
    to:   new Date(now.getTime() + minutes(2.5) * 60 * 1000),
  }

  const window1h = {
    from: new Date(now.getTime() + minutes(1) * 60 * 1000),
    to:   new Date(now.getTime() + minutes(1.5) * 60 * 1000),
  }

  type ReminderField = 'reminder24hSentAt' | 'reminder2hSentAt' | 'reminder1hSentAt'

  async function fetchWindow(
    range: { from: Date; to: Date },
    field: ReminderField,
  ) {
    return basePrisma.booking.findMany({
      where: {
        startsAt: { gte: range.from, lte: range.to },
        status:   { in: ['CONFIRMED', 'PENDING'] },
        guestEmail: { not: null },
        [field]: null,
      },
      include: {
        tenant:   true,
        resource: true,
        service:  true,
      },
    })
  }

  const [bookings24h, bookings2h, bookings1h] = await Promise.all([
    fetchWindow(window24h, 'reminder24hSentAt'),
    fetchWindow(window2h,  'reminder2hSentAt'),
    fetchWindow(window1h,  'reminder1hSentAt'),
  ])

  console.log(`📧 Processing reminders: 24h=${bookings24h.length}, 2h=${bookings2h.length}, 1h=${bookings1h.length}`)

  async function processWindow(
    bookings: Awaited<ReturnType<typeof fetchWindow>>,
    field: ReminderField,
  ): Promise<{ total: number; sent: number }> {
    let sent = 0

    for (const booking of bookings) {
      try {
        if (!booking.guestEmail) continue

        await sendBookingReminder({
          to:           booking.guestEmail,
          guestName:    booking.guestName ?? 'Клиент',
          tenantName:   booking.tenant.name,
          serviceName:  booking.service?.name ?? 'Услуга',
          resourceName: booking.resource.name,
          startsAt:     booking.startsAt,
          timezone:     booking.tenant.timezone ?? 'Asia/Almaty',
          tenantSlug:   booking.tenant.slug,
          tenantPhone:  booking.tenant.phone,
        })

        const updateData: Record<string, Date> = { [field]: new Date() }

        await basePrisma.booking.update({
          where: { id: booking.id },
          data:  updateData,
        })

        sent++
      } catch (error) {
        console.error(`Failed to send ${field} reminder for booking ${booking.id}:`, error)
      }
    }

    return { total: bookings.length, sent }
  }

  const stats24h = await processWindow(bookings24h, 'reminder24hSentAt')
  const stats2h  = await processWindow(bookings2h,  'reminder2hSentAt')
  const stats1h  = await processWindow(bookings1h,  'reminder1hSentAt')

  return {
    total: stats24h.total + stats2h.total + stats1h.total,
    sent:  stats24h.sent  + stats2h.sent  + stats1h.sent,
  }
}
