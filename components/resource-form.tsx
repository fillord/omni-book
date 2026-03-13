"use client"

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, X } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createResourceSchema,
  type CreateResourceInput,
  type UpdateResourceInput,
} from '@/lib/validations/resource'
import type { ResourceWithRelations, ScheduleEntry } from '@/lib/actions/resources'
import { getNicheConfig, type AttributeField } from '@/lib/niche/config'
import { useI18n } from '@/lib/i18n/context'

// ---- constants -------------------------------------------------------------

const DAY_KEYS = [
  { value: 1, key: 'mon' },
  { value: 2, key: 'tue' },
  { value: 3, key: 'wed' },
  { value: 4, key: 'thu' },
  { value: 5, key: 'fri' },
  { value: 6, key: 'sat' },
  { value: 0, key: 'sun' },
] as const

// ---- types -----------------------------------------------------------------

type ScheduleState = Record<number, { startTime: string; endTime: string; isActive: boolean }>

type Props = {
  resource?: ResourceWithRelations
  niche?: string
  onSubmit: (data: CreateResourceInput | UpdateResourceInput, schedule: ScheduleEntry[]) => Promise<void>
  disabled?: boolean
}

type Attrs = Record<string, unknown>

// ---- schedule helpers ------------------------------------------------------

function buildDefaultSchedule(niche: string | undefined): ScheduleState {
  let activeDays: number[]
  let startTime: string
  let endTime: string

  switch (niche) {
    case 'beauty':  activeDays = [1,2,3,4,5,6];   startTime = '09:00'; endTime = '19:00'; break
    case 'horeca':  activeDays = [0,1,2,3,4,5,6]; startTime = '10:00'; endTime = '23:00'; break
    case 'sports':  activeDays = [0,1,2,3,4,5,6]; startTime = '07:00'; endTime = '22:00'; break
    case 'medicine':
    default:        activeDays = [1,2,3,4,5];     startTime = '09:00'; endTime = '18:00'; break
  }

  const state: ScheduleState = {}
  for (const { value } of DAY_KEYS) {
    state[value] = { isActive: activeDays.includes(value), startTime, endTime }
  }
  return state
}

function buildScheduleFromExisting(
  schedules: ResourceWithRelations['schedules']
): ScheduleState {
  // Start with all days inactive
  const state: ScheduleState = {}
  for (const { value } of DAY_KEYS) {
    state[value] = { isActive: false, startTime: '09:00', endTime: '18:00' }
  }
  for (const s of schedules) {
    state[s.dayOfWeek] = { isActive: s.isActive, startTime: s.startTime, endTime: s.endTime }
  }
  return state
}

// ---- TagInput helper -------------------------------------------------------

function TagInput({
  values,
  onChange,
  placeholder,
  disabled,
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [input, setInput] = useState('')

  function add() {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          disabled={disabled}
          className="h-8"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={disabled || !input.trim()}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs"
            >
              {v}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- opt label helper ------------------------------------------------------

/** Translates an opt_xxx key via niche section; passes through any other value as-is */
function optLabel(t: (s: string, k: string) => string, val: string): string {
  return val.startsWith('opt_') ? t('niche', val) : val
}

// ---- parseAttrs ------------------------------------------------------------

function parseAttrs(raw: unknown): Attrs {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Attrs
  return {}
}

// ---- AttributeFieldInput ---------------------------------------------------

function AttributeFieldInput({
  field,
  value,
  onChange,
  disabled,
  t,
}: {
  field: AttributeField
  value: unknown
  onChange: (v: unknown) => void
  disabled: boolean
  t: (section: string, key: string) => string
}) {
  switch (field.type) {
    case 'text':
      return (
        <Input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          disabled={disabled}
        />
      )
    case 'number':
      return (
        <Input
          type="number"
          min={0}
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
          disabled={disabled}
        />
      )
    case 'select': {
      const currentLabel = (value as string) ? optLabel(t, value as string) : undefined
      return (
        <Select
          value={(value as string) ?? ''}
          onValueChange={(v) => onChange(v || undefined)}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`${t('form', 'select')} ${t('niche', field.label).toLowerCase()}`}>
              {currentLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{optLabel(t, opt)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    case 'multitext':
      return (
        <TagInput
          values={(value as string[]) ?? []}
          onChange={onChange}
          disabled={disabled}
        />
      )
    case 'checkbox':
      return (
        <div className="flex items-center gap-2 pt-1">
          <input
            id={`attr-${field.key}`}
            type="checkbox"
            checked={(value as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor={`attr-${field.key}`} className="text-sm font-medium">{field.label}</label>
        </div>
      )
    default:
      return null
  }
}

// ---- ResourceForm ----------------------------------------------------------

export function ResourceForm({ resource, niche, onSubmit, disabled = false }: Props) {
  const { t }    = useI18n()
  const isEdit   = !!resource
  const initialAttrs = parseAttrs(resource?.attributes)
  const nicheConfig  = getNicheConfig(niche)

  const DAYS_OF_WEEK = DAY_KEYS.map(({ value, key }) => ({
    value,
    label: t('days', key),
  }))

  const form = useForm<CreateResourceInput & { name_kz?: string, desc_kz?: string, name_en?: string, desc_en?: string }>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      name:        resource?.name ?? '',
      name_kz:     ((resource?.translations as Record<string, Record<string, string>>)?.kz?.name) || '',
      desc_kz:     ((resource?.translations as Record<string, Record<string, string>>)?.kz?.description) || '',
      name_en:     ((resource?.translations as Record<string, Record<string, string>>)?.en?.name) || '',
      desc_en:     ((resource?.translations as Record<string, Record<string, string>>)?.en?.description) || '',
      type:        (resource?.type as CreateResourceInput['type']) ?? nicheConfig.resourceTypes[0]?.value ?? 'staff',
      description: resource?.description ?? '',
      capacity:    resource?.capacity ?? undefined,
    },
  })

  const [attrs, setAttrs] = useState<Attrs>(initialAttrs)
  const [submitting, setSubmitting] = useState(false)

  // Schedule state: pre-fill from existing schedules on edit, or niche defaults on create
  const [schedule, setSchedule] = useState<ScheduleState>(() =>
    resource?.schedules && resource.schedules.length > 0
      ? buildScheduleFromExisting(resource.schedules)
      : buildDefaultSchedule(niche)
  )

  function setAttr(key: string, value: unknown) {
    setAttrs((prev) => ({ ...prev, [key]: value }))
  }

  function updateScheduleDay(
    dayOfWeek: number,
    field: 'isActive' | 'startTime' | 'endTime',
    value: boolean | string
  ) {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: { ...prev[dayOfWeek], [field]: value },
    }))
  }

  const watchedType = form.watch('type')

  const visibleAttrFields = nicheConfig.attributeFields.filter(
    (f) => !f.forTypes || f.forTypes.includes(watchedType)
  )

  async function handleSubmit(values: CreateResourceInput & { name_kz?: string, desc_kz?: string, name_en?: string, desc_en?: string }) {
    setSubmitting(true)
    try {
      const scheduleEntries: ScheduleEntry[] = DAYS_OF_WEEK.map(({ value }) => ({
        dayOfWeek: value,
        ...schedule[value],
      }))
      const translations = {
        en: { name: values.name_en || '', description: values.desc_en || '' },
        kz: { name: values.name_kz || '', description: values.desc_kz || '' },
      }
      await onSubmit({ ...values, attributes: attrs, translations }, scheduleEntries)
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
                    <Input {...field} placeholder={`${t('form', 'namePlaceholder')}${t('niche', nicheConfig.resourceLabel)} №1`} disabled={isDisabled} />
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
                  <FormLabel>{t('form', 'description')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('form', 'descriptionPlaceholder')} disabled={isDisabled} />
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
                    <Input {...field} placeholder={`${t('form', 'namePlaceholder')}${t('niche', nicheConfig.resourceLabel)} №1`} disabled={isDisabled} />
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
                  <FormLabel>{t('form', 'description')} (KZ)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('form', 'descriptionPlaceholder')} disabled={isDisabled} />
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
                    <Input {...field} placeholder={`${t('form', 'namePlaceholder')}${t('niche', nicheConfig.resourceLabel)} №1`} disabled={isDisabled} />
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
                  <FormLabel>{t('form', 'description')} (EN)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('form', 'descriptionPlaceholder')} disabled={isDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {/* Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form', 'type')} <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v)
                    setAttrs({})
                  }}
                  disabled={isDisabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form', 'selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {nicheConfig.resourceTypes.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {t('niche', rt.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />



        {/* Capacity */}
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form', 'concurrentBookings')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic attribute fields */}
        {visibleAttrFields.length > 0 && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('form', 'parameters')} {t('niche', nicheConfig.resourceLabel).toLowerCase()}
            </p>
            {visibleAttrFields.map((field) => (
              <div key={field.key} className="space-y-1">
                {field.type !== 'checkbox' && (
                  <label className="text-sm font-medium">
                    {t('niche', field.label)}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                )}
                <AttributeFieldInput
                  field={field}
                  value={attrs[field.key]}
                  onChange={(v) => setAttr(field.key, v)}
                  disabled={isDisabled}
                  t={t}
                />
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Schedule */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('form', 'schedule')}
          </p>
          {DAYS_OF_WEEK.map(({ value: day, label }) => {
            const entry = schedule[day]
            return (
              <div key={day} className="flex items-center gap-3">
                <input
                  id={`sched-${day}`}
                  type="checkbox"
                  checked={entry?.isActive ?? false}
                  onChange={(e) => updateScheduleDay(day, 'isActive', e.target.checked)}
                  disabled={isDisabled}
                  className="h-4 w-4 shrink-0 rounded border-gray-300"
                />
                <label
                  htmlFor={`sched-${day}`}
                  className="w-6 shrink-0 text-sm font-medium select-none"
                >
                  {label}
                </label>
                {entry?.isActive ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => updateScheduleDay(day, 'startTime', e.target.value)}
                      disabled={isDisabled}
                      className="h-7 w-28 text-sm"
                    />
                    <span className="text-muted-foreground text-sm">—</span>
                    <Input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => updateScheduleDay(day, 'endTime', e.target.value)}
                      disabled={isDisabled}
                      className="h-7 w-28 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{t('form', 'dayOff')}</span>
                )}
              </div>
            )
          })}
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
