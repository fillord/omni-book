import { NextResponse } from 'next/server'
import { processReminders } from '@/lib/email/reminders'

// Этот эндпоинт вызывается CRON-ом каждый час (vercel.json)
// или вручную для тестирования: GET /api/cron/reminders
// Защита: Bearer-токен из CRON_SECRET (в dev — не требуется)
export async function GET(request: Request) {
  const authHeader  = request.headers.get('authorization')
  const cronSecret  = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processReminders()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Reminders CRON error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
