import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'

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

        <div className="flex flex-col gap-3">
          <a
            href="mailto:support@omnibook.com"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Написать в поддержку
          </a>
          <SignOutButton
            redirectTo="/"
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Выйти из аккаунта
          </SignOutButton>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-100">
          <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
}
