import { AsyncLocalStorage } from 'async_hooks'

interface TenantStore {
  tenantId: string
}

const storage = new AsyncLocalStorage<TenantStore>()

/**
 * Runs `callback` inside a tenant context.
 * All code within the callback (and any async work it spawns) will see
 * the provided tenantId via getTenantId().
 *
 * AsyncLocalStorage guarantees isolation between concurrent requests —
 * each request gets its own store, even when running in parallel.
 */
export function setTenantContext<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
  return storage.run({ tenantId }, callback)
}

/**
 * Returns the tenantId for the current async context, or undefined if
 * no tenant context has been established (e.g. platform-level routes).
 */
export function getTenantId(): string | undefined {
  return storage.getStore()?.tenantId
}

/**
 * Like getTenantId() but throws if no context is set.
 * Use this inside functions that must run within a tenant context.
 */
export function requireTenantId(): string {
  const id = getTenantId()
  if (!id) throw new Error('[tenant] No tenant context established. Call setTenantContext() first.')
  return id
}
