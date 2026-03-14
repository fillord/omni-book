import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface BookingEmailData {
  guestName: string
  guestEmail: string | null | undefined
  tenantName: string
  serviceName: string
  resourceName: string
  startsAt: Date | string
  timezone?: string
}

function fmtDateTime(d: Date | string, tz = 'Europe/Moscow'): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d))
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  if (!resend || !data.guestEmail) return

  await resend.emails.send({
    from: 'Omni-Book <noreply@omni-book.site>',
    to: data.guestEmail,
    subject: `Запись подтверждена: ${data.serviceName} в ${data.tenantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#16a34a">Запись подтверждена ✓</h2>
        <p>Здравствуйте, <strong>${data.guestName}</strong>!</p>
        <p>Вы успешно записаны в <strong>${data.tenantName}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:6px 0;color:#6b7280">Услуга</td><td style="padding:6px 0;font-weight:600">${data.serviceName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Специалист</td><td style="padding:6px 0">${data.resourceName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Время</td><td style="padding:6px 0">${fmtDateTime(data.startsAt, data.timezone)}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px">Если возникнут вопросы — свяжитесь с нами.</p>
      </div>
    `,
  })
}

// ---- Reminder email --------------------------------------------------------

export interface ReminderEmailData {
  to: string
  guestName: string
  tenantName: string
  serviceName: string
  resourceName: string
  startsAt: Date
  timezone: string
  tenantSlug: string
  tenantPhone?: string | null
}

export async function sendBookingReminder(data: ReminderEmailData): Promise<void> {
  if (!resend) {
    console.log('📧 Reminder skipped (no RESEND_API_KEY):', data.to)
    return
  }

  const { formatInTimeZone } = await import('date-fns-tz')
  const { ru } = await import('date-fns/locale/ru')
  const dateStr = formatInTimeZone(data.startsAt, data.timezone, 'd MMMM yyyy', { locale: ru })
  const timeStr = formatInTimeZone(data.startsAt, data.timezone, 'HH:mm')

  await resend.emails.send({
    from: 'Omni-Book <noreply@omni-book.site>',
    to: data.to,
    subject: `Напоминание: ${data.serviceName} завтра в ${timeStr}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#f59e0b;color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="margin:0;font-size:24px">⏰ Напоминание о записи</h1>
        </div>
        <div style="border:1px solid #e4e4e7;border-top:none;padding:24px;border-radius:0 0 12px 12px">
          <p style="font-size:16px">Здравствуйте, ${data.guestName}!</p>
          <p>Напоминаем о вашей записи в <strong>${data.tenantName}</strong>:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 0;color:#71717a">Услуга</td><td style="padding:8px 0;font-weight:bold">${data.serviceName}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a">Специалист</td><td style="padding:8px 0;font-weight:bold">${data.resourceName}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a">Дата</td><td style="padding:8px 0;font-weight:bold">${dateStr}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a">Время</td><td style="padding:8px 0;font-weight:bold">${timeStr}</td></tr>
          </table>
          ${data.tenantPhone ? `<p style="margin-top:16px">Для отмены или переноса свяжитесь: <a href="tel:${data.tenantPhone}">${data.tenantPhone}</a></p>` : ''}
          <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0" />
          <p style="color:#a1a1aa;font-size:12px;text-align:center">
            Отправлено через <a href="https://omnibook.com" style="color:#a1a1aa">omni-book</a>
          </p>
        </div>
      </div>
    `,
  })
}

// ---- Cancellation email ----------------------------------------------------

export async function sendBookingCancellation(data: BookingEmailData): Promise<void> {
  if (!resend || !data.guestEmail) return

  await resend.emails.send({
    from: 'Omni-Book <noreply@omni-book.site>',
    to: data.guestEmail,
    subject: `Запись отменена: ${data.serviceName} в ${data.tenantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#dc2626">Запись отменена</h2>
        <p>Здравствуйте, <strong>${data.guestName}</strong>!</p>
        <p>Ваша запись в <strong>${data.tenantName}</strong> была отменена.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:6px 0;color:#6b7280">Услуга</td><td style="padding:6px 0;font-weight:600">${data.serviceName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Специалист</td><td style="padding:6px 0">${data.resourceName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Время</td><td style="padding:6px 0">${fmtDateTime(data.startsAt, data.timezone)}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px">Вы можете записаться снова в удобное время.</p>
      </div>
    `,
  })
}
