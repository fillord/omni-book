import { basePrisma } from '@/lib/db'

export async function cancelExpiredPendingBookings(): Promise<{ cancelled: number }> {
  // Kaspi deposit flow removed — no PENDING bookings with payment expiry
  // This function is kept for API compatibility but is now a no-op
  return { cancelled: 0 }
}
