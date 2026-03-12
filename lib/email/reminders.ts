import { basePrisma } from '@/lib/db'
import { sendBookingReminder } from './resend'

/**
 * Найти все бронирования которые начинаются через 23-25 часов
 * и отправить напоминание. Окно 2 часа чтобы не пропустить при
 * запуске CRON каждый час.
 */
export async function processReminders(): Promise<{ total: number; sent: number }> {
  const now = new Date()
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000) // +23ч
  const to   = new Date(now.getTime() + 25 * 60 * 60 * 1000) // +25ч

  const bookings = await basePrisma.booking.findMany({
    where: {
      startsAt:       { gte: from, lte: to },
      status:         { in: ['CONFIRMED', 'PENDING'] },
      guestEmail:     { not: null },
      reminderSentAt: null,
    },
    include: {
      tenant:   true,
      resource: true,
      service:  true,
    },
  })

  console.log(`📧 Processing ${bookings.length} reminders`)

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

      await basePrisma.booking.update({
        where: { id: booking.id },
        data:  { reminderSentAt: new Date() },
      })

      sent++
    } catch (error) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, error)
    }
  }

  return { total: bookings.length, sent }
}
