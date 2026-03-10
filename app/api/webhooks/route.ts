import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // TODO: verify signature, route to handler (payments, etc.)
  const _body = await req.json()
  return NextResponse.json({ received: true })
}
