'use client'

import { useState, useTransition } from 'react'
import { Sliders } from 'lucide-react'
import { toast } from 'sonner'
import { requestEnterpriseInquiry } from '@/lib/actions/billing'

type Props = {
  enterprisePlan: {
    priceMonthly: number  // base price (-1 for dynamic; if -1 use 0 as base)
    pricePerResource: number
  }
  isPending: boolean  // tenant planStatus === 'PENDING'
}

export function EnterpriseCalculator({ enterprisePlan, isPending }: Props) {
  const [resourceCount, setResourceCount] = useState(10)
  const [isPendingTransition, startTransition] = useTransition()

  const base = enterprisePlan.priceMonthly < 0 ? 0 : enterprisePlan.priceMonthly
  const monthly = base + resourceCount * enterprisePlan.pricePerResource
  const yearly = monthly * 10

  function handleRequestEnterprise() {
    startTransition(async () => {
      const res = await requestEnterpriseInquiry(resourceCount, monthly)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Заявка на Enterprise отправлена!')
      }
    })
  }

  return (
    <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-6 space-y-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Sliders size={20} className="text-orange-500" />
        Enterprise
      </h3>

      {/* Slider section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Количество ресурсов: {resourceCount}
        </label>
        <input
          type="range"
          min={1}
          max={200}
          value={resourceCount}
          onChange={e => setResourceCount(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1</span>
          <span>200</span>
        </div>
      </div>

      {/* Price display */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 neu-raised bg-[var(--neu-bg)] rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Ежемесячно</p>
          <p className="text-2xl font-bold text-foreground">{monthly.toLocaleString()} ₸</p>
        </div>
        <div className="flex-1 neu-raised bg-[var(--neu-bg)] rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Ежегодно (скидка 2 мес.)</p>
          <p className="text-2xl font-bold text-foreground">{yearly.toLocaleString()} ₸</p>
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={handleRequestEnterprise}
        disabled={isPending || isPendingTransition}
        className="w-full h-12 rounded-xl neu-raised bg-[var(--neu-bg)] text-orange-500 font-medium active:neu-inset transition-all disabled:opacity-50 [filter:drop-shadow(0_0_8px_theme(colors.orange.400/40%))]"
      >
        {isPending ? 'Заявка отправлена' : 'Запросить Enterprise'}
      </button>
    </div>
  )
}
