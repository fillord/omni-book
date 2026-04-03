import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth/config"
import { basePrisma } from "@/lib/db"
import { BillingContent } from "./billing-content"

export default async function BillingPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) redirect("/login")

  const tenantId = session.user.tenantId

  const [tenant, subscriptionPlans, pendingPayment] = await Promise.all([
    basePrisma.tenant.findUnique({
      where: { id: tenantId }
    }),
    basePrisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { plan: 'asc' } }),
    basePrisma.platformPayment.findFirst({
      where: { tenantId, status: 'PENDING', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!tenant) redirect("/login")

  const enterprisePlan = subscriptionPlans.find(p => p.plan === 'ENTERPRISE')

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Подписка и биллинг</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Управляйте своим тарифным планом и лимитами.
        </p>
      </div>

      <BillingContent
        tenant={tenant}
        subscriptionPlans={subscriptionPlans}
        pendingPayment={pendingPayment ? {
          id: pendingPayment.id,
          amount: pendingPayment.amount,
          paylinkUrl: pendingPayment.paylinkUrl,
          expiresAt: pendingPayment.expiresAt.toISOString(),
          planTarget: pendingPayment.planTarget,
        } : null}
        enterprisePlan={enterprisePlan ? {
          priceMonthly: enterprisePlan.priceMonthly,
          pricePerResource: enterprisePlan.pricePerResource,
        } : null}
      />
    </div>
  )
}
