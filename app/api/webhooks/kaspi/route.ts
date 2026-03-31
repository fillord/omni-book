import { NextRequest, NextResponse } from 'next/server'
import { basePrisma } from '@/lib/db'
import { verifyKaspiWebhook } from '@/lib/payments/kaspi'
import { sendBookingConfirmation } from '@/lib/email/resend'
import { sendTelegramMessage } from '@/lib/telegram'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-kaspi-signature') ?? ''

  if (!verifyKaspiWebhook({ rawBody, signature })) {
    return new NextResponse(null, { status: 403 })
  }

  let payload: { invoiceId?: string; status?: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const invoiceId = payload.invoiceId
  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
  }

  // Find booking by paymentInvoiceId
  const booking = await basePrisma.booking.findFirst({
    where: { paymentInvoiceId: invoiceId },
    include: {
      tenant: { select: { id: true, name: true, telegramChatId: true } },
      service: { select: { name: true } },
      resource: { select: { name: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Idempotent: if already CONFIRMED, return 200 without re-processing (per D-05d)
  if (booking.status === 'CONFIRMED') {
    return new NextResponse(null, { status: 200 })
  }

  // Transition to CONFIRMED, clear paymentExpiresAt
  await basePrisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CONFIRMED',
      paymentExpiresAt: null,
    },
  })

  console.log(`[Kaspi Webhook] Booking ${booking.id} confirmed via payment`)

  // Fire-and-forget: email confirmation (per PAY-05 — triggers email + Telegram)
  if (booking.guestEmail && booking.guestName) {
    sendBookingConfirmation({
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      tenantName: booking.tenant.name,
      serviceName: booking.service?.name ?? '',
      resourceName: booking.resource?.name ?? '',
      startsAt: booking.startsAt,
      manageToken: booking.manageToken,
    }).catch(console.error)
  }

  // Fire-and-forget: Telegram notification to business owner
  const chatId = booking.tenant.telegramChatId
  if (chatId) {
    const startsAt = new Date(booking.startsAt)
    const dateStr = format(startsAt, 'd MMMM yyyy', { locale: ru })
    const timeStr = format(startsAt, 'HH:mm')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omni-book.site'
    const msg = [
      '\u2705 <b>\u041e\u043f\u043b\u0430\u0442\u0430 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0430!</b>',
      `\ud83d\udc64 \u041a\u043b\u0438\u0435\u043d\u0442: ${booking.guestName}`,
      `\ud83d\udcc5 \u0414\u0430\u0442\u0430: ${dateStr}`,
      `\u23f0 \u0412\u0440\u0435\u043c\u044f: ${timeStr}`,
      `\ud83d\udee0 \u0423\u0441\u043b\u0443\u0433\u0430: ${booking.service?.name ?? '\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430'}`,
      ...(booking.manageToken ? [`\ud83d\udd17 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435: ${appUrl}/manage/${booking.manageToken}`] : []),
    ].join('\n')
    sendTelegramMessage(chatId, msg).catch(console.error)
  }

  return new NextResponse(null, { status: 200 })
}
