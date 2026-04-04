import { type NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { basePrisma } from '@/lib/db'
import { sendTelegramMessage, deleteTelegramMessage } from '@/lib/telegram'

const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

interface TelegramUpdate {
  message?: {
    message_id: number
    text?: string
    chat: {
      id: number
    }
  }
}

/**
 * Generates a cryptographically secure random password.
 * Uses only unambiguous characters (no 0/O, 1/l/I) to ease manual entry.
 */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

export async function POST(req: NextRequest) {
  if (WEBHOOK_SECRET) {
    const incoming = req.headers.get('x-telegram-bot-api-secret-token')
    if (incoming !== WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
  }

  const body = (await req.json()) as TelegramUpdate
  const message = body.message
  
  if (!message || !message.text) {
    return NextResponse.json({ ok: true })
  }

  const chatId = String(message.chat.id)
  const messageId = message.message_id
  const text = message.text.trim()

  // Гвардия: только владелец
  if (!ADMIN_CHAT_ID || chatId !== ADMIN_CHAT_ID) {
    console.warn(`[TG] Unauthorized attempt from chatId: ${chatId}`)
    return NextResponse.json({ ok: true })
  }

  // Роутинг команд
  if (text.startsWith('/add_superadmin')) {
    // Delete the command message immediately — it contains the email address.
    // In private DMs Telegram does not allow bots to delete user messages, so
    // this is best-effort (the helper swallows the error silently).
    await deleteTelegramMessage(chatId, messageId)
    await handleAddSuperadmin(chatId, text)
  } else if (text === '/admins') {
    await handleListAdmins(chatId)
  } else if (text.startsWith('/delete_admin')) {
    await handleDeleteAdmin(chatId, text)
  } else if (text === '/start' || text === '/id') {
    await sendTelegramMessage(
      chatId,
      `Твой ID: <code>${chatId}</code>\n\n<b>Доступные команды:</b>\n/admins — Список админов\n/add_superadmin [email] — Создать (пароль генерируется автоматически)\n/delete_admin [email] — Удалить`,
    )
  }

  return NextResponse.json({ ok: true })
}

// === ОБРАБОТЧИКИ КОМАНД ===

async function handleAddSuperadmin(chatId: string, text: string): Promise<void> {
  // New format: /add_superadmin email
  // Password is NEVER sent through Telegram chat — generated server-side.
  const parts = text.split(/\s+/)

  if (parts.length !== 2) {
    await sendTelegramMessage(
      chatId,
      '❌ <b>Ошибка формата</b>\nИспользуй: <code>/add_superadmin email@example.com</code>\n\nПароль будет сгенерирован автоматически.',
    )
    return
  }

  const [, email] = parts

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await sendTelegramMessage(chatId, '❌ <b>Некорректный Email</b>')
    return
  }

  try {
    const existing = await basePrisma.user.findUnique({ where: { email } })
    if (existing) {
      await sendTelegramMessage(chatId, `❌ Пользователь <b>${email}</b> уже есть в базе.`)
      return
    }

    // Generate a strong random password — never typed by the admin in chat
    const password = generateSecurePassword()
    const passwordHash = await bcrypt.hash(password, 12)

    await basePrisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: 'Super Admin',
        passwordHash,
        role: 'SUPERADMIN',
        tenantId: null,
      },
    })

    await sendTelegramMessage(
      chatId,
      `✅ <b>Супер-админ создан!</b>\n\n📧 Email: <code>${email}</code>\n🔑 Пароль: <code>${password}</code>\n\n⚠️ <b>Сохраните пароль</b> — он больше не будет показан. Смените его после первого входа.`,
    )
  } catch (error) {
    console.error('[TG_CMD_ERR]', error)
    await sendTelegramMessage(chatId, '❌ <b>Ошибка БД</b>. Проверь логи сервера.')
  }
}

async function handleListAdmins(chatId: string): Promise<void> {
  try {
    const admins = await basePrisma.user.findMany({
      where: { role: 'SUPERADMIN' },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    })

    if (admins.length === 0) {
      await sendTelegramMessage(chatId, '📭 Список супер-админов пуст.')
      return
    }

    let msg = '👥 <b>Список Супер-Админов:</b>\n\n'
    admins.forEach((admin, index) => {
      msg += `${index + 1}. <code>${admin.email}</code>\n`
    })
    msg += '\n<i>Для удаления используй команду:</i>\n<code>/delete_admin email@example.com</code>'

    await sendTelegramMessage(chatId, msg)
  } catch (error) {
    console.error('[TG_LIST_ERR]', error)
    await sendTelegramMessage(chatId, '❌ Ошибка при получении списка админов.')
  }
}

async function handleDeleteAdmin(chatId: string, text: string): Promise<void> {
  const parts = text.split(/\s+/)

  if (parts.length !== 2) {
    await sendTelegramMessage(chatId, '❌ <b>Ошибка формата</b>\nИспользуй: <code>/delete_admin email@example.com</code>')
    return
  }

  const email = parts[1].toLowerCase()

  try {
    const admin = await basePrisma.user.findUnique({ where: { email } })

    if (!admin) {
      await sendTelegramMessage(chatId, `❌ Пользователь <b>${email}</b> не найден.`)
      return
    }

    // Защита от случайного удаления обычных пользователей или владельцев клиник
    if (admin.role !== 'SUPERADMIN') {
      await sendTelegramMessage(chatId, `❌ Пользователь <b>${email}</b> не является супер-админом. Удаление отклонено.`)
      return
    }

    await basePrisma.user.delete({ where: { email } })
    
    await sendTelegramMessage(chatId, `🗑️ Супер-админ <b>${email}</b> успешно удален из системы.`)
  } catch (error) {
    console.error('[TG_DEL_ERR]', error)
    await sendTelegramMessage(chatId, '❌ Ошибка при удалении админа из БД.')
  }
}