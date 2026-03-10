import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // TODO: list bookings for tenant
  return NextResponse.json({ bookings: [] })
}

export async function POST(_req: NextRequest) {
  // TODO: create booking
  return NextResponse.json({ booking: null }, { status: 201 })
}
