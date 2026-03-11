"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { tenantSettingsSchema } from "@/lib/validations/tenant-settings"
import { updateTenantSettings } from "@/lib/actions/tenant-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ---- types -----------------------------------------------------------------

type SocialLinks = {
  instagram?: string
  whatsapp?: string
  telegram?: string
}

type TenantData = {
  id:          string
  name:        string
  slug:        string
  niche:       string | null
  plan:        string
  description: string | null
  phone:       string | null
  email:       string | null
  address:     string | null
  city:        string | null
  website:     string | null
  logoUrl:     string | null
  coverUrl:    string | null
  workingHours: string | null
  timezone:    string
  socialLinks: unknown
}

type FormValues = {
  name:         string
  description:  string
  phone:        string
  email:        string
  address:      string
  city:         string
  website:      string
  logoUrl:      string
  coverUrl:     string
  workingHours: string
  timezone:     string
  instagram:    string
  whatsapp:     string
  telegram:     string
}

type Props = {
  tenant:   TenantData
  readOnly: boolean
}

// ---- helpers ---------------------------------------------------------------

const TIMEZONES = [
  { value: "Asia/Almaty",   label: "Asia/Almaty (UTC+5)" },
  { value: "Asia/Oral",     label: "Asia/Oral (UTC+5)" },
  { value: "Europe/Moscow", label: "Europe/Moscow (UTC+3)" },
  { value: "UTC",           label: "UTC+0" },
]

function parseSocialLinks(raw: unknown): SocialLinks {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as SocialLinks
  }
  return {}
}

// ---- Textarea component ----------------------------------------------------

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[
        "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className,
      ].join(" ")}
      {...props}
    />
  )
}

// ---- image preview ---------------------------------------------------------

function UrlPreview({ url, alt }: { url: string; alt: string }) {
  if (!url) return null
  return (
    <div className="mt-2 overflow-hidden rounded-md border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="h-24 w-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
    </div>
  )
}

// ---- FieldError helper -----------------------------------------------------

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-destructive mt-1">{msg}</p>
}

// ---- component -------------------------------------------------------------

export function SettingsForm({ tenant, readOnly }: Props) {
  const social = parseSocialLinks(tenant.socialLinks)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      name:         tenant.name,
      description:  tenant.description  ?? "",
      phone:        tenant.phone        ?? "",
      email:        tenant.email        ?? "",
      address:      tenant.address      ?? "",
      city:         tenant.city         ?? "",
      website:      tenant.website      ?? "",
      logoUrl:      tenant.logoUrl      ?? "",
      coverUrl:     tenant.coverUrl     ?? "",
      workingHours: tenant.workingHours ?? "",
      timezone:     tenant.timezone     || "Asia/Almaty",
      instagram:    social.instagram    ?? "",
      whatsapp:     social.whatsapp     ?? "",
      telegram:     social.telegram     ?? "",
    },
  })

  const descValue  = watch("description") ?? ""
  const logoValue  = watch("logoUrl")     ?? ""
  const coverValue = watch("coverUrl")    ?? ""
  const timezone   = watch("timezone")

  async function onSubmit(values: FormValues) {
    setFieldErrors({})
    const payload = {
      name:         values.name,
      description:  values.description,
      phone:        values.phone,
      email:        values.email,
      address:      values.address,
      city:         values.city,
      website:      values.website,
      logoUrl:      values.logoUrl,
      coverUrl:     values.coverUrl,
      workingHours: values.workingHours,
      timezone:     values.timezone,
      socialLinks: {
        instagram: values.instagram,
        whatsapp:  values.whatsapp,
        telegram:  values.telegram,
      },
    }

    const result = tenantSettingsSchema.safeParse(payload)
    if (!result.success) {
      const errs: Partial<Record<keyof FormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[issue.path.length - 1] as keyof FormValues
        if (key) errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    setLoading(true)
    try {
      await updateTenantSettings(result.data)
      toast.success("Настройки сохранены")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка сохранения")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">

      {/* Read-only slug */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Адрес вашей страницы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-mono bg-muted rounded-md px-3 py-2 select-all">
            omnibook.com/<span className="font-semibold text-foreground">{tenant.slug}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Адрес нельзя изменить — это сломает все ваши ссылки.
          </p>
        </CardContent>
      </Card>

      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
          <CardDescription>Название и описание вашего заведения</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-1.5">
            <Label htmlFor="name">Название бизнеса *</Label>
            <Input
              id="name"
              {...register("name")}
              disabled={readOnly}
              placeholder="Ваше заведение"
            />
            <FieldError msg={fieldErrors.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              {...register("description")}
              disabled={readOnly}
              placeholder="Расскажите клиентам о вашем заведении…"
              maxLength={500}
              rows={4}
            />
            <div className="flex justify-between">
              <FieldError msg={fieldErrors.description} />
              <span className="text-xs text-muted-foreground ml-auto">
                {descValue.length}/500
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timezone">Часовой пояс</Label>
            <Select
              value={timezone}
              onValueChange={(v) => { if (v) setValue("timezone", v) }}
              disabled={readOnly}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Выберите часовой пояс" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Контакты */}
      <Card>
        <CardHeader>
          <CardTitle>Контакты</CardTitle>
          <CardDescription>Контактная информация для клиентов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Телефон</Label>
              <PhoneInput
                value={watch("phone")}
                onChange={(formatted) => setValue("phone", formatted)}
                disabled={readOnly}
              />
              <FieldError msg={fieldErrors.phone} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={readOnly}
                placeholder="info@yourbusiness.com"
              />
              <FieldError msg={fieldErrors.email} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">Город</Label>
              <Input
                id="city"
                {...register("city")}
                disabled={readOnly}
                placeholder="Алматы"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                {...register("address")}
                disabled={readOnly}
                placeholder="ул. Абая, 10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Сайт</Label>
            <Input
              id="website"
              type="url"
              {...register("website")}
              disabled={readOnly}
              placeholder="https://yourbusiness.com"
            />
            <FieldError msg={fieldErrors.website} />
          </div>
        </CardContent>
      </Card>

      {/* Часы работы */}
      <Card>
        <CardHeader>
          <CardTitle>Часы работы</CardTitle>
          <CardDescription>Общее расписание заведения для клиентов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="workingHours">Расписание</Label>
            <Input
              id="workingHours"
              {...register("workingHours")}
              disabled={readOnly}
              placeholder="Пн-Пт: 09:00-18:00, Сб: 10:00-15:00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Брендинг */}
      <Card>
        <CardHeader>
          <CardTitle>Брендинг</CardTitle>
          <CardDescription>
            Загрузите изображение на{" "}
            <a
              href="https://imgbb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              imgbb.com
            </a>{" "}
            или{" "}
            <a
              href="https://imgur.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              imgur.com
            </a>{" "}
            и вставьте ссылку
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">URL логотипа</Label>
            <Input
              id="logoUrl"
              type="url"
              {...register("logoUrl")}
              disabled={readOnly}
              placeholder="https://i.imgur.com/…"
            />
            <FieldError msg={fieldErrors.logoUrl} />
            <UrlPreview url={logoValue} alt="Превью логотипа" />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="coverUrl">URL обложки (hero-секция)</Label>
            <Input
              id="coverUrl"
              type="url"
              {...register("coverUrl")}
              disabled={readOnly}
              placeholder="https://i.imgur.com/…"
            />
            <FieldError msg={fieldErrors.coverUrl} />
            <UrlPreview url={coverValue} alt="Превью обложки" />
          </div>
        </CardContent>
      </Card>

      {/* Социальные сети */}
      <Card>
        <CardHeader>
          <CardTitle>Социальные сети</CardTitle>
          <CardDescription>Ссылки или username для быстрой связи</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm shrink-0">instagram.com/</span>
              <Input
                id="instagram"
                {...register("instagram")}
                disabled={readOnly}
                placeholder="@username или полная ссылка"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              {...register("whatsapp")}
              disabled={readOnly}
              placeholder="+77001112233"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telegram">Telegram</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm shrink-0">t.me/</span>
              <Input
                id="telegram"
                {...register("telegram")}
                disabled={readOnly}
                placeholder="@username"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      {readOnly ? (
        <p className="text-sm text-muted-foreground text-center pb-6">
          Только владелец может изменять настройки.
        </p>
      ) : (
        <div className="flex justify-end pb-6">
          <Button type="submit" disabled={loading} className="min-w-32">
            {loading ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>
      )}
    </form>
  )
}
