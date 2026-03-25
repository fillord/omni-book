import { getServerSession } from 'next-auth/next'
import { redirect, notFound } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { ClientDetail } from '@/components/client-detail'
import { getServerT } from '@/lib/i18n/server'

export default async function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const session = await getServerSession(authConfig)
  if (!session?.user.tenantId) redirect('/login')

  const tenantId = session.user.tenantId

  const client = await basePrisma.client.findUnique({
    where: { id: params.clientId },
  })
  if (!client || client.tenantId !== tenantId) notFound()

  // Query bookings by guestPhone + tenantId (Client has NO Booking[] relation — Phase 4 decision)
  const bookings = await basePrisma.booking.findMany({
    where: { tenantId, guestPhone: client.phone },
    include: {
      service:  { select: { name: true, price: true } },
      resource: { select: { name: true } },
    },
    orderBy: { startsAt: 'desc' },
  })

  const t = await getServerT()

  // Serialize dates for client component
  const serializedClient = {
    ...client,
    lastVisitAt: client.lastVisitAt ? client.lastVisitAt.toISOString() : null,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  }

  const serializedBookings = bookings.map(b => ({
    id: b.id,
    startsAt: b.startsAt.toISOString(),
    status: b.status,
    serviceName: b.service?.name ?? '—',
    servicePrice: b.service?.price ?? 0,
    resourceName: b.resource?.name ?? '—',
  }))

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <ClientDetail
        client={serializedClient}
        bookings={serializedBookings}
      />
    </div>
  )
}
