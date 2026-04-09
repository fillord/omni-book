import { getServerSession } from 'next-auth/next'
import { type Session } from 'next-auth'
import { type Role } from '@prisma/client'
import { authConfig } from './config'

// ---- Errors ----------------------------------------------------------------

export class UnauthorizedError extends Error {
  readonly statusCode = 401
  constructor() {
    super('Authentication required')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  readonly statusCode = 403
  constructor(message = 'Insufficient permissions') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export function isAuthError(err: unknown): err is UnauthorizedError | ForbiddenError {
  return err instanceof UnauthorizedError || err instanceof ForbiddenError
}

// ---- Guards ----------------------------------------------------------------

/**
 * Returns the current session or throws UnauthorizedError (401).
 * Use in Route Handlers and Server Actions.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getServerSession(authConfig)
  if (!session) throw new UnauthorizedError()
  return session
}

/**
 * Verifies that the session user has one of the allowed roles.
 * Throws ForbiddenError (403) otherwise.
 *
 * SUPERADMIN always passes any role check.
 */
export function requireRole(session: Session, roles: Role[]): void {
  const { role } = session.user
  if (role === 'SUPERADMIN') return
  if (!roles.includes(role)) {
    throw new ForbiddenError(
      `Required role(s): ${roles.join(', ')}. Current role: ${role}`
    )
  }
}

/**
 * Verifies that the session user belongs to the specified tenant.
 * SUPERADMIN can access any tenant.
 * Throws ForbiddenError (403) otherwise.
 */
export function requireTenant(session: Session, tenantId: string): void {
  const { role, tenantId: userTenantId } = session.user
  if (role === 'SUPERADMIN') return
  if (userTenantId !== tenantId) {
    throw new ForbiddenError('Access to this tenant is not allowed')
  }
}

/**
 * Convenience: requireAuth() + requireRole() in one call.
 */
export async function requireAuthWithRole(roles: Role[]): Promise<Session> {
  const session = await requireAuth()
  requireRole(session, roles)
  return session
}

/**
 * Verifies the current user is a super admin.
 * Throws UnauthorizedError if not authenticated, ForbiddenError if not SUPERADMIN.
 * Use in Server Actions that should only be accessible to super admins.
 */
export async function ensureSuperAdmin(): Promise<void> {
  const session = await getServerSession(authConfig)
  if (!session?.user) throw new UnauthorizedError()
  if (session.user.role !== 'SUPERADMIN') {
    throw new ForbiddenError('Superadmin only')
  }
}
