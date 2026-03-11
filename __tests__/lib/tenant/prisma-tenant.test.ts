import { setTenantContext, getTenantId } from '@/lib/tenant/context'
import { withTenantExtension } from '@/lib/tenant/prisma-tenant'

// ---------------------------------------------------------------------------
// Minimal Prisma-like mock that records how $allOperations is called
// ---------------------------------------------------------------------------

function makeMockPrisma() {
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
      const query = jest.fn().mockResolvedValue({ id: '1', tenantId: getTenantId(), ...where })
      const result = await capturedHandler({ model, operation, args, query })
      return { result, queryArgs: query.mock.calls[0]?.[0] as Record<string, unknown> | undefined, query }
    },
  }

  withTenantExtension(mockClient as never)
  return mockClient
}

// ---------------------------------------------------------------------------

describe('withTenantExtension (Prisma extension)', () => {
  let mock: ReturnType<typeof makeMockPrisma>

  beforeEach(() => {
    mock = makeMockPrisma()
  })

  describe('non-scoped models (Tenant, ResourceService)', () => {
    it('passes through without injecting tenantId', async () => {
      await setTenantContext('tenant-1', async () => {
        const { queryArgs } = await mock._invoke('Tenant', 'findMany', {})
        expect(queryArgs?.where).toBeUndefined()
      })
    })
  })

  describe('scoped models — no context', () => {
    it('passes through with a warning when no tenantId in context', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const { queryArgs } = await mock._invoke('Booking', 'findMany', {})
      expect(queryArgs?.where).toBeUndefined()
      warnSpy.mockRestore()
    })
  })

  describe('findMany / findFirst / count', () => {
    it.each(['findMany', 'findFirst', 'count'])(
      'injects tenantId into WHERE for %s',
      async (operation) => {
        await setTenantContext('tenant-XYZ', async () => {
          const { queryArgs } = await mock._invoke('Booking', operation, { where: { status: 'CONFIRMED' } })
          expect(queryArgs?.where).toEqual({ status: 'CONFIRMED', tenantId: 'tenant-XYZ' })
        })
      }
    )

    it('adds tenantId even when no where was provided', async () => {
      await setTenantContext('tenant-42', async () => {
        const { queryArgs } = await mock._invoke('Resource', 'findMany', {})
        expect(queryArgs?.where).toEqual({ tenantId: 'tenant-42' })
      })
    })
  })

  describe('create', () => {
    it('injects tenantId into data', async () => {
      await setTenantContext('tenant-ABC', async () => {
        const { queryArgs } = await mock._invoke('Booking', 'create', {
          data: { guestName: 'Alice', resourceId: 'r1' },
        })
        expect((queryArgs?.data as Record<string, unknown>)?.tenantId).toBe('tenant-ABC')
        expect((queryArgs?.data as Record<string, unknown>)?.guestName).toBe('Alice')
      })
    })
  })

  describe('update / delete', () => {
    it.each(['update', 'delete', 'updateMany', 'deleteMany'])(
      'injects tenantId into WHERE for %s',
      async (operation) => {
        await setTenantContext('tenant-SEC', async () => {
          const { queryArgs } = await mock._invoke('User', operation, { where: { id: 'u1' } })
          expect((queryArgs?.where as Record<string, unknown>)?.tenantId).toBe('tenant-SEC')
          expect((queryArgs?.where as Record<string, unknown>)?.id).toBe('u1')
        })
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
            async testFindUnique(tenantId: string, recordTenantId: string) {
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

      const extended = withTenantExtension(mockBase as never) as unknown as {
        testFindUnique: (tenantId: string, recordTenantId: string) => Promise<unknown>
      }

      let result: unknown
      await setTenantContext('tenant-A', async () => {
        result = await extended.testFindUnique('tenant-A', 'tenant-B')
      })

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
            async testFindUnique(tenantId: string) {
              return handler({
                model: 'Booking',
                operation: 'findUnique',
                args: { where: { id: 'bk-2' } },
                query: jest.fn().mockResolvedValue({ id: 'bk-2', tenantId }),
              })
            },
          }
        },
      }

      const extended = withTenantExtension(mockBase as never) as unknown as {
        testFindUnique: (tenantId: string) => Promise<unknown>
      }

      let result: unknown
      await setTenantContext('tenant-A', async () => {
        result = await extended.testFindUnique('tenant-A')
      })

      expect((result as { id: string }).id).toBe('bk-2')
    })
  })
})
