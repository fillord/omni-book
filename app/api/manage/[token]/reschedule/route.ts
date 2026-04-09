import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { basePrisma } from "@/lib/db"
import { sendTelegramMessage } from "@/lib/telegram"
import { notifyClientReschedule } from "@/lib/notifications/client"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Explicit GET guard — prevents link previewers from triggering side effects
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

const bodySchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Rate limit: 20 requests per IP per minute (DB-07)
  const rl = await rateLimit(`manage-reschedule:${getClientIp(req)}`, 20, 60_000)
  if (!rl.success) {
    return new Response('Too Many Requests', { status: 429 })
  }

  // 1. Parse and validate request body
  const rawBody = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const { startsAt, endsAt } = parsed.data

  // 2. Token lookup — auth-free, same pattern as cancel route
  const booking = await basePrisma.booking.findUnique({
    where: { manageToken: token },
    include: {
      tenant: {
        select: { name: true, phone: true, telegramChatId: true, timezone: true, slug: true },
      },
      service:  { select: { name: true } },
      resource: { select: { name: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // 3. Status check — must be CONFIRMED or PENDING
  if (!["CONFIRMED", "PENDING"].includes(booking.status)) {
    return NextResponse.json(
      { error: "Запись уже отменена или завершена" },
      { status: 422 }
    )
  }

  // 4. Re-check 4-hour rule server-side (prevents stale UI exploitation)
  const now = new Date()
  const cutoff = new Date(booking.startsAt.getTime() - 4 * 60 * 60 * 1000)
  if (now >= cutoff) {
    return NextResponse.json(
      { error: "Слишком близко ко времени записи для переноса онлайн" },
      { status: 422 }
    )
  }

  // 5. Collision check inside a Serializable transaction
  let updated: { startsAt: Date; endsAt: Date } | null = null
  let conflicted = false

  try {
    updated = await basePrisma.$transaction(
      async (tx) => {
        // Lock the resource row to prevent concurrent conflicts
        await tx.$queryRaw`SELECT id FROM "Resource" WHERE id = ${booking.resourceId} FOR UPDATE`

        // Check for overlapping bookings (exclude current booking)
        const collision = await tx.booking.findFirst({
          where: {
            tenantId: booking.tenantId,
            resourceId: booking.resourceId,
            id: { not: booking.id },
            status: { in: ["CONFIRMED", "PENDING"] },
            AND: [
              { startsAt: { lt: new Date(endsAt) } },
              { endsAt: { gt: new Date(startsAt) } },
            ],
          },
        })

        if (collision) {
          conflicted = true
          return null
        }

        // Update booking in place — no new record created
        return tx.booking.update({
          where: { id: booking.id },
          data: {
            startsAt: new Date(startsAt),
            endsAt: new Date(endsAt),
          },
        })
      },
      { isolationLevel: "Serializable" }
    )
  } catch (err) {
    console.error("Reschedule transaction error:", err)
    return NextResponse.json({ error: "Ошибка при переносе записи" }, { status: 500 })
  }

  // 6. Return 409 if collision detected
  if (conflicted || !updated) {
    return NextResponse.json({ error: "Выбранное время уже занято" }, { status: 409 })
  }

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'https://omni-book.site'
  const fmt         = (d: Date) => format(d, "d MMMM yyyy, HH:mm", { locale: ru })
  const serviceName = booking.service?.name  ?? "—"
  const tz          = booking.tenant?.timezone ?? "Asia/Almaty"
  const newDate     = new Date(startsAt)

  // 7a. Notify OWNER via Telegram (fire-and-forget)
  const tenantChatId = booking.tenant?.telegramChatId ?? null
  if (tenantChatId) {
    const msg = [
      "🔄 <b>Перенос записи!</b>",
      `👤 Клиент: ${booking.guestName ?? "—"} (${booking.guestPhone ?? "—"})`,
      `🛠 Услуга: ${serviceName}`,
      `📅 Было: ${fmt(booking.startsAt)}`,
      `📅 Стало: ${fmt(newDate)}`,
      ...(booking.manageToken ? [`🔗 ${appUrl}/manage/${booking.manageToken}`] : []),
    ].join("\n")
    sendTelegramMessage(tenantChatId, msg).catch(console.error)
  }

  // 7b. Notify CLIENT via Telegram + Email (fire-and-forget)
  notifyClientReschedule({
    guestName:      booking.guestName,
    guestEmail:     booking.guestEmail,
    telegramChatId: booking.telegramChatId,
    serviceName,
    tenantName:     booking.tenant?.name ?? "—",
    tenantTimezone: tz,
    newStartsAt:    newDate,
    manageToken:    booking.manageToken ?? null,
  })

  return NextResponse.json({ ok: true, booking: { startsAt, endsAt } })
}
