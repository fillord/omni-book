'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { initiateSubscriptionPayment } from '@/lib/actions/billing'
import { ShieldCheck } from 'lucide-react'

type PendingPayment = {
  id: string
  amount: number
  paylinkUrl: string | null   // CHANGED: was mockQrCode
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
  paylinkUrl: string         // CHANGED: was mockQrCode
  amount: number
  expiresAt: string
}

export function PaymentModal({ isOpen, onOpenChange, pendingPayment, planLabel, planPrice }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [isPolling, setIsPolling] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Resume on pending payment prop
  useEffect(() => {
    if (pendingPayment && isOpen) {
      setStep(2)
      setPaymentData({
        id: pendingPayment.id,
        paylinkUrl: pendingPayment.paylinkUrl ?? '',
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

  function startPolling() {
    if (pollingRef.current) return  // already polling
    setIsPolling(true)
    pollingRef.current = setInterval(async () => {
      // Refresh the page — the billing-content Server Component will re-fetch tenant data
      // If planStatus is ACTIVE, billing-content will show the active plan, not the modal
      router.refresh()
    }, 5000)
  }

  async function handleInitiate() {
    startTransition(async () => {
      const res = await initiateSubscriptionPayment('PRO')
      if (!res.success || !res.paymentId) {
        toast.error(res.error ?? 'Ошибка при создании платежа')
        return
      }
      setPaymentData({
        id: res.paymentId!,
        paylinkUrl: res.paylinkUrl ?? '',  // CHANGED
        amount: res.amount ?? planPrice,
        expiresAt: res.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      setStep(2)
    })
  }

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
                Оплата подписки {planLabel}
              </DialogTitle>
            </DialogHeader>

            {/* Step 2: Redirect to Paylink.kz */}
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="text-4xl">🔗</div>
                <h3 className="text-base font-semibold text-foreground">
                  Оплата через Paylink.kz
                </h3>
                <p className="text-sm text-muted-foreground">
                  Нажмите кнопку ниже, чтобы перейти на страницу оплаты.
                  После оплаты подписка активируется автоматически.
                </p>
              </div>

              {/* Amount display */}
              <div className="text-center p-4 rounded-xl bg-[var(--neu-bg)] neu-inset">
                <p className="text-2xl font-bold text-foreground">
                  {paymentData?.amount.toLocaleString('ru-RU')} ₸
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Подписка {planLabel}
                </p>
              </div>

              {/* Paylink redirect button */}
              <Button
                className="w-full neu-raised bg-[var(--neu-bg)] text-primary font-semibold"
                onClick={() => {
                  if (paymentData?.paylinkUrl) {
                    window.open(paymentData.paylinkUrl, '_blank', 'noopener,noreferrer')
                    startPolling()  // start polling for webhook confirmation
                  }
                }}
                disabled={!paymentData?.paylinkUrl}
              >
                Оплатить через Paylink.kz →
              </Button>

              {/* Polling status */}
              {isPolling && (
                <p className="text-xs text-center text-muted-foreground animate-pulse">
                  Ожидаем подтверждения оплаты...
                </p>
              )}

              {/* Countdown */}
              <p className="text-xs text-center text-muted-foreground">
                Ссылка действительна ещё {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </p>

              <Button variant="ghost" className="w-full text-xs" onClick={() => onOpenChange(false)}>
                Закрыть
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
