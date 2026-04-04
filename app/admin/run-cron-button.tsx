'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Loader2 } from 'lucide-react'
import { triggerSubscriptionCron } from '@/lib/actions/admin'

export function RunCronButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await triggerSubscriptionCron()
      if ('error' in res) {
        setResult(`Ошибка: ${res.error}`)
      } else {
        setResult(
          `Готово — предупреждено: ${res.warned}, обработано: ${res.processed}`,
        )
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant="outline"
        size="sm"
        className="neu-raised bg-[var(--neu-bg)] gap-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        Запустить Cron
      </Button>
      {result && (
        <span className="text-sm text-muted-foreground">{result}</span>
      )}
    </div>
  )
}
