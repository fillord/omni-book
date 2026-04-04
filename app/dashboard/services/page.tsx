import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { getServices } from '@/lib/actions/services'
import { getResources } from '@/lib/actions/resources'
import { ServicesManager } from '@/components/services-manager'
import { getServerT } from '@/lib/i18n/server'

export default async function ServicesPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user.tenantId) redirect('/login')

  const [services, resources, t] = await Promise.all([getServices(), getResources(), getServerT()])
  const canEdit = ['OWNER', 'SUPERADMIN'].includes(session.user.role)

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard', 'services')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('dashboard', 'servicesSubtitle')}
        </p>
      </div>
      <ServicesManager services={services} resources={resources} canEdit={canEdit} />
    </div>
  )
}
