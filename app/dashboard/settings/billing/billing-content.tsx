"use client"

import { useState, useEffect } from "react"
import {
  Check,
  CreditCard,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  XCircle,
  AlertTriangle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { EnterpriseCalculator } from './enterprise-calculator'
import { PaymentModal } from './payment-modal'

type TenantInfo = {
  plan: string
  planStatus: string
  subscriptionExpiresAt: Date | null
}

type SubscriptionPlanInfo = {
  plan: string
  displayName: string
  priceMonthly: number
  priceYearly: number
  features: string[]
}

type PendingPaymentInfo = {
  id: string
  amount: number
  paylinkUrl: string | null
  expiresAt: string
  planTarget: string
}

type EnterprisePlanInfo = {
  priceMonthly: number
  pricePerResource: number
}

type Props = {
  tenant: TenantInfo
  subscriptionPlans?: SubscriptionPlanInfo[]
  pendingPayment?: PendingPaymentInfo | null
  enterprisePlan?: EnterprisePlanInfo | null
}

export function BillingContent({ tenant, subscriptionPlans = [], pendingPayment = null, enterprisePlan = null }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const isFree = tenant.plan === "FREE"
  const isPending = tenant.planStatus === "PENDING"
  const isPro = tenant.plan === "PRO" || tenant.plan === "ENTERPRISE"
  const isExpiredOrCanceled = tenant.planStatus === "EXPIRED" || tenant.planStatus === "CANCELED"
  const showUpgradeCard = (isFree && !isPending) || (isPro && isExpiredOrCanceled)

  const proPlan = subscriptionPlans.find(p => p.plan === 'PRO')

  // Auto-open modal if pending payment exists on page load
  useEffect(() => {
    if (pendingPayment) {
      setIsOpen(true)
    }
  }, [pendingPayment])

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
            <div>
              <p className="text-sm font-medium text-indigo-600/80 dark:text-indigo-400 mb-1">Ваш текущий план</p>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  {tenant.plan}
                </h2>
                {isPending && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full neu-raised bg-[var(--neu-bg)] text-amber-600 text-xs font-medium">
                    <Clock size={14} />
                    Ожидает активации
                  </span>
                )}
                {isPro && !isPending && tenant.planStatus === 'ACTIVE' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--neu-bg)] text-emerald-400 text-xs font-medium [filter:drop-shadow(0_0_6px_currentColor)]">
                    <CheckCircle2 size={14} />
                    Активен
                  </span>
                )}
                {tenant.planStatus === 'EXPIRED' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full neu-raised bg-[var(--neu-bg)] text-orange-600 text-xs font-medium">
                    <AlertTriangle size={14} />
                    Истек
                  </span>
                )}
                {tenant.planStatus === 'CANCELED' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full neu-raised bg-[var(--neu-bg)] text-red-600 text-xs font-medium">
                    <XCircle size={14} />
                    Отменен
                  </span>
                )}
              </div>
              {isPro && !isExpiredOrCanceled && tenant.subscriptionExpiresAt && (
                <p className="text-sm text-muted-foreground mt-2">
                  Подписка активна до: {new Date(tenant.subscriptionExpiresAt).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isExpiredOrCanceled && (
        <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-orange-500">
            <AlertTriangle size={20} />
            <h3 className="font-semibold text-base">Ваша подписка истекла</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Ваши данные заморожены. Продлите подписку PRO, чтобы восстановить полный доступ к ресурсам и услугам.
          </p>
        </div>
      )}

      {/* Upgrade / Renewal Banner */}
      {showUpgradeCard && (
        <Card className="overflow-hidden relative neu-inset bg-[var(--neu-bg)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none" />

          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-amber-500 fill-amber-500" size={20} />
              <CardTitle className="text-xl">
                {isFree ? 'Переход на PRO' : 'Продление PRO'}
              </CardTitle>
            </div>
            <CardDescription className="text-base text-muted-foreground">
              {isFree
                ? 'Снимите ограничения и получите доступ ко всем функциям платформы для уверенного роста вашего бизнеса.'
                : 'Продлите подписку, чтобы восстановить доступ ко всем функциям и избежать блокировки онлайн-записи.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-[var(--neu-bg)] neu-inset rounded-xl p-6 my-6">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-foreground">
                  {(proPlan?.priceMonthly ?? 10000).toLocaleString()} ₸
                </span>
                <span className="text-sm text-muted-foreground">/ месяц</span>
              </div>

              <ul className="grid sm:grid-cols-2 gap-3">
                {proPlan?.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    {feature}
                  </li>
                )) ?? (
                  <>
                    {[
                      "До 20 ресурсов (мастеров/залов)",
                      "Безлимит бронирований",
                      "Email и СМС уведомления",
                      "Расширенная аналитика",
                      "Приоритетная поддержка",
                      "Увеличенная конверсия",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                        <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="inline-flex w-full sm:w-auto h-12 px-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium cursor-pointer neu-raised bg-[var(--neu-bg)] text-orange-500 active:neu-inset transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [filter:drop-shadow(0_0_8px_theme(colors.orange.400/40%))]"
            >
              <ShieldCheck size={18} />
              {isFree ? 'Выбрать PRO' : 'Продлить подписку'}
            </button>

            <PaymentModal
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              pendingPayment={pendingPayment}
              planLabel={isFree ? 'PRO' : tenant.plan}
              planPrice={proPlan?.priceMonthly ?? 10000}
            />
          </CardContent>
        </Card>
      )}

      {/* Enterprise Calculator */}
      {enterprisePlan && (
        <EnterpriseCalculator
          enterprisePlan={enterprisePlan}
          isPending={isPending}
        />
      )}

      {/* TODO(12-03): Paylink.kz payment configuration will be added here in Phase 12-03 */}
    </div>
  )
}
