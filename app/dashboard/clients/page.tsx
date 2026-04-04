import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { getClients } from '@/lib/actions/clients'
import { ClientsTable } from '@/components/clients-table'
import { getServerT } from '@/lib/i18n/server'

export default async function ClientsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user.tenantId) redirect('/login')

  const tenantId = session.user.tenantId

  const [clients, t] = await Promise.all([
    getClients(tenantId),
    getServerT(),
  ])

  // Serialize dates and convert prices from minor units (tiyn × 100) to major units for display
  const serializedClients = clients.map(c => ({
    ...c,
    totalRevenue: Math.round(c.totalRevenue / 100),
    lastVisitAt: c.lastVisitAt ? c.lastVisitAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('clients', 'title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('clients', 'subtitle')}</p>
      </div>
      <ClientsTable clients={serializedClients} />
    </div>
  )
}
