'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, Mail, Phone, MessageCircle } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BillingLimitAlertProps {
  plan: string
  onDismiss?: () => void
}

export function BillingLimitAlert({ plan, onDismiss }: BillingLimitAlertProps) {
  const isEnterprisePitch = plan === 'PRO'

  return (
    <div className="rounded-xl neu-raised p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full neu-inset text-neu-accent">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">
            {isEnterprisePitch ? 'Лимит Pro плана исчерпан' : 'Лимит бесплатного плана исчерпан'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEnterprisePitch
              ? 'Вы достигли максимального лимита для плана Pro. Для снятия ограничений перейдите на план Enterprise.'
              : 'Вы достигли лимита бесплатного плана. Обновитесь до Pro, чтобы добавлять больше объектов.'}
          </p>
        </div>
      </div>

      {isEnterprisePitch ? (
        <div className="rounded-lg neu-inset p-4 space-y-2.5">
          <p className="text-sm font-medium text-foreground">Свяжитесь с нами для перехода на Enterprise:</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <a
              href="mailto:sales@omnibook.kz"
              className="flex items-center gap-2 hover:text-neu-accent transition-colors duration-200"
            >
              <Mail className="h-4 w-4 shrink-0" />
              sales@omnibook.kz
            </a>
            <a
              href="tel:+77001234567"
              className="flex items-center gap-2 hover:text-neu-accent transition-colors duration-200"
            >
              <Phone className="h-4 w-4 shrink-0" />
              +7 700 123-45-67
            </a>
            <a
              href="https://t.me/omnibook_support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-neu-accent transition-colors duration-200"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              @omnibook_support
            </a>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/settings/billing" className={cn(buttonVariants({ size: 'sm' }))}>
            Обновить до Pro
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Закрыть
            </Button>
          )}
        </div>
      )}

      {isEnterprisePitch && onDismiss && (
        <Button variant="ghost" size="sm" onClick={onDismiss} className="w-full">
          Закрыть
        </Button>
      )}
    </div>
  )
}

