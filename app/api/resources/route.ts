import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // TODO: list resources for tenant
  return NextResponse.json({ resources: [] })
}

export async function POST(_req: NextRequest) {
  // TODO: create resource
  return NextResponse.json({ resource: null }, { status: 201 })
}
