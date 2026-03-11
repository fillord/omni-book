import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { BookingsDashboard } from '@/components/bookings-dashboard'

export default async function BookingsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user.tenantId) redirect('/login')

  const tenantId = session.user.tenantId

  // Get tenant timezone + resources for filter dropdown
  const [tenant, resources] = await Promise.all([
    basePrisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, timezone: true },
    }),
    basePrisma.resource.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!tenant) redirect('/login')

  const canEdit = ['OWNER', 'STAFF', 'SUPERADMIN'].includes(session.user.role)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Бронирования</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Управляйте записями: меняйте статусы, просматривайте в таблице или календаре
        </p>
      </div>
      <BookingsDashboard
        tenantSlug={tenant.slug}
        timezone={tenant.timezone}
        canEdit={canEdit}
        resources={resources}
      />
    </div>
  )
}
