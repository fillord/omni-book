import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { getNicheConfig } from '@/lib/niche/config'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { AdminThemeProvider } from '@/components/theme-providers'

interface TenantInfo {
  id: string
  plan: string
  planStatus: string
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authConfig)

  if (session?.user?.role === 'SUPERADMIN' && !session?.user?.tenantId) {
    redirect('/admin')
  }

  if (!session?.user.tenantId) {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    )
  }

  const tenant = await basePrisma.tenant.findUnique({
    where:  { id: session.user.tenantId },
  })

  const tenantInfo = tenant as unknown as TenantInfo | null
  const tenantPlan = tenantInfo?.plan || 'FREE'
  const tenantPlanStatus = tenantInfo?.planStatus || 'ACTIVE'

  if (tenantPlanStatus === 'BANNED') {
    redirect('/api/force-signout')
  }

  const nicheConfig = getNicheConfig(tenant?.niche)

  return (
    <AdminThemeProvider>
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar
        nicheConfig={nicheConfig}
        tenantName={tenant?.name ?? ''}
        tenantSlug={tenant?.slug ?? ''}
        tenantPlan={tenantPlan}
        tenantPlanStatus={tenantPlanStatus}
        userName={session.user.name ?? ''}
        userEmail={session.user.email ?? ''}
        userRole={session.user.role ?? ''}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
      <Toaster richColors />
    </div>
    </AdminThemeProvider>
  )
}
