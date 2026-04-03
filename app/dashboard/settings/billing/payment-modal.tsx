'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { initiateSubscriptionPayment, simulatePaymentAction } from '@/lib/actions/billing'
import { ShieldCheck, Clock } from 'lucide-react'

type PendingPayment = {
  id: string
  amount: number
  paylinkUrl: string | null
  expiresAt: string  // ISO string
  planTarget: string
}

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  pendingPayment: PendingPayment | null
  planLabel: string  // "PRO" or plan displayName
  planPrice: number  // priceMonthly from subscriptionPlans
}

type PaymentData = {
  id: string
  paylinkUrl: string | null
  amount: number
  expiresAt: string
}

export function PaymentModal({ isOpen, onOpenChange, pendingPayment, planLabel, planPrice }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Resume on pending payment prop
  useEffect(() => {
    if (pendingPayment && isOpen) {
      setStep(2)
      setPaymentData({
        id: pendingPayment.id,
        paylinkUrl: pendingPayment.paylinkUrl,
        amount: pendingPayment.amount,
        expiresAt: pendingPayment.expiresAt,
      })
    } else if (!pendingPayment) {
      setStep(1)
    }
  }, [pendingPayment, isOpen])

  // Countdown timer
  useEffect(() => {
    if (step !== 2 || !paymentData) return

    const calcTimeLeft = () =>
      Math.max(0, Math.floor((new Date(paymentData.expiresAt).getTime() - Date.now()) / 1000))

    setTimeLeft(calcTimeLeft())

    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [step, paymentData])

  async function handleInitiate() {
    startTransition(async () => {
      const res = await initiateSubscriptionPayment('PRO')
      if (!res.success || !res.paymentId) {
        toast.error(res.error ?? 'Ошибка при создании платежа')
        return
      }
      setPaymentData({
        id: res.paymentId,
        paylinkUrl: res.paylinkUrl ?? null,
        amount: res.amount ?? planPrice,
        expiresAt: res.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      setStep(2)
    })
  }

  function handleSimulate() {
    if (!paymentData) return
    startTransition(async () => {
      const res = await simulatePaymentAction(paymentData.id)
      if (!res.success) {
        toast.error(res.error ?? 'Ошибка симуляции')
        return
      }
      toast.success('Платёж успешно симулирован!')
      onOpenChange(false)
      router.refresh()
    })
  }

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[var(--neu-bg)]">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <ShieldCheck size={20} className="text-orange-500" />
                Оплата подписки {planLabel}
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground">Сумма к оплате:</p>
                <p className="text-3xl font-bold text-foreground">{planPrice.toLocaleString()} ₸</p>
              </div>
              <Button
                onClick={handleInitiate}
                disabled={isPending}
                className="w-full neu-raised"
              >
                {isPending ? 'Обработка...' : 'Оплатить через Paylink.kz'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Clock size={20} className="text-amber-500" />
                Ожидание оплаты подписки
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              {/* TODO(12-03): Show Paylink.kz QR/link here once paylinkUrl is populated */}
              {timeLeft > 0 && paymentData?.paylinkUrl ? (
                <div className="flex justify-center">
                  <a
                    href={paymentData.paylinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center p-4 rounded-xl neu-inset bg-[var(--neu-bg)] text-sm text-indigo-600 dark:text-indigo-400 underline"
                  >
                    Оплатить через Paylink.kz
                  </a>
                </div>
              ) : null}

              {paymentData && (
                <div className="text-center text-sm text-muted-foreground">
                  {paymentData.amount.toLocaleString()} ₸
                </div>
              )}

              <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-3 text-center">
                {timeLeft > 0 ? (
                  <p className="text-lg font-mono font-semibold text-foreground">
                    {formatTime(timeLeft)}
                  </p>
                ) : (
                  <p className="text-sm text-destructive font-medium">Время оплаты истекло</p>
                )}
              </div>

              {process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true' && timeLeft > 0 && (
                <Button
                  variant="outline"
                  onClick={handleSimulate}
                  disabled={isPending}
                  className="w-full neu-raised text-sm"
                >
                  {isPending ? 'Обработка...' : 'Симулировать оплату'}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
