import { NextRequest, NextResponse } from 'next/server'
import { verifyPaylinkWebhook } from '@/lib/payments/paylink'
import { processPlatformPayment } from '@/lib/platform-payment'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-paylink-signature') ?? ''

  if (!verifyPaylinkWebhook(rawBody, signature)) {
    console.error('[Paylink Webhook] Invalid signature')
    return new NextResponse(null, { status: 403 })
  }

  let payload: { orderId?: string; status?: string; amount?: number }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
  }

  if (payload.status !== 'PAID') {
    // Ignore non-PAID events (FAILED, CANCELLED handled by expiry cron)
    console.log(`[Paylink Webhook] Skipping event with status: ${payload.status}`)
    return new NextResponse(null, { status: 200 })
  }

  const result = await processPlatformPayment(payload.orderId)

  if (!result.success && !result.alreadyProcessed) {
    console.error(`[Paylink Webhook] Failed to process payment ${payload.orderId}: ${result.error}`)
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}
