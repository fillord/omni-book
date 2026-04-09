import { NextRequest, NextResponse } from 'next/server'
import { basePrisma } from '@/lib/db'
import { sendTelegramMessage, sendTelegramMessageWithButtons } from '@/lib/telegram'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omni-book.site'

// POST /api/webhooks/telegram — Receive Telegram Bot updates
export async function POST(request: NextRequest) {
  // Validate webhook secret
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const headerToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    if (headerToken !== secret) {
      return new NextResponse(null, { status: 401 })
    }
  }

  const update = await request.json()

  const message = update.message
  if (!message?.text || !message.chat?.id) {
    return new NextResponse(null, { status: 200 })
  }

  const chatId = String(message.chat.id)
  const text   = message.text as string

  // Handle deep-link start payload: /start b_<bookingId>
  if (text.startsWith('/start ')) {
    const payload = text.slice(7).trim()

    if (payload.startsWith('b_')) {
      const bookingId = payload.slice(2)

      const booking = await basePrisma.booking.findUnique({
        where:  { id: bookingId },
        select: {
          id:          true,
          startsAt:    true,
          manageToken: true,
          service:     { select: { name: true } },
          tenant:      { select: { name: true, timezone: true } },
        },
      })

      if (!booking || !booking.manageToken) {
        await sendTelegramMessage(
          chatId,
          'Извините, запись не найдена или срок ссылки истёк.',
        ).catch(console.error)
        return new NextResponse(null, { status: 200 })
      }

      // Save the chat ID so reminders can reach this user
      await basePrisma.booking.update({
        where: { id: bookingId },
        data:  { telegramChatId: chatId },
      })

      const tz      = booking.tenant.timezone ?? 'Asia/Almaty'
      const dateStr = format(booking.startsAt, 'd MMMM yyyy, HH:mm', { locale: ru })
      // Format in the tenant's timezone for accuracy
      const localDateStr = booking.startsAt.toLocaleString('ru-RU', {
        timeZone: tz,
        day:      '2-digit',
        month:    'long',
        year:     'numeric',
        hour:     '2-digit',
        minute:   '2-digit',
      })

      const welcomeText = [
        '✅ <b>Вы успешно подписались на уведомления!</b>',
        '',
        `📅 Запись: <b>${booking.service?.name ?? 'Услуга'}</b>`,
        `🏢 Заведение: ${booking.tenant.name}`,
        `⏰ Время: ${localDateStr}`,
        '',
        'Вы можете управлять своей записью (перенести или отменить) по ссылке ниже:',
      ].join('\n')

      await sendTelegramMessageWithButtons(chatId, welcomeText, [
        { text: '⚙️ Управление записью', url: `${APP_URL}/manage/${booking.manageToken}` },
      ]).catch(console.error)
    }
  }

  // Always return 200 so Telegram stops retrying
  return new NextResponse(null, { status: 200 })
}
