import { NextResponse } from 'next/server'
import { processSubscriptionLifecycle } from '@/lib/subscription-lifecycle'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processSubscriptionLifecycle()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Subscription cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
