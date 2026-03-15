'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyRegistrationOtp, resendRegistrationOtp } from '@/lib/actions/otp'

function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Email не указан</p>
        <Button onClick={() => router.push('/register')}>Вернуться к регистрации</Button>
      </div>
    )
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length < 6) {
      setError('Введите 6-значный код')
      return
    }
    if (!password) {
      setError('Введите ваш пароль для входа')
      return
    }

    setLoading(true)
    setError(null)
    setMsg(null)

    try {
      const res = await verifyRegistrationOtp(email as string, code)
      if (res.error) {
        setError(res.error)
        setLoading(false)
        return
      }

      // Verification successful, now sign in
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Неверный пароль. Пожалуйста, авторизуйтесь на странице входа.')
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch {
      setError('Произошла ошибка при проверке кода')
    } finally {
      if (!error) setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError(null)
    setMsg(null)
    try {
      const res = await resendRegistrationOtp(email as string)
      if (res.error) {
        setError(res.error)
      } else {
        setMsg('Новый код отправлен на ' + email)
      }
    } catch {
      setError('Ошибка при отправке нового кода')
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/5 px-4 py-3 text-sm text-green-600">
          {msg}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Код из письма</Label>
          <Input
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={loading}
            maxLength={6}
            autoComplete="one-time-code"
            className="text-center text-2xl tracking-widest placeholder:text-muted/30"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Ваш пароль</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
          <p className="text-xs text-muted-foreground">Для входа после проверки кода</p>
        </div>

        <Button type="submit" className="w-full" disabled={loading || code.length < 6 || !password}>
          {loading ? 'Проверка...' : 'Подтвердить и войти'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          className="text-xs text-muted-foreground p-0 h-auto"
          onClick={handleResend}
          disabled={resending || loading}
        >
          {resending ? 'Отправка...' : 'Отправить код еще раз'}
        </Button>
      </div>
    </>
  )
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10 relative">
      <Link 
        href="/login" 
        className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Вернуться ко входу
      </Link>

      <Card className="w-full max-w-sm shadow-md">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">Подтверждение Email</CardTitle>
          <CardDescription>Мы отправили 6-значный код на вашу почту.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center text-sm py-4">Загрузка...</div>}>
            <VerifyOtpForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
