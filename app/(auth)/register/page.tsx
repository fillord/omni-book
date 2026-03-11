"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

// ---- Schema ----------------------------------------------------------------

const NICHES = [
  { value: "medicine", label: "Медицина / Консультации" },
  { value: "beauty",   label: "Красота / Beauty" },
  { value: "horeca",   label: "HoReCa (кафе, рестораны)" },
  { value: "sports",   label: "Спорт и досуг" },
] as const

type NicheValue = (typeof NICHES)[number]["value"]

const registerSchema = z
  .object({
    name:       z.string().min(2, "Минимум 2 символа"),
    email:      z.string().min(1, "Введите email").email("Некорректный email"),
    password:   z.string().min(8, "Минимум 8 символов"),
    confirm:    z.string().min(1, "Подтвердите пароль"),
    tenantName: z.string().min(2, "Минимум 2 символа"),
    slug: z
      .string()
      .min(3, "Минимум 3 символа")
      .max(50, "Максимум 50 символов")
      .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Только строчные буквы, цифры и дефис"),
    niche: z.enum(["medicine", "beauty", "horeca", "sports"], "Выберите нишу"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Пароли не совпадают",
    path: ["confirm"],
  })

type RegisterForm = z.infer<typeof registerSchema>

// ---- Helpers ---------------------------------------------------------------

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string
  error?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ---- Component -------------------------------------------------------------

export default function RegisterPage() {
  const router = useRouter()
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError]   = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "", email: "", password: "", confirm: "",
      tenantName: "", slug: "", niche: undefined,
    },
  })

  // Auto-generate slug from business name
  function handleTenantNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    form.setValue("tenantName", e.target.value)
    // Only auto-fill slug if user hasn't touched it yet
    if (!form.getFieldState("slug").isDirty) {
      const auto = e.target.value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50)
      form.setValue("slug", auto, { shouldDirty: false })
    }
  }

  async function onSubmit(values: RegisterForm) {
    setLoading(true)
    setServerErrors({})
    setGlobalError(null)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       values.name,
          email:      values.email,
          password:   values.password,
          tenantName: values.tenantName,
          slug:       values.slug,
          niche:      values.niche,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors) {
          setServerErrors(data.errors)
        } else {
          setGlobalError(data.error ?? "Ошибка регистрации")
        }
        return
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email:    values.email,
        password: values.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push("/dashboard")
        router.refresh()
      } else {
        // Registration succeeded but auto-login failed — send to login
        router.push("/login?registered=1")
      }
    } catch {
      setGlobalError("Нет соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  const e = { ...form.formState.errors, ...Object.fromEntries(
    Object.entries(serverErrors).map(([k, v]) => [k, { message: v }])
  )}

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт владельца бизнеса</CardDescription>
        </CardHeader>

        <CardContent>
          {globalError && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {globalError}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Section: personal */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ваши данные
              </p>

              <Field label="Имя" error={e.name?.message}>
                <Input
                  placeholder="Иван Иванов"
                  disabled={loading}
                  autoComplete="name"
                  {...form.register("name")}
                />
              </Field>

              <Field label="Email" error={e.email?.message}>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                  {...form.register("email")}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Пароль" error={e.password?.message}>
                  <Input
                    type="password"
                    placeholder="Минимум 8 символов"
                    disabled={loading}
                    autoComplete="new-password"
                    {...form.register("password")}
                  />
                </Field>

                <Field label="Повторите пароль" error={e.confirm?.message}>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="new-password"
                    {...form.register("confirm")}
                  />
                </Field>
              </div>
            </div>

            <Separator />

            {/* Section: business */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ваш бизнес
              </p>

              <Field label="Название" error={e.tenantName?.message}>
                <Input
                  placeholder="City Polyclinic"
                  disabled={loading}
                  {...form.register("tenantName", { onChange: handleTenantNameChange })}
                />
              </Field>

              <Field
                label="Slug (адрес)"
                error={e.slug?.message}
                hint="Только строчные буквы, цифры и дефис — это будет ваш субдомен"
              >
                <div className="flex items-center rounded-md border bg-muted/40 overflow-hidden
                                focus-within:ring-2 focus-within:ring-ring focus-within:border-ring">
                  <span className="px-3 text-sm text-muted-foreground select-none border-r">
                    slug:
                  </span>
                  <input
                    type="text"
                    className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="city-polyclinic"
                    disabled={loading}
                    {...form.register("slug", {
                      onChange: (e) => {
                        form.setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      },
                    })}
                  />
                </div>
              </Field>

              <Field label="Ниша" error={e.niche?.message}>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background
                             focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                             disabled:opacity-50"
                  disabled={loading}
                  {...form.register("niche")}
                >
                  <option value="">— Выберите нишу —</option>
                  {NICHES.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Создаём аккаунт…
                </span>
              ) : (
                "Создать аккаунт"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium underline underline-offset-4 hover:text-foreground">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
