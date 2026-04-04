/**
 * One-shot: re-sync all Client rows across all tenants.
 * Run with: npx tsx scripts/resync-clients.ts
 *
 * What it does:
 *   - For each tenant, finds all COMPLETED bookings
 *   - Groups by guestPhone
 *   - Upserts Client with correct totalRevenue (stored in minor units / tiyn)
 *   - totalVisits, lastVisitAt, hasTelegram are also refreshed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } })
  console.log(`Found ${tenants.length} tenants`)

  let totalSynced = 0

  for (const tenant of tenants) {
    const bookings = await prisma.booking.findMany({
      where: { tenantId: tenant.id, status: 'COMPLETED' },
      include: { service: { select: { price: true } } },
      orderBy: { startsAt: 'desc' },
    })

    const byPhone = new Map<string, typeof bookings>()
    for (const b of bookings) {
      if (!b.guestPhone) continue
      const existing = byPhone.get(b.guestPhone) ?? []
      existing.push(b)
      byPhone.set(b.guestPhone, existing)
    }

    let synced = 0
    for (const [phone, clientBookings] of byPhone) {
      const totalVisits = clientBookings.length
      const totalRevenue = clientBookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0)
      const lastVisitAt = clientBookings[0]?.startsAt ?? null
      const hasTelegram = clientBookings.some(b => b.telegramChatId != null)
      const name = clientBookings[0]?.guestName ?? phone
      const email = clientBookings.find(b => b.guestEmail != null)?.guestEmail ?? null

      await prisma.client.upsert({
        where: { tenantId_phone: { tenantId: tenant.id, phone } },
        create: { tenantId: tenant.id, phone, name, email, totalVisits, totalRevenue, lastVisitAt, hasTelegram },
        update: { name, email, totalVisits, totalRevenue, lastVisitAt, hasTelegram },
      })
      synced++
    }

    console.log(`  ${tenant.name}: synced ${synced} clients`)
    totalSynced += synced
  }

  console.log(`\nDone — ${totalSynced} client rows updated across ${tenants.length} tenants`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
