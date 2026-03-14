import { headers } from 'next/headers'
import { BookingThemeProvider } from '@/components/theme-providers'

export default async function BookLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const tenantSlug = headersList.get('x-tenant-slug') ?? 'unknown'

  return (
    <BookingThemeProvider>
      <div data-tenant={tenantSlug}>
        {children}
      </div>
    </BookingThemeProvider>
  )
}
