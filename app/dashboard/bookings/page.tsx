import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { BookingsDashboard } from '@/components/bookings-dashboard'
import { getServerT } from '@/lib/i18n/server'

export default async function BookingsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user.tenantId) redirect('/login')

  const tenantId = session.user.tenantId

  // Get tenant timezone, resources for filter dropdown, and services for manual booking form
  const [tenant, resources, services, t] = await Promise.all([
    basePrisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, timezone: true, name: true },
    }),
    basePrisma.resource.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' },
    }),
    basePrisma.service.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        durationMin: true,
        resources: { select: { resourceId: true } },
      },
      orderBy: { name: 'asc' },
    }),
    getServerT(),
  ])

  if (!tenant) redirect('/login')

  const canEdit = ['OWNER', 'STAFF', 'SUPERADMIN'].includes(session.user.role)

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard', 'bookings')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('dashboard', 'bookingsSubtitle')}
        </p>
      </div>
      <BookingsDashboard
        tenantSlug={tenant.slug}
        timezone={tenant.timezone}
        tenantName={tenant.name}
        canEdit={canEdit}
        resources={resources}
        services={services}
      />
    </div>
  )
}
