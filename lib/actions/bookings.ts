'use server'

import { revalidatePath } from 'next/cache'
import { basePrisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { normalizePhone } from '@/lib/utils/phone'
import { manualBookingSchema, type ManualBookingInput } from '@/lib/validations/booking'

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
            status: { not: 'CANCELLED' },
            startsAt: { lt: new Date(parsed.endsAt) },
            endsAt: { gt: new Date(parsed.startsAt) },
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

    revalidatePath('/dashboard/bookings')
    return { success: true, bookingId: result.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
