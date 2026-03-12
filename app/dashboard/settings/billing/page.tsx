import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth/config"
import { PrismaClient } from "@prisma/client"
import { BillingContent } from "./billing-content"

const prisma = new PrismaClient()

export default async function BillingPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) redirect("/login")

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId }
  })

  if (!tenant) redirect("/login")

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Подписка и биллинг</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Управляйте своим тарифным планом и лимитами.
        </p>
      </div>

      <BillingContent tenant={tenant} />
    </div>
  )
}
