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
    from: 'OmniBook <noreply@omnibook.com>',
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

export async function sendBookingCancellation(data: BookingEmailData): Promise<void> {
  if (!resend || !data.guestEmail) return

  await resend.emails.send({
    from: 'OmniBook <noreply@omnibook.com>',
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
