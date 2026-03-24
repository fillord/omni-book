'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { activateSubscription } from '@/lib/actions/admin'

export function ActivateSubscriptionForm({ tenantId }: { tenantId: string }) {
  const [isPending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)

  function handleActivate() {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    startTransition(async () => {
      const result = await activateSubscription(tenantId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Подписка активирована на 30 дней!')
        setConfirmed(false)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleActivate}
        disabled={isPending}
        className={confirmed
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
          : ''
        }
      >
        <ShieldCheck className="h-4 w-4 mr-2" />
        {isPending
          ? 'Активация...'
          : confirmed
            ? 'Подтвердить активацию PRO (30 дней)'
            : 'Активировать подписку PRO'
        }
      </Button>
      {confirmed && (
        <Button variant="ghost" onClick={() => setConfirmed(false)} disabled={isPending}>
          Отмена
        </Button>
      )}
    </div>
  )
}
