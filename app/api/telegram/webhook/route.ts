import { type NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { basePrisma } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram'

const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

interface TelegramUpdate {
  message?: {
    text?: string
    chat: {
      id: number
    }
  }
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
  const text = message.text.trim()

  // Гвардия: только владелец
  if (!ADMIN_CHAT_ID || chatId !== ADMIN_CHAT_ID) {
    console.warn(`[TG] Unauthorized attempt from chatId: ${chatId}`)
    return NextResponse.json({ ok: true })
  }

  // Роутинг команд
  if (text.startsWith('/add_superadmin')) {
    await handleAddSuperadmin(chatId, text)
  } else if (text === '/admins') {
    await handleListAdmins(chatId)
  } else if (text.startsWith('/delete_admin')) {
    await handleDeleteAdmin(chatId, text)
  } else if (text === '/start' || text === '/id') {
    await sendTelegramMessage(chatId, `Твой ID: <code>${chatId}</code>\n\n<b>Доступные команды:</b>\n/admins - Список админов\n/add_superadmin [email] [pass] - Создать\n/delete_admin [email] - Удалить`)
  }

  return NextResponse.json({ ok: true })
}

// === ОБРАБОТЧИКИ КОМАНД ===

async function handleAddSuperadmin(chatId: string, text: string): Promise<void> {
  const parts = text.split(/\s+/)

  if (parts.length !== 3) {
    await sendTelegramMessage(chatId, '❌ <b>Ошибка формата</b>\nИспользуй: <code>/add_superadmin email password</code>')
    return
  }

  const [, email, password] = parts

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await sendTelegramMessage(chatId, '❌ <b>Некорректный Email</b>')
    return
  }

  if (password.length < 8) {
    await sendTelegramMessage(chatId, '❌ <b>Пароль слишком короткий</b> (минимум 8 символов)')
    return
  }

  try {
    const existing = await basePrisma.user.findUnique({ where: { email } })
    if (existing) {
      await sendTelegramMessage(chatId, `❌ Пользователь <b>${email}</b> уже есть в базе.`)
      return
    }

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

    await sendTelegramMessage(chatId, `✅ <b>Супер-админ создан!</b>\n📧 Email: <code>${email}</code>`)
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