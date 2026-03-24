'use server'

import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { createAuditLog } from '@/lib/actions/audit-log'

const PLAN_STAFF_LIMITS: Record<string, number> = {
  FREE: 2,
  PRO: 25,
  ENTERPRISE: 9999,
}

// ---- helpers ---------------------------------------------------------------

async function requireOwner() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) throw new Error('Unauthorized')
  if (session.user.role !== 'OWNER' && session.user.role !== 'SUPERADMIN') {
    throw new Error('Only OWNER can manage staff')
  }
  return { tenantId: session.user.tenantId, userId: session.user.id }
}

// ---- actions ---------------------------------------------------------------

export async function getStaffMembers() {
  const { tenantId } = await requireOwner()

  const members = await basePrisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return members
}

export async function inviteStaff(data: { name: string; email: string; password: string; role: 'STAFF' | 'OWNER' }) {
  const { tenantId } = await requireOwner()

  // Check plan staff limit
  const tenant = await basePrisma.tenant.findUnique({ where: { id: tenantId } })
  if (tenant) {
    const staffCount = await basePrisma.user.count({ where: { tenantId } })
    const maxStaff = PLAN_STAFF_LIMITS[tenant.plan] ?? 2
    if (staffCount >= maxStaff) {
      return { success: false as const, error: 'LIMIT_REACHED' as const, plan: tenant.plan }
    }
  }

  // Check if email already in use
  const existing = await basePrisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    return { error: 'Email already in use' }
  }

  const bcrypt = await import('bcryptjs')
  const hashed = await bcrypt.hash(data.password, 12)

  await basePrisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashed,
      role: data.role,
      tenantId,
    },
  })

  revalidatePath('/dashboard/staff')
  return { success: true }
}

export async function removeStaff(userId: string) {
  const { tenantId, userId: currentUserId } = await requireOwner()

  if (userId === currentUserId) {
    return { error: 'Cannot remove yourself' }
  }

  // Verify user belongs to this tenant
  const user = await basePrisma.user.findFirst({
    where: { id: userId, tenantId },
  })
  if (!user) return { error: 'User not found' }

  await basePrisma.user.delete({ where: { id: userId } })

  if (user?.tenantId) {
    createAuditLog(user.tenantId, 'staff_deleted', { staffName: user.name, staffEmail: user.email, staffId: userId })
  }

  revalidatePath('/dashboard/staff')
  return { success: true }
}

export async function updateStaffRole(userId: string, role: 'STAFF' | 'OWNER') {
  const { tenantId, userId: currentUserId } = await requireOwner()

  if (userId === currentUserId) {
    return { error: 'Cannot change your own role' }
  }

  const user = await basePrisma.user.findFirst({
    where: { id: userId, tenantId },
  })
  if (!user) return { error: 'User not found' }

  await basePrisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath('/dashboard/staff')
  return { success: true }
}
