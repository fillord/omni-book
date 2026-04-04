import { basePrisma } from '@/lib/db'
import { sendBookingReminder } from './resend'
import { sendTelegramMessage } from '@/lib/telegram'

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
  const ms = (min: number) => min * 60 * 1000

  // Cron runs every 30 min → windows are 35 min wide (target −5 min … target +30 min)
  // so no booking can slip through between two consecutive cron ticks.
  const window24h = {
    from: new Date(now.getTime() + ms(24 * 60 - 5)),
    to:   new Date(now.getTime() + ms(24 * 60 + 30)),
  }

  const window2h = {
    from: new Date(now.getTime() + ms(2 * 60 - 5)),
    to:   new Date(now.getTime() + ms(2 * 60 + 30)),
  }

  const window1h = {
    from: new Date(now.getTime() + ms(60 - 5)),
    to:   new Date(now.getTime() + ms(60 + 30)),
  }

  const utcStr = now.toISOString()
  console.log(`[Reminders] Server time — UTC: ${utcStr}`)

  type ReminderField = 'reminder24hSentAt' | 'reminder2hSentAt' | 'reminder1hSentAt'

  async function fetchWindow(
    range: { from: Date; to: Date },
    field: ReminderField,
  ) {
    return basePrisma.booking.findMany({
      where: {
        startsAt: { gte: range.from, lte: range.to },
        status:   { in: ['CONFIRMED', 'PENDING'] },
        // Fetch if at least one notification channel is available
        OR: [
          { guestEmail:    { not: null } },
          { telegramChatId: { not: null } },
        ],
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

  console.log(`[Reminders] Bookings found for 3m window (reminder24h): ${bookings24h.length}`)
  console.log(`[Reminders] Bookings found for 2m window (reminder2h):  ${bookings2h.length}`)
  console.log(`[Reminders] Bookings found for 1m window (reminder1h):  ${bookings1h.length}`)
  console.log(`📧 Processing reminders: 24h=${bookings24h.length}, 2h=${bookings2h.length}, 1h=${bookings1h.length}`)

  const TG_MESSAGES: Record<ReminderField, (dateStr: string, tenantName: string) => string> = {
    reminder24hSentAt: (d, t) => `🔔 Напоминаем! Завтра в ${d} вы записаны в <b>${t}</b>. Ждём вас!`,
    reminder2hSentAt:  (d, t) => `⏰ Через 2 часа — ваша запись в <b>${t}</b> в ${d}. До встречи!`,
    reminder1hSentAt:  (d, t) => `⏰ Через час — ваша запись в <b>${t}</b> в ${d}. Ждём вас!`,
  }

  async function processWindow(
    bookings: Awaited<ReturnType<typeof fetchWindow>>,
    field: ReminderField,
  ): Promise<{ total: number; sent: number }> {
    let sent = 0

    for (const booking of bookings) {
      try {
        const tz = booking.tenant.timezone ?? 'Asia/Almaty'

        // Email channel
        if (booking.guestEmail) {
          await sendBookingReminder({
            to:           booking.guestEmail,
            guestName:    booking.guestName ?? 'Клиент',
            tenantName:   booking.tenant.name,
            serviceName:  booking.service?.name ?? 'Услуга',
            resourceName: booking.resource.name,
            startsAt:     booking.startsAt,
            timezone:     tz,
            tenantSlug:   booking.tenant.slug,
            tenantPhone:  booking.tenant.phone,
          })
        }

        // Telegram channel
        if (booking.telegramChatId) {
          const timeStr = booking.startsAt.toLocaleString('ru-RU', {
            timeZone: tz,
            hour:     '2-digit',
            minute:   '2-digit',
          })
          const msg = TG_MESSAGES[field](timeStr, booking.tenant.name)
          await sendTelegramMessage(booking.telegramChatId, msg)
            .catch((err) => {
              const detail = err instanceof Error
                ? `${err.message}\n${err.stack ?? ''}`
                : JSON.stringify(err)
              console.error(`[Telegram] Reminder ${field} failed for booking ${booking.id} (chatId=${booking.telegramChatId}):\n${detail}`)
            })
        }

        await basePrisma.booking.update({
          where: { id: booking.id },
          data:  { [field]: new Date() },
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
