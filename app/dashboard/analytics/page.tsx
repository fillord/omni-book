import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { getNicheConfig } from '@/lib/niche/config'
import { getAnalytics } from '@/lib/actions/analytics'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const session = await getServerSession(authConfig)

  // Get niche color for charts
  let nicheColor = 'blue'
  if (session?.user?.tenantId) {
    const tenant = await basePrisma.tenant.findUnique({
      where:  { id: session.user.tenantId },
      select: { niche: true },
    })
    nicheColor = getNicheConfig(tenant?.niche).color
  }

  const initial = await getAnalytics('30d')

  return <AnalyticsDashboard initial={initial} color={nicheColor} />
}
