import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BookingStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import {
  sendCancellationEmail,
  sendCompletionEmail,
  sendConfirmationEmail,
  sendNoShowEmail,
} from '@/lib/email/resend'
import { sendTelegramMessage } from '@/lib/telegram'

// ---- Allowed status transitions --------------------------------------------

const TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
}

// For past bookings (endsAt < now), CONFIRMED can only become COMPLETED or NO_SHOW
const PAST_CONFIRMED_TRANSITIONS: BookingStatus[] = ['COMPLETED', 'NO_SHOW']

// ---- body schema -----------------------------------------------------------

const bodySchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED',
    'NO_SHOW',
  ] as const),
})

// ---- PATCH /api/bookings/[id]/status ----------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!['OWNER', 'STAFF', 'SUPERADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  if (!session.user.tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid status value', details: parsed.error.issues },
      { status: 422 }
    )
  }

  const { status: newStatus } = parsed.data
  const tenantId = session.user.tenantId

  // Fetch booking scoped to this tenant
  const booking = await basePrisma.booking.findFirst({ where: { id, tenantId } })
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const currentStatus = booking.status
  const isPast = booking.endsAt < new Date()

  let allowed = TRANSITIONS[currentStatus] ?? []
  if (currentStatus === 'CONFIRMED' && isPast) {
    allowed = PAST_CONFIRMED_TRANSITIONS
  }

  if (!allowed.includes(newStatus)) {
    const msg =
      allowed.length === 0
        ? `Status "${currentStatus}" is final and cannot be changed`
        : `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(', ')}`
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  if (newStatus === 'CANCELLED') {
    console.log("!!! CANCEL TRIGGERED BY:", {
      functionName: "PATCH /api/bookings/[id]/status",
      bookingId: id,
      status: "CANCELLED",
      callerUserId: session.user.id,
      callerRole: session.user.role,
      stack: new Error().stack,
    })
  }

  const result = await basePrisma.booking.update({
    where: { id },
    data:  { status: newStatus },
    include: {
      resource: { select: { id: true, name: true, type: true } },
      service:  { select: { id: true, name: true, durationMin: true } },
      tenant:   { select: { name: true, timezone: true } },
    },
  })

  // Fire-and-forget status-based emails
  if (booking.guestEmail && booking.guestName) {
    const emailData = {
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      tenantName: result.tenant.name,
      serviceName: result.service?.name ?? 'Услуга',
      resourceName: result.resource.name,
      startsAt: booking.startsAt,
      timezone: result.tenant.timezone ?? 'Asia/Almaty',
    }

    switch (newStatus) {
      case 'CANCELLED':
        sendCancellationEmail(emailData).catch(console.error)
        break
      case 'CONFIRMED':
        sendConfirmationEmail(emailData).catch(console.error)
        break
      case 'COMPLETED':
        sendCompletionEmail(emailData).catch(console.error)
        break
      case 'NO_SHOW':
        sendNoShowEmail(emailData).catch(console.error)
        break
      default:
        break
    }
  }

  // Fire-and-forget Telegram notification to client (if they connected via deep link)
  if (booking.telegramChatId) {
    const tz      = result.tenant.timezone ?? 'Asia/Almaty'
    const dateStr = booking.startsAt.toLocaleString('ru-RU', {
      timeZone: tz,
      day:      '2-digit',
      month:    'long',
      year:     'numeric',
      hour:     '2-digit',
      minute:   '2-digit',
    })
    const tenantName = result.tenant.name

    const telegramMessages: Partial<Record<BookingStatus, string>> = {
      CANCELLED: `❌ Ваша запись на ${dateStr} в ${tenantName} была отменена. Если это ошибка, пожалуйста, свяжитесь с администратором.`,
      NO_SHOW:   `⚠️ К сожалению, мы отметили, что вы не пришли на запись в ${tenantName}. Пожалуйста, старайтесь предупреждать нас об отмене заранее!`,
      COMPLETED: `✅ Спасибо за визит в ${tenantName}! Будем рады видеть вас снова.`,
    }

    const msg = telegramMessages[newStatus]
    if (msg) {
      sendTelegramMessage(booking.telegramChatId, msg).catch((err) =>
        console.error(`[Telegram] Failed to notify client for booking ${id}:`, err)
      )
    }
  }

  return NextResponse.json({ booking: result })
}
