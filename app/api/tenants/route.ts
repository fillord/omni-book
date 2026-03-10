import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // TODO: list tenants (superadmin only)
  return NextResponse.json({ tenants: [] })
}

export async function POST(_req: NextRequest) {
  // TODO: create tenant (registration flow)
  return NextResponse.json({ tenant: null }, { status: 201 })
}
