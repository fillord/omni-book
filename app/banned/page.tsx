import { ShieldX } from 'lucide-react'
import { BannedActions } from '@/components/banned-actions'

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full neu-raised bg-[var(--neu-bg)] text-foreground rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Аккаунт заблокирован</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Ваш бизнес-аккаунт был заблокирован администратором платформы.
          Если вы считаете, что это ошибка, свяжитесь с поддержкой.
        </p>

        <BannedActions />
      </div>
    </div>
  )
}
