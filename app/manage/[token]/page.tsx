import { notFound } from 'next/navigation'
import { basePrisma } from '@/lib/db'
import { BookingManagePage } from '@/components/booking-manage-page'

export default async function ManageTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const booking = await basePrisma.booking.findUnique({
    where: { manageToken: token },
    include: {
      service:  { select: { id: true, name: true, durationMin: true } },
      resource: { select: { id: true, name: true } },
      tenant:   { select: { name: true, phone: true, slug: true, timezone: true } },
    },
  })

  if (!booking) {
    notFound()
  }

  const now = new Date()
  const cutoff = new Date(booking.startsAt.getTime() - 4 * 60 * 60 * 1000)
  const canManage = now < cutoff && ['CONFIRMED', 'PENDING'].includes(booking.status)

  const serializedBooking = {
    id: booking.id,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    status: booking.status,
    serviceName: booking.service?.name ?? '',
    serviceId: booking.service?.id ?? '',
    serviceDurationMin: booking.service?.durationMin ?? 0,
    resourceName: booking.resource?.name ?? '',
    resourceId: booking.resourceId,
    tenantName: booking.tenant?.name ?? '',
    tenantPhone: booking.tenant?.phone ?? null,
    tenantSlug: booking.tenant?.slug ?? '',
    tenantTimezone: booking.tenant?.timezone ?? 'Asia/Almaty',
  }

  return (
    <div className="bg-[var(--neu-bg)] min-h-screen">
      <BookingManagePage
        booking={serializedBooking}
        canManage={canManage}
        token={token}
      />
    </div>
  )
}
