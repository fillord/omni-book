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

export async function createAnnouncement(title: string, body: string) {
  try {
    await ensureSuperAdmin()
    // Deactivate any currently active announcements first (only one active at a time)
    await basePrisma.announcement.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })
    await basePrisma.announcement.create({
      data: { title, body, isActive: true },
    })
    revalidatePath('/admin')
    revalidatePath('/admin/announcements')
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}

export async function deactivateAnnouncement(id: string) {
  try {
    await ensureSuperAdmin()
    await basePrisma.announcement.update({
      where: { id },
      data: { isActive: false },
    })
    revalidatePath('/admin')
    revalidatePath('/admin/announcements')
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    await ensureSuperAdmin()
    await basePrisma.announcement.delete({ where: { id } })
    revalidatePath('/admin')
    revalidatePath('/admin/announcements')
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}

export async function getAnnouncements() {
  try {
    await ensureSuperAdmin()
    return await basePrisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  } catch {
    return []
  }
}
