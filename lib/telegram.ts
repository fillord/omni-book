/**
 * Telegram Bot notification utility.
 * Uses TELEGRAM_BOT_TOKEN from env. No-op if token is absent.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

/**
 * Sends an HTML message to a Telegram chat.
 * Fire-and-forget — call with .catch(console.error) at the call site.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!BOT_TOKEN || !chatId) return

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Telegram API error ${res.status}: ${body}`)
  }
}

export interface InlineButton {
  text: string
  url: string
}

/**
 * Sends an HTML message with a single row of inline URL buttons.
 * Fire-and-forget — call with .catch(console.error) at the call site.
 */
export async function sendTelegramMessageWithButtons(
  chatId: string,
  text: string,
  buttons: InlineButton[],
): Promise<void> {
  if (!BOT_TOKEN || !chatId) return

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id:    chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [buttons.map(b => ({ text: b.text, url: b.url }))],
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Telegram API error ${res.status}: ${body}`)
  }
}
