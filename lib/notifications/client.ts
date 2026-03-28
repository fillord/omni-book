/**
 * Client-facing notification helpers for manage-token actions.
 *
 * Each function fires both channels (Telegram + Email) as fire-and-forget.
 * The caller does NOT await these — call with no await after the DB write.
 */

import { sendTelegramMessage, sendTelegramMessageWithButtons } from '@/lib/telegram'
import { sendCancellationEmail, sendRescheduleEmail } from '@/lib/email/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omni-book.site'

function fmtLocal(d: Date, tz: string): string {
  return d.toLocaleString('ru-RU', {
    timeZone: tz,
    day:      '2-digit',
    month:    'long',
    year:     'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
  })
}

export interface ClientCancelData {
  guestName:      string | null
  guestEmail:     string | null
  telegramChatId: string | null
  serviceName:    string
  resourceName:   string
  tenantName:     string
  tenantTimezone: string
  startsAt:       Date
}

export interface ClientRescheduleData {
  guestName:      string | null
  guestEmail:     string | null
  telegramChatId: string | null
  serviceName:    string
  tenantName:     string
  tenantTimezone: string
  newStartsAt:    Date
  manageToken:    string | null
}

/**
 * Notifies the CLIENT that their booking has been cancelled.
 * Telegram (if linked) + Email (always, if address on file).
 */
export function notifyClientCancellation(data: ClientCancelData): void {
  const dateStr = fmtLocal(data.startsAt, data.tenantTimezone)

  if (data.telegramChatId) {
    const msg = [
      `❌ Ваша запись на <b>${data.serviceName}</b> в ${data.tenantName} успешно отменена.`,
      `📅 Было: ${dateStr}`,
    ].join('\n')
    sendTelegramMessage(data.telegramChatId, msg).catch(console.error)
  }

  if (data.guestEmail) {
    sendCancellationEmail({
      guestName:    data.guestName ?? 'Клиент',
      guestEmail:   data.guestEmail,
      tenantName:   data.tenantName,
      serviceName:  data.serviceName,
      resourceName: data.resourceName,
      startsAt:     data.startsAt,
      timezone:     data.tenantTimezone,
    }).catch(console.error)
  }
}

/**
 * Notifies the CLIENT that their booking has been rescheduled.
 * Telegram (if linked) + Email (always, if address on file).
 * The Telegram message includes an inline "Управление записью" button.
 */
export function notifyClientReschedule(data: ClientRescheduleData): void {
  const newDateStr = fmtLocal(data.newStartsAt, data.tenantTimezone)
  const manageUrl  = data.manageToken ? `${APP_URL}/manage/${data.manageToken}` : null

  if (data.telegramChatId) {
    const msg = [
      `✅ Время вашей записи на <b>${data.serviceName}</b> успешно изменено.`,
      `⏰ Новое время: ${newDateStr}`,
    ].join('\n')

    if (manageUrl) {
      sendTelegramMessageWithButtons(data.telegramChatId, msg, [
        { text: '⚙️ Управление записью', url: manageUrl },
      ]).catch(console.error)
    } else {
      sendTelegramMessage(data.telegramChatId, msg).catch(console.error)
    }
  }

  if (data.guestEmail) {
    sendRescheduleEmail({
      guestName:   data.guestName ?? 'Клиент',
      guestEmail:  data.guestEmail,
      tenantName:  data.tenantName,
      serviceName: data.serviceName,
      newStartsAt: data.newStartsAt,
      timezone:    data.tenantTimezone,
      manageToken: data.manageToken,
    }).catch(console.error)
  }
}
