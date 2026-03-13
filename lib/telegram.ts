/**
 * Telegram Bot notification utility.
 * Uses TELEGRAM_BOT_TOKEN from env. No-op if token is absent.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

/**
 * Sends a plain-text message to a Telegram chat.
 * Fire-and-forget — call with .catch(console.error) at the call site.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!BOT_TOKEN || !chatId) return

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Telegram API error ${res.status}: ${body}`)
  }
}
