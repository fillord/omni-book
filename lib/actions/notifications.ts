'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'

async function ensureSuperAdmin() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) throw new Error('Unauthorized')
  if (session.user.role !== 'SUPERADMIN' && session.user.email !== 'admin@omnibook.com') {
    throw new Error('Forbidden: Superadmin only')
  }
}

export async function sendNotification(tenantId: string, message: string) {
  try {
    await ensureSuperAdmin()
    await basePrisma.notification.create({
      data: { tenantId, message },
    })
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}

export async function getNotifications(tenantId: string) {
  return basePrisma.notification.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function markNotificationRead(id: string) {
  try {
    await basePrisma.notification.update({
      where: { id },
      data: { read: true },
    })
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}

export async function markAllNotificationsRead(tenantId: string) {
  try {
    await basePrisma.notification.updateMany({
      where: { tenantId, read: false },
      data: { read: true },
    })
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}
