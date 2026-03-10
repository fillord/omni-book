import { headers } from 'next/headers'

export default async function BookLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const tenantSlug = headersList.get('x-tenant-slug') ?? 'unknown'

  return (
    <div data-tenant={tenantSlug}>
      {children}
    </div>
  )
}
