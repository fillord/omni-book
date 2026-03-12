"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useI18n } from "@/lib/i18n/context"

// ---- Types -----------------------------------------------------------------

type LoginFormValues = { email: string; password: string }

const NEXTAUTH_ERROR_KEYS: Record<string, string> = {
  CredentialsSignin:     'credentialsError',
  OAuthAccountNotLinked: 'oauthLinkedError',
  default:               'loginError',
}

// ---- Component -------------------------------------------------------------

function LoginForm() {
  const { t }    = useI18n()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get("from") ?? "/dashboard"
  const authError    = searchParams.get("error")

  const loginSchema = z.object({
    email:    z.string().min(1, t('auth', 'emailRequired')).email(t('auth', 'emailInvalid')),
    password: z.string().min(1, t('auth', 'passwordRequired')),
  })

  const [serverError, setServerError] = useState<string | null>(
    authError ? (t('auth', NEXTAUTH_ERROR_KEYS[authError] ?? NEXTAUTH_ERROR_KEYS.default)) : null
  )
  const [loading, setLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginFormValues) {
    setLoading(true)
    setServerError(null)

    const result = await signIn("credentials", {
      email:    values.email,
      password: values.password,
      redirect: false,
    })

    setLoading(false)

    if (!result?.ok) {
      setServerError(t('auth', NEXTAUTH_ERROR_KEYS[result?.error ?? ""] ?? NEXTAUTH_ERROR_KEYS.default))
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">{t('auth', 'loginTitle')}</CardTitle>
          <CardDescription>{t('auth', 'loginSubtitle')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Server / NextAuth error */}
          {serverError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={loading}
                {...form.register("email")}
                aria-invalid={!!form.formState.errors.email}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth', 'password')}</Label>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={loading}
                {...form.register("password")}
                aria-invalid={!!form.formState.errors.password}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  {t('auth', 'signingIn')}
                </span>
              ) : (
                t('common', 'login')
              )}
            </Button>
          </form>

          {/* Google OAuth — only rendered if GOOGLE_CLIENT_ID is configured */}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
            <>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  {t('auth', 'or')}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('auth', 'googleSignIn')}
              </Button>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {t('auth', 'noAccount')}{" "}
            <Link href="/register" className="font-medium underline underline-offset-4 hover:text-foreground">
              {t('common', 'register')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
