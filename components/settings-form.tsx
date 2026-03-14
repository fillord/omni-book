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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"

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
  workingHours:   string | null
  timezone:       string
  socialLinks:    unknown
  translations?:  unknown
  telegramChatId: string | null
}

type FormValues = {
  name:         string
  description:  string
  name_kz?:     string
  desc_kz?:     string
  name_en?:     string
  desc_en?:     string
  phone:        string
  email:        string
  address:      string
  city:         string
  website:      string
  logoUrl:      string
  coverUrl:     string
  workingHours: string
  timezone:     string
  instagram:      string
  whatsapp:       string
  telegram:       string
  telegramChatId: string
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

const CITIES = [
  // Крупнейшие города
  { value: "Almaty", label: "Алматы" },
  { value: "Astana", label: "Астана" },
  { value: "Shymkent", label: "Шымкент" },

  // Областные центры и крупные города
  { value: "Karaganda", label: "Караганда" },
  { value: "Aktobe", label: "Актобе" },
  { value: "Taraz", label: "Тараз" },
  { value: "Pavlodar", label: "Павлодар" },
  { value: "Oskemen", label: "Усть-Каменогорск" },
  { value: "Semey", label: "Семей" },
  { value: "Atyrau", label: "Атырау" },
  { value: "Kokshetau", label: "Кокшетау" },
  { value: "Kostanay", label: "Костанай" },
  { value: "Kyzylorda", label: "Кызылорда" },
  { value: "Oral", label: "Уральск" },
  { value: "Petropavl", label: "Петропавловск" },
  { value: "Taldykorgan", label: "Талдыкорган" },
  { value: "Turkistan", label: "Туркестан" },
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
  const { t }  = useI18n()
  const social = parseSocialLinks(tenant.socialLinks)
  const [loading, setLoading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
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
      name_kz:      ((tenant.translations as Record<string, Record<string, string>>)?.kz?.name) || "",
      desc_kz:      ((tenant.translations as Record<string, Record<string, string>>)?.kz?.description) || "",
      name_en:      ((tenant.translations as Record<string, Record<string, string>>)?.en?.name) || "",
      desc_en:      ((tenant.translations as Record<string, Record<string, string>>)?.en?.description) || "",
      phone:        tenant.phone        ?? "",
      email:        tenant.email        ?? "",
      address:      tenant.address      ?? "",
      city:         tenant.city         ?? "",
      website:      tenant.website      ?? "",
      logoUrl:      tenant.logoUrl      ?? "",
      coverUrl:     tenant.coverUrl     ?? "",
      workingHours: tenant.workingHours ?? "",
      timezone:     tenant.timezone     || "Asia/Almaty",
      instagram:      social.instagram        ?? "",
      whatsapp:       social.whatsapp         ?? "",
      telegram:       social.telegram         ?? "",
      telegramChatId: tenant.telegramChatId   ?? "",
    },
  })

  const descValue  = watch("description") ?? ""
  const logoValue  = watch("logoUrl")     ?? ""
  const coverValue = watch("coverUrl")    ?? ""
  const timezone   = watch("timezone")

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    setLogoUploading(true)
    try {
      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json?.url) {
        throw new Error(json?.error || "Не удалось загрузить логотип")
      }
      setValue("logoUrl", json.url)
      toast.success(t("settings", "logoUploaded") ?? "Логотип загружен")
    } catch (err) {
      toast.error(
        t("settings", "logoUploadError") ??
          (err instanceof Error ? err.message : "Ошибка загрузки логотипа"),
      )
    } finally {
      setLogoUploading(false)
      e.target.value = ""
    }
  }

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
      telegramChatId: values.telegramChatId,
      translations: {
        en: {
          name: values.name_en,
          description: values.desc_en,
        },
        kz: {
          name: values.name_kz,
          description: values.desc_kz,
        }
      }
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
      toast.success(t('settings', 'saved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings', 'saveError'))
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
            {t('settings', 'pageAddress')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-mono bg-muted rounded-md px-3 py-2 select-all">
            omnibook.com/<span className="font-semibold text-foreground">{tenant.slug}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {t('settings', 'pageAddressHint')}
          </p>
        </CardContent>
      </Card>

      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings', 'basicInfo')}</CardTitle>
          <CardDescription>{t('settings', 'basicInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <Tabs defaultValue="ru" className="w-full mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="ru">RU (Основной)</TabsTrigger>
              <TabsTrigger value="kz">Қазақша</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>

            <TabsContent value="ru" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t('settings', 'businessName')} (RU)</Label>
                <Input
                  id="name"
                  {...register("name")}
                  disabled={readOnly}
                  placeholder={t('settings', 'businessNamePlaceholder')}
                />
                <FieldError msg={fieldErrors.name} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">{t('settings', 'description')} (RU)</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  disabled={readOnly}
                  placeholder={t('settings', 'descriptionPlaceholder')}
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
            </TabsContent>

            <TabsContent value="kz" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name_kz">{t('settings', 'businessName')} (KZ)</Label>
                <Input
                  id="name_kz"
                  {...register("name_kz")}
                  disabled={readOnly}
                  placeholder={t('settings', 'businessNamePlaceholder')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc_kz">{t('settings', 'description')} (KZ)</Label>
                <Textarea
                  id="desc_kz"
                  {...register("desc_kz")}
                  disabled={readOnly}
                  placeholder={t('settings', 'descriptionPlaceholder')}
                  maxLength={500}
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name_en">{t('settings', 'businessName')} (EN)</Label>
                <Input
                  id="name_en"
                  {...register("name_en")}
                  disabled={readOnly}
                  placeholder={t('settings', 'businessNamePlaceholder')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc_en">{t('settings', 'description')} (EN)</Label>
                <Textarea
                  id="desc_en"
                  {...register("desc_en")}
                  disabled={readOnly}
                  placeholder={t('settings', 'descriptionPlaceholder')}
                  maxLength={500}
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label htmlFor="timezone">{t('settings', 'timezone')}</Label>
            <Select
              value={timezone}
              onValueChange={(v) => { if (v) setValue("timezone", v) }}
              disabled={readOnly}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder={t('settings', 'timezonePlaceholder')} />
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
          <CardTitle>{t('settings', 'contacts')}</CardTitle>
          <CardDescription>{t('settings', 'contactsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t('settings', 'phone')}</Label>
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
                placeholder={t('settings', 'emailPlaceholder') || "info@yourbusiness.com"}
              />
              <FieldError msg={fieldErrors.email} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">{t('settings', 'city')}</Label>
              <Select
                value={watch("city")}
                onValueChange={(v) => { if (v) setValue("city", v) }}
                disabled={readOnly}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder={t('settings', 'cityPlaceholder') || "Алматы"} />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">{t('settings', 'address')}</Label>
              <Input
                id="address"
                {...register("address")}
                disabled={readOnly}
                placeholder={t('settings', 'addressPlaceholder') || "Abay St, 10"}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">{t('settings', 'website')}</Label>
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
          <CardTitle>{t('settings', 'workingHours')}</CardTitle>
          <CardDescription>{t('settings', 'workingHoursDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="workingHours">{t('settings', 'schedule')}</Label>
            <Input
              id="workingHours"
              {...register("workingHours")}
              disabled={readOnly}
              placeholder={t('settings', 'schedulePlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Брендинг */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings', 'branding')}</CardTitle>
          <CardDescription>
            {t('settings', 'brandingDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">{t('settings', 'logoUrl')}</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="logoUrl"
                type="url"
                {...register("logoUrl")}
                disabled={readOnly}
                placeholder="https://i.imgur.com/…"
              />
              {!readOnly && (
                <div className="flex items-center">
                  <Label
                    htmlFor="logoFile"
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    {logoUploading ? t('common', 'saving') : (t('settings', 'uploadLogo') ?? 'Загрузить')}
                  </Label>
                  <input
                    id="logoFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFileChange}
                    disabled={logoUploading}
                  />
                </div>
              )}
            </div>
            <FieldError msg={fieldErrors.logoUrl} />
            <UrlPreview url={logoValue} alt={t('settings', 'logoPreview')} />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="coverUrl">{t('settings', 'coverUrl')}</Label>
            <Input
              id="coverUrl"
              type="url"
              {...register("coverUrl")}
              disabled={readOnly}
              placeholder="https://i.imgur.com/…"
            />
            <FieldError msg={fieldErrors.coverUrl} />
            <UrlPreview url={coverValue} alt={t('settings', 'coverPreview')} />
          </div>
        </CardContent>
      </Card>

      {/* Социальные сети */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings', 'social')}</CardTitle>
          <CardDescription>{t('settings', 'socialDesc')}</CardDescription>
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
                placeholder={t('settings', 'instagramPlaceholder')}
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

      {/* Telegram уведомления */}
      <Card>
        <CardHeader>
          <CardTitle>Telegram-уведомления</CardTitle>
          <CardDescription>
            Введите ваш Telegram Chat ID, чтобы получать уведомления о новых записях прямо в Telegram.
            Узнать свой Chat ID можно через бота <span className="font-mono text-xs">@userinfobot</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
            <Input
              id="telegramChatId"
              {...register("telegramChatId")}
              disabled={readOnly}
              placeholder="123456789"
            />
            <p className="text-xs text-muted-foreground">
              Уведомления приходят от бота{' '}
              <a
                href="https://t.me/omni_book_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                @omni_book_bot
              </a>
              . Чтобы активировать доставку, найдите бота в Telegram, нажмите{' '}
              <span className="font-mono">/start</span> и введите полученный ID в это поле.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      {readOnly ? (
        <p className="text-sm text-muted-foreground text-center pb-6">
          {t('dashboard', 'ownerOnly')}
        </p>
      ) : (
        <div className="flex justify-end pb-6">
          <Button type="submit" disabled={loading} className="min-w-32">
            {loading ? t('common', 'saving') : t('common', 'save')}
          </Button>
        </div>
      )}
    </form>
  )
}
