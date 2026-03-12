import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { getResources } from '@/lib/actions/resources'
import { ResourcesManager } from '@/components/resources-manager'
import { getNicheConfig } from '@/lib/niche/config'
import { getServerT } from '@/lib/i18n/server'

export default async function ResourcesPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user.tenantId) redirect('/login')

  const [resources, tenant, t] = await Promise.all([
    getResources(),
    basePrisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { niche: true },
    }),
    getServerT(),
  ])

  const niche       = tenant?.niche ?? 'medicine'
  const nicheConfig = getNicheConfig(niche)
  const canEdit     = ['OWNER', 'SUPERADMIN'].includes(session.user.role)

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{nicheConfig.resourceLabelPlural}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('dashboard', 'resourcesSubtitle').replace('{resources}', nicheConfig.resourceLabelPlural.toLowerCase())}
        </p>
      </div>
      <ResourcesManager resources={resources} canEdit={canEdit} niche={niche} />
    </div>
  )
}
