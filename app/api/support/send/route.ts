import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const SUPPORT_EMAIL = 'qz.nursultan@gmail.com'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, message, businessName } = body as {
    name: string
    email: string
    phone: string
    message: string
    businessName?: string
  }

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!resend) {
    console.log('[Support] Dev mock — would send to', SUPPORT_EMAIL, { name, email, phone, message })
    return NextResponse.json({ ok: true })
  }

  const subject = businessName
    ? `[Поддержка] ${businessName} — ${name}`
    : `[Поддержка] Новый запрос от ${name}`

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                omni<span style="opacity:0.75;">book</span>
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Новое обращение в поддержку</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:32px 40px;border-left:1px solid #e8e8f0;border-right:1px solid #e8e8f0;">
              <h2 style="margin:0 0 24px;color:#1a1a2e;font-size:18px;font-weight:600;">Детали обращения</h2>

              <!-- Info grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                ${businessName ? `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;width:140px;">
                    <span style="font-size:12px;font-weight:600;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.5px;">Бизнес</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;">
                    <span style="font-size:14px;color:#1a1a2e;font-weight:500;">${businessName}</span>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;width:140px;">
                    <span style="font-size:12px;font-weight:600;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.5px;">Имя</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;">
                    <span style="font-size:14px;color:#1a1a2e;font-weight:500;">${name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;">
                    <span style="font-size:12px;font-weight:600;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.5px;">Email</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;">
                    <a href="mailto:${email}" style="font-size:14px;color:#6366f1;text-decoration:none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;">
                    <span style="font-size:12px;font-weight:600;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.5px;">Телефон</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;">
                    <a href="tel:${phone}" style="font-size:14px;color:#6366f1;text-decoration:none;">${phone}</a>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <div style="margin-top:24px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.5px;">Сообщение</p>
                <div style="background:#f8f8fc;border-radius:10px;padding:16px 20px;border-left:3px solid #6366f1;">
                  <p style="margin:0;font-size:14px;color:#1a1a2e;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                </div>
              </div>

              <!-- CTA -->
              <div style="margin-top:28px;text-align:center;">
                <a href="mailto:${email}?subject=Re: Ваш запрос в поддержку Omni-Book" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                  Ответить на обращение
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8fc;border-radius:0 0 16px 16px;border:1px solid #e8e8f0;border-top:none;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9999b3;">
                Omni-Book · БИН 030506501136 · Алматы, Казахстан<br/>
                Отправлено через форму обратной связи на <a href="https://omni-book.site" style="color:#6366f1;text-decoration:none;">omni-book.site</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  await resend.emails.send({
    from: 'Omni-Book Support <noreply@omni-book.site>',
    to: SUPPORT_EMAIL,
    replyTo: email,
    subject,
    html,
  })

  return NextResponse.json({ ok: true })
}
