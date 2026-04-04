'use server'

import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'

/**
 * Clears the activeSessionId in the database for the current user.
 * Must be called before signOut() so that the next login from any device
 * is not incorrectly blocked by the concurrent-session check.
 */
export async function clearActiveSession(): Promise<void> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) return

  await basePrisma.user.update({
    where: { id: session.user.id },
    data: { activeSessionId: null },
  })
}
