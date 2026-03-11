import { Prisma, PrismaClient } from '@prisma/client'
import { getTenantId } from './context'

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
 * Wraps a PrismaClient with a $allOperations extension that automatically
 * injects `tenantId` from AsyncLocalStorage into every qualifying query.
 *
 * Rules:
 *  - Tenant, ResourceService  — untouched (no tenantId column)
 *  - No context set           — query passes through with a console.warn
 *  - findMany, findFirst, count, update, delete — tenantId added to WHERE
 *  - create, createMany       — tenantId added to DATA
 *  - findUnique, findUniqueOrThrow — post-validate result.tenantId matches context
 */
export function withTenantExtension<T extends PrismaClient>(client: T) {
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

          const tenantId = getTenantId()

          if (!tenantId) {
            if (process.env.NODE_ENV !== 'test') {
              console.warn(
                `[tenant] No tenantId in AsyncLocalStorage for ${model}.${operation}. ` +
                'Wrap this call in setTenantContext().'
              )
            }
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

export type TenantPrismaClient = ReturnType<typeof withTenantExtension>
