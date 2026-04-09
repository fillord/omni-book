'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { basePrisma } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram'

export async function syncClients() {
  const session = await requireAuth()
  requireRole(session, ['OWNER'])
  const tenantId = session?.user?.tenantId
  if (!tenantId) throw new Error('Tenant ID missing from session')

  // 1. Fetch all COMPLETED bookings for this tenant with service price
  const bookings = await basePrisma.booking.findMany({
    where: { tenantId, status: 'COMPLETED' },
    include: { service: { select: { price: true } } },
    orderBy: { startsAt: 'desc' },
  })

  // 2. Group bookings by phone number
  const byPhone = new Map<string, typeof bookings>()
  for (const b of bookings) {
    if (!b.guestPhone) continue
    const existing = byPhone.get(b.guestPhone) ?? []
    existing.push(b)
    byPhone.set(b.guestPhone, existing)
  }

  // 3. Prepare client data for batched upsert
  const clientsToUpsert = Array.from(byPhone.entries()).map(([phone, clientBookings]) => {
    const totalVisits = clientBookings.length
    const totalRevenue = clientBookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0)
    const lastVisitAt = clientBookings[0]?.startsAt ?? null  // already ordered desc
    const hasTelegram = clientBookings.some(b => b.telegramChatId != null)
    const name = clientBookings[0]?.guestName ?? phone
    const email = clientBookings.find(b => b.guestEmail != null)?.guestEmail ?? null
    return { phone, name, email, totalVisits, totalRevenue, lastVisitAt, hasTelegram }
  })

  // 4. Batch upserts in chunks of 100 to eliminate N+1 pattern (DB-04)
  const CHUNK_SIZE = 100
  let synced = 0
  for (let i = 0; i < clientsToUpsert.length; i += CHUNK_SIZE) {
    const chunk = clientsToUpsert.slice(i, i + CHUNK_SIZE)
    await basePrisma.$transaction(
      chunk.map(c => basePrisma.client.upsert({
        where: { tenantId_phone: { tenantId, phone: c.phone } },
        create: { tenantId, phone: c.phone, name: c.name, email: c.email, totalVisits: c.totalVisits, totalRevenue: c.totalRevenue, lastVisitAt: c.lastVisitAt, hasTelegram: c.hasTelegram },
        update: { name: c.name, email: c.email, totalVisits: c.totalVisits, totalRevenue: c.totalRevenue, lastVisitAt: c.lastVisitAt, hasTelegram: c.hasTelegram },
      }))
    )
    synced += chunk.length
  }

  revalidatePath('/dashboard/clients')
  return { synced }
}

export async function getClients(tenantId: string) {
  return basePrisma.client.findMany({
    where: { tenantId },
    orderBy: { totalVisits: 'desc' },
  })
}

export async function sendTelegramToClient(clientId: string, message: string) {
  if (!message.trim()) return { success: false, error: 'empty_message' }

  const session = await requireAuth()
  requireRole(session, ['OWNER'])
  const tenantId = session?.user?.tenantId
  if (!tenantId) throw new Error('Tenant ID missing')

  // Verify client belongs to this tenant
  const client = await basePrisma.client.findUnique({ where: { id: clientId } })
  if (!client || client.tenantId !== tenantId) throw new Error('Client not found')
  if (!client.hasTelegram) return { success: false, error: 'no_telegram' }

  // Find the most recent booking with a telegramChatId for this client's phone
  // NOTE: Client model has no telegramChatId — hasTelegram is boolean flag only.
  // Actual chat ID must be fetched from a booking (Phase 4 decision).
  const booking = await basePrisma.booking.findFirst({
    where: { tenantId, guestPhone: client.phone, telegramChatId: { not: null } },
    orderBy: { startsAt: 'desc' },
    select: { telegramChatId: true },
  })
  if (!booking?.telegramChatId) return { success: false, error: 'no_chat_id' }

  await sendTelegramMessage(booking.telegramChatId, message)
  return { success: true }
}
