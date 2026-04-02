import { NextRequest, NextResponse } from 'next/server'
import { processPlatformPayment } from '@/lib/platform-payment'

export async function POST(request: NextRequest) {
  // Auth: MOCK_PAYMENT_SECRET or CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const secret = process.env.MOCK_PAYMENT_SECRET || process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { paymentId } = body
    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
    }

    const result = await processPlatformPayment(paymentId)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, alreadyProcessed: result.alreadyProcessed })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
