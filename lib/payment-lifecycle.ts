import { basePrisma } from '@/lib/db'

export async function cancelExpiredPendingBookings(): Promise<{ cancelled: number }> {
  const now = new Date()

  const result = await basePrisma.booking.updateMany({
    where: {
      status: 'PENDING',
      paymentExpiresAt: { lte: now },
    },
    data: { status: 'CANCELLED' },
  })

  if (result.count > 0) {
    console.log(`[Payment Lifecycle] Cancelled ${result.count} expired PENDING booking(s)`)
  }

  return { cancelled: result.count }
}
