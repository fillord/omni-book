import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth/config"
import { getTenantSettings } from "@/lib/actions/tenant-settings"
import { SettingsForm } from "@/components/settings-form"

export default async function SettingsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user) redirect("/login")

  const tenant = await getTenantSettings()
  if (!tenant) redirect("/login")

  const readOnly = session.user.role === "STAFF"

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Информация отображается на вашей публичной странице
        </p>
      </div>
      <SettingsForm tenant={tenant} readOnly={readOnly} />
    </div>
  )
}
