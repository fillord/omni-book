'use server'

import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { basePrisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { normalizePhone } from '@/lib/utils/phone'
import { sendBookingConfirmation } from '@/lib/email/resend'
import { sendTelegramMessage } from '@/lib/telegram'
import { manualBookingSchema, type ManualBookingInput } from '@/lib/validations/booking'

// TODO(12-02): cancelExpiredBooking removed — Kaspi deposit flow removed in Phase 12

export async function createManualBooking(data: ManualBookingInput) {
  try {
    const session = await requireAuth()
    requireRole(session, ['OWNER', 'STAFF', 'SUPERADMIN'])

    const tenantId = session.user.tenantId!
    const parsed = manualBookingSchema.parse(data)
    const normalizedPhone = normalizePhone(parsed.clientPhone)

    const result = await basePrisma.$transaction(
      async (tx) => {
        // Lock resource row to prevent concurrent double-bookings
        await tx.$queryRaw`SELECT id FROM "Resource" WHERE id = ${parsed.resourceId} FOR UPDATE`

        // Check for collision
        const conflict = await tx.booking.findFirst({
          where: {
            resourceId: parsed.resourceId,
            startsAt: { lt: new Date(parsed.endsAt) },
            endsAt: { gt: new Date(parsed.startsAt) },
            status: { in: ['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'PENDING'] },
          },
        })

        if (conflict) {
          throw new Error('Time slot conflict')
        }

        return tx.booking.create({
          data: {
            tenantId,
            resourceId: parsed.resourceId,
            serviceId: parsed.serviceId,
            guestName: parsed.clientName,
            guestPhone: normalizedPhone,
            guestEmail: parsed.clientEmail || null,
            startsAt: new Date(parsed.startsAt),
            endsAt: new Date(parsed.endsAt),
            status: 'CONFIRMED',
            manageToken: null,
          },
        })
      },
      { isolationLevel: 'Serializable' }
    )

    // Fetch tenant + service + resource names for notifications
    const [tenant, service, resource] = await Promise.all([
      basePrisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, telegramChatId: true, timezone: true },
      }),
      basePrisma.service.findFirst({
        where: { id: parsed.serviceId, tenantId },
        select: { name: true },
      }),
      basePrisma.resource.findFirst({
        where: { id: parsed.resourceId, tenantId },
        select: { name: true },
      }),
    ])

    // Fire-and-forget confirmation email (only if client email provided)
    if (result.guestEmail && result.guestName && tenant) {
      sendBookingConfirmation({
        guestName:    result.guestName,
        guestEmail:   result.guestEmail,
        tenantName:   tenant.name,
        serviceName:  service?.name ?? '',
        resourceName: resource?.name ?? '',
        startsAt:     result.startsAt,
        timezone:     tenant.timezone ?? 'Asia/Almaty',
        manageToken:  result.manageToken,
      }).catch(console.error)
    }

    // Fire-and-forget Telegram notification to business owner
    const chatId = tenant?.telegramChatId ?? null
    if (chatId) {
      const startsAtDate = new Date(result.startsAt)
      const dateStr = format(startsAtDate, 'd MMMM yyyy', { locale: ru })
      const timeStr = format(startsAtDate, 'HH:mm')
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omni-book.site'
      const msg = [
        '🔔 <b>Новая запись (от администратора)!</b>',
        `👤 Клиент: ${result.guestName}`,
        `📅 Дата: ${dateStr}`,
        `⏰ Время: ${timeStr}`,
        `🛠 Услуга: ${service?.name ?? 'Не указана'}`,
        ...(result.manageToken ? [`🔗 Управление: ${appUrl}/manage/${result.manageToken}`] : []),
      ].join('\n')
      sendTelegramMessage(chatId, msg).catch(console.error)
    }

    revalidatePath('/dashboard/bookings')
    return { success: true, bookingId: result.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
