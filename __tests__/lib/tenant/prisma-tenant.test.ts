import { getTenantPrisma } from '@/lib/tenant/prisma-tenant'

// ---------------------------------------------------------------------------
// Minimal Prisma-like mock that records how $allOperations is called
// ---------------------------------------------------------------------------

function makeMockPrisma(tenantId: string) {
  // We'll capture the $allOperations handler installed by $extends
  let capturedHandler: ((params: {
    model: string
    operation: string
    args: Record<string, unknown>
    query: (args: Record<string, unknown>) => Promise<unknown>
  }) => Promise<unknown>) | null = null

  const mockClient = {
    $extends(ext: {
      query?: {
        $allModels?: {
          $allOperations?: (params: unknown) => Promise<unknown>
        }
      }
    }) {
      capturedHandler = ext?.query?.$allModels?.$allOperations as typeof capturedHandler ?? null
      return this // return same mock so chaining works in tests
    },

    // Helper to invoke the captured handler directly in tests
    async _invoke(
      model: string,
      operation: string,
      args: Record<string, unknown>
    ) {
      if (!capturedHandler) throw new Error('Extension not installed')
      const where = (args.where as Record<string, unknown>) ?? {}
      const query = jest.fn().mockResolvedValue({ id: '1', tenantId, ...where })
      const result = await capturedHandler({ model, operation, args, query })
      return { result, queryArgs: query.mock.calls[0]?.[0] as Record<string, unknown> | undefined, query }
    },
  }

  getTenantPrisma(mockClient as never, tenantId)
  return mockClient
}

// ---------------------------------------------------------------------------

describe('getTenantPrisma (Prisma extension)', () => {
  describe('non-scoped models (Tenant, ResourceService)', () => {
    it('passes through without injecting tenantId', async () => {
      const mock = makeMockPrisma('tenant-1')
      const { queryArgs } = await mock._invoke('Tenant', 'findMany', {})
      expect(queryArgs?.where).toBeUndefined()
    })
  })

  describe('findMany / findFirst / count', () => {
    it.each(['findMany', 'findFirst', 'count'])(
      'injects tenantId into WHERE for %s',
      async (operation) => {
        const mock = makeMockPrisma('tenant-XYZ')
        const { queryArgs } = await mock._invoke('Booking', operation, { where: { status: 'CONFIRMED' } })
        expect(queryArgs?.where).toEqual({ status: 'CONFIRMED', tenantId: 'tenant-XYZ' })
      }
    )

    it('adds tenantId even when no where was provided', async () => {
      const mock = makeMockPrisma('tenant-42')
      const { queryArgs } = await mock._invoke('Resource', 'findMany', {})
      expect(queryArgs?.where).toEqual({ tenantId: 'tenant-42' })
    })
  })

  describe('create', () => {
    it('injects tenantId into data', async () => {
      const mock = makeMockPrisma('tenant-ABC')
      const { queryArgs } = await mock._invoke('Booking', 'create', {
        data: { guestName: 'Alice', resourceId: 'r1' },
      })
      expect((queryArgs?.data as Record<string, unknown>)?.tenantId).toBe('tenant-ABC')
      expect((queryArgs?.data as Record<string, unknown>)?.guestName).toBe('Alice')
    })
  })

  describe('update / delete', () => {
    it.each(['update', 'delete', 'updateMany', 'deleteMany'])(
      'injects tenantId into WHERE for %s',
      async (operation) => {
        const mock = makeMockPrisma('tenant-SEC')
        const { queryArgs } = await mock._invoke('User', operation, { where: { id: 'u1' } })
        expect((queryArgs?.where as Record<string, unknown>)?.tenantId).toBe('tenant-SEC')
        expect((queryArgs?.where as Record<string, unknown>)?.id).toBe('u1')
      }
    )
  })

  describe('findUnique — cross-tenant post-validation', () => {
    it('returns null when the record belongs to a different tenant', async () => {
      const mockBase = {
        $extends(ext: {
          query?: { $allModels?: { $allOperations?: (p: unknown) => Promise<unknown> } }
        }) {
          const handler = ext?.query?.$allModels?.$allOperations
          if (!handler) throw new Error('No handler')

          return {
            async testFindUnique(recordTenantId: string) {
              return handler({
                model: 'Booking',
                operation: 'findUnique',
                args: { where: { id: 'bk-1' } },
                // query returns a record from a DIFFERENT tenant
                query: jest.fn().mockResolvedValue({ id: 'bk-1', tenantId: recordTenantId }),
              })
            },
          }
        },
      }

      const extended = getTenantPrisma(mockBase as never, 'tenant-A') as unknown as {
        testFindUnique: (recordTenantId: string) => Promise<unknown>
      }

      const result = await extended.testFindUnique('tenant-B')
      expect(result).toBeNull()
    })

    it('returns the record when tenantId matches', async () => {
      const mockBase = {
        $extends(ext: {
          query?: { $allModels?: { $allOperations?: (p: unknown) => Promise<unknown> } }
        }) {
          const handler = ext?.query?.$allModels?.$allOperations
          if (!handler) throw new Error('No handler')
          return {
            async testFindUnique(recordTenantId: string) {
              return handler({
                model: 'Booking',
                operation: 'findUnique',
                args: { where: { id: 'bk-2' } },
                query: jest.fn().mockResolvedValue({ id: 'bk-2', tenantId: recordTenantId }),
              })
            },
          }
        },
      }

      const extended = getTenantPrisma(mockBase as never, 'tenant-A') as unknown as {
        testFindUnique: (recordTenantId: string) => Promise<unknown>
      }

      const result = await extended.testFindUnique('tenant-A')
      expect((result as { id: string }).id).toBe('bk-2')
    })
  })
})
