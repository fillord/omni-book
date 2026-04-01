"use client"

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Minus, Plus } from 'lucide-react'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createServiceSchema,
  updateServiceSchema,
  CURRENCIES,
  type CreateServiceInput,
  type UpdateServiceInput,
} from '@/lib/validations/service'
import type { ServiceWithRelations } from '@/lib/actions/services'
import type { ResourceWithRelations } from '@/lib/actions/resources'
import { RESOURCE_TYPE_LABELS } from '@/lib/validations/resource'
import { useI18n } from '@/lib/i18n/context'

// ---- props -----------------------------------------------------------------

type Props = {
  service?: ServiceWithRelations
  availableResources: ResourceWithRelations[]
  onSubmit: (data: CreateServiceInput | UpdateServiceInput) => Promise<void>
  disabled?: boolean
}

// ---- form values type ------------------------------------------------------

type FormValues = {
  name: string
  description: string
  name_kz?: string
  desc_kz?: string
  name_en?: string
  desc_en?: string
  durationMin: string
  price: string
  currency: string
  depositAmount: string
}

// ---- helpers ---------------------------------------------------------------

function formatPrice(price: number | null | undefined, currency: string): string {
  if (price == null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price / 100)
}

// ---- ServiceForm -----------------------------------------------------------

export function ServiceForm({ service, availableResources, onSubmit, disabled = false }: Props) {
  const { t } = useI18n()
  const isEdit = !!service

  // Multi-select resource IDs
  const initialResourceIds = service?.resources.map((rs) => rs.resource.id) ?? []
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>(initialResourceIds)
  const [resourceError, setResourceError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [requireDeposit, setRequireDeposit] = useState<boolean>(
    (service as unknown as { requireDeposit?: boolean })?.requireDeposit ?? false
  )

  const form = useForm<FormValues>({
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      name_kz: ((service?.translations as Record<string, Record<string, string>>)?.kz?.name) || '',
      desc_kz: ((service?.translations as Record<string, Record<string, string>>)?.kz?.description) || '',
      name_en: ((service?.translations as Record<string, Record<string, string>>)?.en?.name) || '',
      desc_en: ((service?.translations as Record<string, Record<string, string>>)?.en?.description) || '',
      durationMin: String(service?.durationMin ?? 30),
      price: service?.price != null ? String(service.price / 100) : '',
      currency: service?.currency ?? 'KZT',
      depositAmount: (service as unknown as { depositAmount?: number | null })?.depositAmount != null
        ? String(((service as unknown as { depositAmount: number }).depositAmount) / 100)
        : '',
    },
  })

  function toggleResource(id: string) {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setResourceError(null)
  }

  async function handleSubmit(values: FormValues) {
    if (selectedResourceIds.length === 0) {
      setResourceError(t('form', 'selectResource'))
      return
    }

    const depositAmountTiyn = requireDeposit && values.depositAmount !== ''
      ? Math.round(parseFloat(values.depositAmount) * 100)
      : undefined

    const parsed = (isEdit ? updateServiceSchema : createServiceSchema).safeParse({
      name: values.name,
      description: values.description || undefined,
      durationMin: parseInt(values.durationMin),
      price: values.price !== '' ? parseInt(values.price) : undefined,
      currency: values.currency || 'KZT',
      resourceIds: selectedResourceIds,
      translations: {
        en: { name: values.name_en || '', description: values.desc_en || '' },
        kz: { name: values.name_kz || '', description: values.desc_kz || '' },
      },
      requireDeposit,
      depositAmount: depositAmountTiyn,
    })

    if (!parsed.success) {
      // Trigger react-hook-form field errors for name
      const nameErr = parsed.error.issues.find((i) => i.path[0] === 'name')
      if (nameErr) form.setError('name', { message: nameErr.message })
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(parsed.data)
    } finally {
      setSubmitting(false)
    }
  }

  const isDisabled = disabled || submitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

        <Tabs defaultValue="ru" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="ru">RU (Основной)</TabsTrigger>
            <TabsTrigger value="kz">Қазақша</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>

          <TabsContent value="ru" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form', 'name')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('form', 'serviceNamePlaceholder')} disabled={isDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form', 'serviceDesc')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('form', 'serviceDescPlaceholder')} disabled={isDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="kz" className="space-y-4">
            <FormField
              control={form.control}
              name="name_kz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form', 'name')} (KZ)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('form', 'serviceNamePlaceholder')} disabled={isDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="desc_kz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form', 'serviceDesc')} (KZ)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('form', 'serviceDescPlaceholder')} disabled={isDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="en" className="space-y-4">
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form', 'name')} (EN)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('form', 'serviceNamePlaceholder')} disabled={isDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="desc_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form', 'serviceDesc')} (EN)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('form', 'serviceDescPlaceholder')} disabled={isDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {/* Duration + Price + Currency */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="durationMin"
            render={({ field }) => {
              const numVal = Math.max(1, Math.min(1440, parseInt(field.value) || 1))
              return (
                <FormItem>
                  <FormLabel>{t('form', 'duration')} <span className="text-destructive">*</span></FormLabel>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => field.onChange(String(Math.max(1, numVal - 1)))}
                        disabled={isDisabled || numVal <= 1}
                      >
                        <Minus />
                      </Button>
                      <div className="relative min-w-0 flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={1}
                            max={1440}
                            className="w-full pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            disabled={isDisabled}
                          />
                        </FormControl>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          min
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => field.onChange(String(Math.min(1440, numVal + 1)))}
                        disabled={isDisabled || numVal >= 1440}
                      >
                        <Plus />
                      </Button>
                    </div>
                    <div className="flex gap-1.5">
                      {[15, 30, 60].map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => field.onChange(String(preset))}
                          disabled={isDisabled}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form', 'price')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    placeholder="0"
                    disabled={isDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form', 'currency')}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Deposit settings */}
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Требует предоплату</p>
              <p className="text-xs text-muted-foreground mt-0.5">Клиент оплачивает депозит через Kaspi перед подтверждением записи</p>
            </div>
            {/* Neumorphic toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={requireDeposit}
              onClick={() => setRequireDeposit((prev) => !prev)}
              disabled={isDisabled}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                requireDeposit ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 border border-gray-200 dark:border-gray-500',
                  requireDeposit ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>

          {requireDeposit && (
            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма предоплаты (KZT)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        placeholder="5000"
                        disabled={isDisabled}
                        className="pr-16"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ₸
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Resource multi-select */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {t('form', 'resources')} <span className="text-destructive">*</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t('form', 'resourcesHint')}
          </p>
          {availableResources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('form', 'noResources')}
            </p>
          ) : (
            <div className="grid gap-2 rounded-lg border p-3 max-h-48 overflow-y-auto">
              {availableResources
                .filter((r) => r.isActive)
                .map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2.5 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedResourceIds.includes(r.id)}
                      onChange={() => toggleResource(r.id)}
                      disabled={isDisabled}
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                    />
                    <span className="flex-1 text-sm">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {RESOURCE_TYPE_LABELS[r.type as keyof typeof RESOURCE_TYPE_LABELS] ?? r.type}
                    </span>
                  </label>
                ))}
            </div>
          )}
          {resourceError && (
            <p className="text-sm text-destructive">{resourceError}</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isDisabled} className="min-w-28">
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common', 'saving')}
              </span>
            ) : (
              isEdit ? t('common', 'save') : t('common', 'create')
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export { formatPrice }
