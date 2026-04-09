import { NextRequest, NextResponse } from "next/server"
import { basePrisma } from "@/lib/db"
import { sendTelegramMessage } from "@/lib/telegram"
import { notifyClientCancellation } from "@/lib/notifications/client"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Explicit GET handler — some crawlers / email clients / Telegram link previews
// send GET requests to URLs found in messages. Return 405 so they never trigger
// a cancellation side-effect.
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Rate limit: 20 requests per IP per minute (DB-07)
  const rl = rateLimit(`manage-cancel:${getClientIp(req)}`, 20, 60_000)
  if (!rl.success) {
    return new Response('Too Many Requests', { status: 429 })
  }

  // Hard-lockdown diagnostics — log EVERY incoming request immediately, before any DB work
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  console.log(`[DEBUG] CANCEL REQUEST at ${new Date().toISOString()} from IP: ${ip}`)
  const caller = {
    ip,
    userAgent: req.headers.get("user-agent") ?? "unknown",
    referer:   req.headers.get("referer") ?? "none",
    origin:    req.headers.get("origin") ?? "none",
    method:    req.method,
  }
  console.log(`[cancel] POST /api/manage/${token.slice(0, 8)}... from`, caller)

  // 1. Look up booking by manageToken
  const booking = await basePrisma.booking.findUnique({
    where: { manageToken: token },
    include: {
      tenant:   { select: { name: true, telegramChatId: true, timezone: true } },
      service:  { select: { name: true } },
      resource: { select: { name: true } },
    },
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

  // 4. Update booking status to CANCELLED
  console.log("!!! CANCEL TRIGGERED BY:", {
    functionName: "POST /api/manage/[token]/cancel",
    bookingId: booking.id,
    status: "CANCELLED",
    caller,
    stack: new Error().stack,
  })
  await basePrisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  })

  console.log(`[cancel] Booking ${booking.id} CANCELLED by client — token ${token.slice(0, 8)}...`)

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || "https://omni-book.site"
  const fmt         = (d: Date) => format(d, "d MMMM yyyy, HH:mm", { locale: ru })
  const serviceName = booking.service?.name  ?? "—"
  const tz          = booking.tenant?.timezone ?? "Asia/Almaty"

  // 5a. Notify OWNER via Telegram (fire-and-forget)
  const tenantChatId = booking.tenant?.telegramChatId ?? null
  if (tenantChatId) {
    const msg = [
      "❌ <b>Запись отменена клиентом</b>",
      `👤 Клиент: ${booking.guestName ?? "—"} (${booking.guestPhone ?? "—"})`,
      `🛠 Услуга: ${serviceName}`,
      `📅 Время: ${fmt(booking.startsAt)}`,
      ...(booking.manageToken ? [`🔗 ${appUrl}/manage/${booking.manageToken}`] : []),
    ].join("\n")
    sendTelegramMessage(tenantChatId, msg).catch(console.error)
  }

  // 5b. Notify CLIENT via Telegram + Email (fire-and-forget)
  notifyClientCancellation({
    guestName:      booking.guestName,
    guestEmail:     booking.guestEmail,
    telegramChatId: booking.telegramChatId,
    serviceName,
    resourceName:   booking.resource?.name ?? "—",
    tenantName:     booking.tenant?.name   ?? "—",
    tenantTimezone: tz,
    startsAt:       booking.startsAt,
  })

  return NextResponse.json({ ok: true })
}
