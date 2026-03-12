import { Prisma, PrismaClient } from '@prisma/client'

// Models that carry a tenantId column and must be scoped.
const TENANT_SCOPED = new Set(['User', 'Resource', 'Service', 'Booking'])

// Operations where we inject tenantId into WHERE.
const WHERE_OPS = new Set([
  'findFirst', 'findFirstOrThrow',
  'findMany',
  'count', 'aggregate', 'groupBy',
  'update', 'updateMany',
  'delete', 'deleteMany',
  'upsert',
])

// Operations where we inject tenantId into the top-level DATA.
const DATA_OPS = new Set(['create', 'createMany'])

// findUnique/findUniqueOrThrow: Prisma enforces that WHERE only contains
// unique-constraint fields, so we cannot inject tenantId there.
// Instead we post-validate the result (safe because IDs are globally unique cuid2).
const UNIQUE_OPS = new Set(['findUnique', 'findUniqueOrThrow'])

type AnyArgs = Record<string, unknown>

/**
 * Returns a PrismaClient scoped to a specific tenant.
 * Uses $allOperations extension to automatically inject `tenantId` into every qualifying query.
 */
export function getTenantPrisma<T extends PrismaClient>(client: T, tenantId: string) {
  if (!tenantId) {
    throw new Error('[tenant] getTenantPrisma requires a valid tenantId')
  }

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model: string
          operation: string
          args: AnyArgs
          query: (args: AnyArgs) => Promise<unknown>
        }) {
          // Skip models that don't have tenantId
          if (!TENANT_SCOPED.has(model)) {
            return query(args)
          }

          // --- Inject into WHERE ---
          if (WHERE_OPS.has(operation)) {
            const mutated: AnyArgs = {
              ...args,
              where: { ...(args.where as AnyArgs | undefined), tenantId },
            }
            return query(mutated)
          }

          // --- Inject into DATA ---
          if (operation === 'create') {
            const mutated: AnyArgs = {
              ...args,
              data: { ...(args.data as AnyArgs), tenantId },
            }
            return query(mutated)
          }

          if (operation === 'createMany') {
            const raw = args.data
            const data = Array.isArray(raw)
              ? raw.map((row: AnyArgs) => ({ ...row, tenantId }))
              : { ...(raw as AnyArgs), tenantId }
            return query({ ...args, data })
          }

          // --- Post-validate findUnique* ---
          if (UNIQUE_OPS.has(operation)) {
            const result = await query(args)

            if (result !== null && result !== undefined) {
              const record = result as AnyArgs
              if (record.tenantId !== tenantId) {
                // Record belongs to a different tenant — treat as not found
                if (operation === 'findUniqueOrThrow') {
                  throw new Prisma.PrismaClientKnownRequestError(
                    'No record found',
                    { code: 'P2025', clientVersion: Prisma.prismaVersion.client }
                  )
                }
                return null
              }
            }

            return result
          }

          return query(args)
        },
      },
    },
  })
}

export type TenantPrismaClient = ReturnType<typeof getTenantPrisma>
