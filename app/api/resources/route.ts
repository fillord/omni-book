import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // STUB: not implemented — list resources for tenant
  return NextResponse.json({ resources: [] })
}

export async function POST(_req: NextRequest) {
  // STUB: not implemented — create resource
  return NextResponse.json({ resource: null }, { status: 201 })
}
