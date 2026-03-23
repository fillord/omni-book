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
      {/* Current Plan Card - ИСПРАВЛЕНА ДЛЯ ТЕМНОЙ ТЕМЫ */}
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
            </div>
          </div>
        </CardContent>
      </Card>

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
                <span className="text-4xl font-bold text-foreground">10 000 ₸</span>
                <span className="text-sm text-muted-foreground">/ месяц</span>
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
                  <li key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger>
                <div role="button" tabIndex={0} className="inline-flex w-full sm:w-auto h-12 px-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium cursor-pointer neu-raised bg-[var(--neu-bg)] text-orange-500 active:neu-inset transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [filter:drop-shadow(0_0_8px_theme(colors.orange.400/40%))]">
                  <ShieldCheck size={18} />
                  {isFree ? 'Выбрать PRO' : 'Продлить подписку'}
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Оплата подписки PRO</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Активация тарифа происходит после подтверждения платежа.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-6 space-y-6">
                  {/* ИСПРАВЛЕН БЛОК С ЦЕНОЙ ВНУТРИ ПОПАПА (С !IMPORTANT) */}
                  <div className="bg-[var(--neu-bg)] neu-inset p-4 rounded-lg text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Сумма к оплате:</p>
                    <p className="text-3xl font-bold text-foreground">10 000 ₸</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full neu-raised bg-[var(--neu-bg)] flex items-center justify-center shrink-0">
                        <CreditCard className="text-red-600 dark:text-red-400" size={20} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="font-semibold text-foreground">
                          Перевод Kaspi Bank
                        </h4>
                        <p className="text-sm text-foreground">
                          Отправьте перевод на номер:
                        </p>
                        <p className="text-lg font-mono font-medium text-indigo-600 dark:text-indigo-400">
                          +7 (707) 343-64-23
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Получатель: Нұрсұлтан Г.
                        </p>
                      </div>
                    </div>
                  </div>
  
                  {/* ИСПРАВЛЕН БЛОК "ВНИМАНИЕ" (С !IMPORTANT) */}
                  <div className="bg-[var(--neu-bg)] neu-inset rounded p-3 text-foreground text-sm">
                    <strong>Внимание:</strong> После перевода обязательно нажмите кнопку ниже, чтобы мы проверили платеж.
                  </div>
                </div>

                <DialogFooter className="sm:justify-between items-center flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                    className="w-full sm:w-auto text-muted-foreground hover:bg-muted"
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