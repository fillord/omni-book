import { ShieldX } from 'lucide-react'
import { BannedActions } from '@/components/banned-actions'

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Аккаунт заблокирован</h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-8">
          Ваш бизнес-аккаунт был заблокирован администратором платформы.
          Если вы считаете, что это ошибка, свяжитесь с поддержкой.
        </p>

        <BannedActions />
      </div>
    </div>
  )
}
