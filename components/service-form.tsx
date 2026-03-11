'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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
import {
  createServiceSchema,
  updateServiceSchema,
  DURATION_OPTIONS,
  CURRENCIES,
  type CreateServiceInput,
  type UpdateServiceInput,
} from '@/lib/validations/service'
import type { ServiceWithRelations } from '@/lib/actions/services'
import type { ResourceWithRelations } from '@/lib/actions/resources'
import { RESOURCE_TYPE_LABELS } from '@/lib/validations/resource'

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
  durationMin: string
  price: string
  currency: string
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
  const isEdit = !!service

  // Multi-select resource IDs
  const initialResourceIds = service?.resources.map((rs) => rs.resource.id) ?? []
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>(initialResourceIds)
  const [resourceError, setResourceError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      durationMin: String(service?.durationMin ?? 30),
      price: service?.price != null ? String(service.price / 100) : '',
      currency: service?.currency ?? 'KZT',
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
      setResourceError('Выберите хотя бы один ресурс')
      return
    }

    const parsed = (isEdit ? updateServiceSchema : createServiceSchema).safeParse({
      name: values.name,
      description: values.description || undefined,
      durationMin: parseInt(values.durationMin),
      price: values.price !== '' ? parseInt(values.price) : undefined,
      currency: values.currency || 'KZT',
      resourceIds: selectedResourceIds,
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

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="Первичная консультация" disabled={isDisabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Краткое описание услуги" disabled={isDisabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration + Price + Currency */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="durationMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Длительность <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d} мин
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Цена</FormLabel>
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
                <FormLabel>Валюта</FormLabel>
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

        {/* Resource multi-select */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Ресурсы <span className="text-destructive">*</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Выберите, какие ресурсы оказывают эту услугу
          </p>
          {availableResources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет доступных ресурсов. Сначала создайте ресурс.
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
                Сохранение…
              </span>
            ) : (
              isEdit ? 'Сохранить' : 'Создать'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export { formatPrice }
