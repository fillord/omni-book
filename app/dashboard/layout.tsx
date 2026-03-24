import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { getNicheConfig } from '@/lib/niche/config'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Toaster } from '@/components/ui/sonner'
import { AdminThemeProvider } from '@/components/theme-providers'
import Link from 'next/link'
import { Mail } from 'lucide-react'

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

  const [tenant, announcement, unreadCount, notifications] = await Promise.all([
    basePrisma.tenant.findUnique({ where: { id: session.user.tenantId } }),
    basePrisma.announcement.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
    basePrisma.notification.count({ where: { tenantId: session.user.tenantId, read: false } }),
    basePrisma.notification.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

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
        tenantId={session.user.tenantId}
        unreadCount={unreadCount}
        notifications={notifications}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {tenantPlanStatus === 'EXPIRED' && (
          <div className="mx-4 mt-4 mb-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 px-4 py-4 text-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-orange-700 dark:text-orange-200 font-medium">
                Ваш тариф истек или отменен. Продлите подписку, чтобы избежать блокировки онлайн-записи.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
                {/* TODO: Replace with your actual payment link, e.g., Kaspi Pay */}
                <Link
                  href="/dashboard/settings/billing"
                  className="inline-flex items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Продлить подписку / PRO
                </Link>
                <a
                  href="mailto:qz.nursultan@gmail.com"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-orange-300 dark:border-orange-700 px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Написать в поддержку
                </a>
              </div>
            </div>
          </div>
        )}
        {announcement && (
          <AnnouncementBanner
            id={announcement.id}
            title={announcement.title}
            body={announcement.body}
          />
        )}
        {children}
      </main>
      <Toaster richColors />
    </div>
    </AdminThemeProvider>
  )
}
