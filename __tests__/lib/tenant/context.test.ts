import { setTenantContext, getTenantId, requireTenantId } from '@/lib/tenant/context'

describe('TenantContext (AsyncLocalStorage)', () => {
  describe('getTenantId()', () => {
    it('returns undefined outside of any context', () => {
      expect(getTenantId()).toBeUndefined()
    })

    it('returns the tenantId set by setTenantContext()', async () => {
      let captured: string | undefined

      await setTenantContext('tenant-abc', async () => {
        captured = getTenantId()
      })

      expect(captured).toBe('tenant-abc')
    })

    it('returns undefined again after the context callback resolves', async () => {
      await setTenantContext('tenant-xyz', async () => {
        // inside context
      })
      // outside — should be gone
      expect(getTenantId()).toBeUndefined()
    })
  })

  describe('requireTenantId()', () => {
    it('throws when no context is set', () => {
      expect(() => requireTenantId()).toThrow('[tenant] No tenant context established')
    })

    it('returns tenantId when context is set', async () => {
      let result: string | undefined

      await setTenantContext('tenant-123', async () => {
        result = requireTenantId()
      })

      expect(result).toBe('tenant-123')
    })
  })

  describe('concurrent request isolation', () => {
    it('isolates context between concurrent async operations', async () => {
      const results: string[] = []

      // Simulate two "requests" running concurrently
      await Promise.all([
        setTenantContext('tenant-A', async () => {
          // Yield to allow the other context to run
          await new Promise((r) => setTimeout(r, 10))
          results.push(getTenantId()!)
        }),
        setTenantContext('tenant-B', async () => {
          await new Promise((r) => setTimeout(r, 5))
          results.push(getTenantId()!)
        }),
      ])

      // Each context saw its own tenantId
      expect(results).toContain('tenant-A')
      expect(results).toContain('tenant-B')
      // And they didn't bleed into each other (no undefineds, no cross-contamination)
      expect(results).toHaveLength(2)
    })
  })
})
