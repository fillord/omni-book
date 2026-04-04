import { NextRequest, NextResponse } from 'next/server'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? ''

// GET /api/webhooks/meta — Meta webhook verification handshake
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Meta Webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn('[Meta Webhook] Verification failed — invalid token or mode')
  return new NextResponse(null, { status: 403 })
}

// POST /api/webhooks/meta — Receive WhatsApp events (messages, status updates)
export async function POST(request: NextRequest) {
  const body = await request.json()
  console.log('WhatsApp Webhook Received:', JSON.stringify(body, null, 2))

  // TODO: handle specific event types, e.g.:
  // body.entry[0].changes[0].value.messages — incoming messages
  // body.entry[0].changes[0].value.statuses — delivery/read receipts

  return new NextResponse(null, { status: 200 })
}
