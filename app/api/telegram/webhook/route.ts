import { type NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { basePrisma } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram'

const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  // Verify Telegram webhook secret (set via setWebhook secret_token param)
  if (WEBHOOK_SECRET) {
    const incoming = req.headers.get('x-telegram-bot-api-secret-token')
    if (incoming !== WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
  }

  const body = await req.json()
  const message = body?.message
  const chatId = String(message?.chat?.id ?? '')
  const text: string = message?.text ?? ''

  // Guard: only the configured admin chat can issue commands
  if (!ADMIN_CHAT_ID || chatId !== ADMIN_CHAT_ID) {
    return NextResponse.json({ ok: true })
  }

  if (text.startsWith('/add_superadmin')) {
    await handleAddSuperadmin(chatId, text)
  }

  return NextResponse.json({ ok: true })
}

async function handleAddSuperadmin(chatId: string, text: string): Promise<void> {
  const parts = text.trim().split(/\s+/)

  if (parts.length !== 3) {
    await reply(chatId, '❌ Использование:\n<code>/add_superadmin email password</code>')
    return
  }

  const [, email, password] = parts

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await reply(chatId, '❌ Некорректный email')
    return
  }

  if (password.length < 8) {
    await reply(chatId, '❌ Пароль должен быть не менее 8 символов')
    return
  }

  const existing = await basePrisma.user.findUnique({ where: { email } })
  if (existing) {
    await reply(chatId, `❌ Пользователь <code>${email}</code> уже существует (роль: ${existing.role})`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await basePrisma.user.create({
    data: {
      email,
      name: 'Superadmin',
      passwordHash,
      role: 'SUPERADMIN',
      tenantId: null,
    },
  })

  await reply(
    chatId,
    `✅ <b>Суперадмин создан</b>\n` +
    `📧 Email: <code>${email}</code>\n` +
    `🔑 Роль: <b>SUPERADMIN</b>\n` +
    `🏢 tenantId: null`,
  )
}

function reply(chatId: string, text: string): Promise<void> {
  return sendTelegramMessage(chatId, text).catch(console.error) as Promise<void>
}
