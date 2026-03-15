import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    
    // If no session locally, we cannot check
    if (!session?.user) {
      return NextResponse.json({ active: false, valid: false }, { status: 401 })
    }

    // Get the sessionId that was granted to this specific client
    const currentClientSessionId = session.user.activeSessionId

    if (!currentClientSessionId) {
      // Legacy user who hasn't re-logged in since this feature was added.
      // We'll consider them valid until they login again and get an ID.
      return NextResponse.json({ valid: true })
    }

    // Check what the database says is the *current* active session
    const dbUser = await basePrisma.user.findUnique({
      where: { id: session.user.id },
      select: { activeSessionId: true }
    })

    if (!dbUser) {
      return NextResponse.json({ valid: false }, { status: 404 })
    }

    // If the database has a different active session ID, this client was kicked
    if (dbUser.activeSessionId !== currentClientSessionId) {
      return NextResponse.json({ valid: false })
    }

    // All good
    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("[SESSION CHECK API]", error)
    return NextResponse.json({ valid: true }) // Default to true on error to avoid unnecessary logouts on transient DB issues
  }
}
