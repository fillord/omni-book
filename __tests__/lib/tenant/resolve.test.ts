import { NextRequest } from 'next/server'
import {
  resolveTenant,
  TenantNotFoundError,
  TenantInactiveError,
  TenantSlugMissingError,
  isTenantError,
} from '@/lib/tenant/resolve'

// ---------------------------------------------------------------------------
// Mock basePrisma so tests never hit a real database
// ---------------------------------------------------------------------------

jest.mock('@/lib/db', () => ({
  basePrisma: {
    tenant: {
      findUnique: jest.fn(),
    },
  },
  prisma: {},
}))

// Import AFTER the mock is registered
import { basePrisma } from '@/lib/db'

const mockFindUnique = basePrisma.tenant.findUnique as jest.Mock

// ---------------------------------------------------------------------------

function makeRequest(options: {
  url?: string
  headers?: Record<string, string>
} = {}): NextRequest {
  const url = options.url ?? 'http://localhost:3000/api/bookings'
  return new NextRequest(url, {
    headers: options.headers ?? {},
  })
}

const ACTIVE_TENANT = {
  id: 'tenant-001',
  slug: 'city-polyclinic',
  name: 'City Polyclinic',
  niche: 'medicine',
  plan: 'pro',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const INACTIVE_TENANT = { ...ACTIVE_TENANT, isActive: false }

// ---------------------------------------------------------------------------

describe('resolveTenant()', () => {
  describe('slug resolution — x-tenant-slug header (middleware path)', () => {
    it('resolves tenant from x-tenant-slug header', async () => {
      mockFindUnique.mockResolvedValueOnce(ACTIVE_TENANT)

      const req = makeRequest({ headers: { 'x-tenant-slug': 'city-polyclinic' } })
      const tenant = await resolveTenant(req)

      expect(tenant.id).toBe('tenant-001')
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { slug: 'city-polyclinic' } })
    })
  })

  describe('slug resolution — tenantSlug query param (dev fallback)', () => {
    it('resolves tenant from tenantSlug query parameter', async () => {
      mockFindUnique.mockResolvedValueOnce(ACTIVE_TENANT)

      const req = makeRequest({ url: 'http://localhost:3000/api/bookings?tenantSlug=city-polyclinic' })
      const tenant = await resolveTenant(req)

      expect(tenant.slug).toBe('city-polyclinic')
    })

    it('prefers header over query param when both are present', async () => {
      mockFindUnique.mockResolvedValueOnce({ ...ACTIVE_TENANT, slug: 'header-wins' })

      const req = makeRequest({
        url: 'http://localhost:3000/api?tenantSlug=query-slug',
        headers: { 'x-tenant-slug': 'header-wins' },
      })
      await resolveTenant(req)

      expect(mockFindUnique).toHaveBeenCalledWith({ where: { slug: 'header-wins' } })
    })
  })

  describe('error cases', () => {
    it('throws TenantSlugMissingError (400) when no slug provided', async () => {
      const req = makeRequest()
      await expect(resolveTenant(req)).rejects.toThrow(TenantSlugMissingError)
    })

    it('TenantSlugMissingError has statusCode 400', async () => {
      const err = new TenantSlugMissingError()
      expect(err.statusCode).toBe(400)
    })

    it('throws TenantNotFoundError (404) when slug not in DB', async () => {
      mockFindUnique.mockResolvedValueOnce(null)

      const req = makeRequest({ headers: { 'x-tenant-slug': 'unknown-slug' } })
      await expect(resolveTenant(req)).rejects.toThrow(TenantNotFoundError)
    })

    it('TenantNotFoundError has statusCode 404', async () => {
      const err = new TenantNotFoundError('ghost')
      expect(err.statusCode).toBe(404)
    })

    it('throws TenantInactiveError (403) when tenant is suspended', async () => {
      mockFindUnique.mockResolvedValueOnce(INACTIVE_TENANT)

      const req = makeRequest({ headers: { 'x-tenant-slug': 'city-polyclinic' } })
      await expect(resolveTenant(req)).rejects.toThrow(TenantInactiveError)
    })

    it('TenantInactiveError has statusCode 403', async () => {
      const err = new TenantInactiveError('suspended-co')
      expect(err.statusCode).toBe(403)
    })
  })

  describe('isTenantError()', () => {
    it('returns true for all tenant error types', () => {
      expect(isTenantError(new TenantSlugMissingError())).toBe(true)
      expect(isTenantError(new TenantNotFoundError('x'))).toBe(true)
      expect(isTenantError(new TenantInactiveError('x'))).toBe(true)
    })

    it('returns false for generic errors', () => {
      expect(isTenantError(new Error('oops'))).toBe(false)
      expect(isTenantError(null)).toBe(false)
      expect(isTenantError('string error')).toBe(false)
    })
  })
})
