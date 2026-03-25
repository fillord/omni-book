'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { basePrisma } from '@/lib/db'

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

  // 3. Upsert each client with aggregated metrics
  let synced = 0
  for (const [phone, clientBookings] of byPhone) {
    const totalVisits = clientBookings.length
    const totalRevenue = clientBookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0)
    const lastVisitAt = clientBookings[0]?.startsAt ?? null  // already ordered desc
    const hasTelegram = clientBookings.some(b => b.telegramChatId != null)
    const name = clientBookings[0]?.guestName ?? phone
    const email = clientBookings.find(b => b.guestEmail != null)?.guestEmail ?? null

    await basePrisma.client.upsert({
      where: { tenantId_phone: { tenantId, phone } },
      create: { tenantId, phone, name, email, totalVisits, totalRevenue, lastVisitAt, hasTelegram },
      update: { name, email, totalVisits, totalRevenue, lastVisitAt, hasTelegram },
    })
    synced++
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
