import { NextRequest, NextResponse } from "next/server"
import { basePrisma } from "@/lib/db"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // 1. Look up booking by manageToken
  const booking = await basePrisma.booking.findUnique({
    where: { manageToken: token },
  })

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // 2. Check booking is in a cancellable state
  if (!["CONFIRMED", "PENDING"].includes(booking.status)) {
    return NextResponse.json(
      { error: "Запись уже отменена или завершена" },
      { status: 422 }
    )
  }

  // 3. Re-check 4-hour rule server-side (prevents stale UI exploitation)
  const now = new Date()
  const cutoff = new Date(booking.startsAt.getTime() - 4 * 60 * 60 * 1000)
  if (now >= cutoff) {
    return NextResponse.json(
      { error: "Слишком близко ко времени записи для отмены онлайн" },
      { status: 422 }
    )
  }

  // 4. Update booking status to CANCELLED (double L — matches Prisma enum)
  await basePrisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  })

  return NextResponse.json({ ok: true })
}
