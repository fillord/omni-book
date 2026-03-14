"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword } from "@/lib/actions/account"
import { useI18n } from "@/lib/i18n/context"

type FormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function ChangePasswordForm() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setFieldErrors({})

    if (values.newPassword !== values.confirmPassword) {
      setFieldErrors({
        confirmPassword: t("auth", "passwordsMismatch") ?? "Пароли не совпадают",
      })
      return
    }

    setLoading(true)
    try {
      const res = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      if (!res.success) {
        if (res.fieldErrors) {
          setFieldErrors((prev) => ({ ...prev, ...res.fieldErrors }))
        }
        if (res.error) {
          toast.error(res.error)
        }
        return
      }

      toast.success(t("settings", "passwordChanged") ?? "Пароль успешно изменён")
      reset()
    } catch (err) {
      toast.error(
        t("settings", "passwordChangeError") ??
          (err instanceof Error ? err.message : "Не удалось изменить пароль"),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings", "securityTitle") ?? "Безопасность"}</CardTitle>
        <CardDescription>
          {t("settings", "securityDesc") ??
            "Смените пароль владельца аккаунта. Используйте сложный и уникальный пароль."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">
              {t("settings", "currentPassword") ?? "Текущий пароль"}
            </Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register("currentPassword")}
            />
            {fieldErrors.currentPassword && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">
              {t("settings", "newPassword") ?? "Новый пароль"}
            </Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register("newPassword")}
            />
            {fieldErrors.newPassword && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.newPassword}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t("settings", "passwordHint") ??
                "Минимум 8 символов, хотя бы одна буква и одна цифра."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">
              {t("settings", "confirmPassword") ?? "Повторите новый пароль"}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading} className="min-w-32">
              {loading ? t("common", "saving") : t("common", "save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

