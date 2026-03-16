"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, CreditCard, Clock, CheckCircle2, ShieldCheck, Zap, XCircle, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { requestProActivation } from "@/lib/actions/billing"

type TenantInfo = {
  plan: string
  planStatus: string
}

export function BillingContent({ tenant }: { tenant: TenantInfo }) {
  const router = useRouter()
  
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isFree = tenant.plan === "FREE"
  const isPending = tenant.planStatus === "PENDING"
  const isPro = tenant.plan === "PRO" || tenant.plan === "ENTERPRISE"
  const isExpiredOrCanceled = tenant.planStatus === "EXPIRED" || tenant.planStatus === "CANCELED"
  const showUpgradeCard = (isFree && !isPending) || (isPro && isExpiredOrCanceled)

  async function handlePaymentConfirm() {
    setLoading(true)
    const res = await requestProActivation()
    
    setLoading(false)
    setIsOpen(false)

    if (res?.error) {
      toast.error(res.error || "Произошла ошибка")
      return
    }

    toast.success("Заявка принята! 🎉", {
      description: "Перезагружаем страницу...",
    })
    
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <Card className="border-indigo-100 shadow-sm bg-indigo-50/30">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
            <div>
              <p className="text-sm font-medium text-indigo-600/80 mb-1">Ваш текущий план</p>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                  {tenant.plan}
                </h2>
                {isPending && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                    <Clock size={14} />
                    Ожидает активации
                  </span>
                )}
                {isPro && !isPending && tenant.planStatus === 'ACTIVE' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs font-medium">
                    <CheckCircle2 size={14} />
                    Активен
                  </span>
                )}
                {tenant.planStatus === 'EXPIRED' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 text-xs font-medium">
                    <AlertTriangle size={14} />
                    Истек
                  </span>
                )}
                {tenant.planStatus === 'CANCELED' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-xs font-medium">
                    <XCircle size={14} />
                    Отменен
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade / Renewal Banner */}
      {showUpgradeCard && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-md overflow-hidden relative">
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
            <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-xl p-5 mb-6 border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-extrabold text-foreground">10 000 ₸</span>
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">/ месяц</span>
              </div>
              
              <ul className="grid sm:grid-cols-2 gap-3">
                {[
                  "До 20 ресурсов (мастеров/залов)",
                  "Безлимит бронирований",
                  "Email и СМС уведомления",
                  "Расширенная аналитика",
                  "Приоритетная поддержка",
                  "Увеличенная конверсия",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <Check size={12} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger>
                <div role="button" tabIndex={0} className="inline-flex w-full sm:w-auto h-12 px-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700">
                  <ShieldCheck size={18} />
                  {isFree ? 'Выбрать PRO' : 'Продлить подписку'}
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Оплата подписки PRO</DialogTitle>
                  <DialogDescription>
                    Активация тарифа происходит после подтверждения платежа.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-6 space-y-6">
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-center space-y-2">
                    <p className="text-sm text-zinc-500">Сумма к оплате:</p>
                    <p className="text-3xl font-bold text-zinc-900">10 000 ₸</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <CreditCard className="text-red-600" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900">Перевод Kaspi Bank</h4>
                        <p className="text-sm text-zinc-600 mt-1">Отправьте перевод на номер:</p>
                        <p className="text-lg font-mono font-medium text-indigo-600 mt-1">+7 (707) 343-64-23</p>
                        <p className="text-xs text-zinc-500 mt-1">Получатель: Нұрсұлтан Г.</p>
                      </div>
                    </div>
                  </div>
  
                  <div className="bg-indigo-50 border border-indigo-100 rounded p-3 text-indigo-800 text-sm">
                    <strong>Внимание:</strong> После перевода обязательно нажмите кнопку ниже, чтобы мы проверили платеж.
                  </div>
                </div>

                <DialogFooter className="sm:justify-between items-center flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handlePaymentConfirm} 
                    disabled={loading}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loading ? "Отправка..." : "Я оплатил"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
