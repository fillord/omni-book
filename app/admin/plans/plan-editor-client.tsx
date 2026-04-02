'use client'

import { useState, useTransition } from 'react'
import { updateSubscriptionPlan } from '@/lib/actions/admin-plans'
import { Plan } from '@prisma/client'

interface SerializedSubscriptionPlan {
  id: string
  plan: Plan
  displayName: string
  maxResources: number
  priceMonthly: number
  priceYearly: number
  pricePerResource: number
  isActive: boolean
  features: string[]
  createdAt: string
  updatedAt: string
}

interface EditData {
  displayName?: string
  maxResources?: number
  priceMonthly?: number
  priceYearly?: number
  pricePerResource?: number
}

const PLAN_LABELS: Record<Plan, string> = {
  FREE: 'FREE',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
}

const PLAN_BADGE_COLORS: Record<Plan, string> = {
  FREE: 'bg-muted text-muted-foreground',
  PRO: 'bg-primary/10 text-primary',
  ENTERPRISE: 'bg-neu-accent/10 text-neu-accent',
}

export function PlanEditorClient({ plans }: { plans: SerializedSubscriptionPlan[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditData>({})
  const [saveMessage, setSaveMessage] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const startEdit = (plan: SerializedSubscriptionPlan) => {
    setEditingId(plan.id)
    setEditData({
      displayName: plan.displayName,
      maxResources: plan.maxResources,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      pricePerResource: plan.pricePerResource,
    })
    setSaveMessage(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({})
    setSaveMessage(null)
  }

  const saveEdit = (planId: string) => {
    startTransition(async () => {
      const result = await updateSubscriptionPlan(planId, editData)
      if (result.success) {
        setSaveMessage({ id: planId, type: 'success', text: 'Сохранено' })
        setEditingId(null)
        setEditData({})
      } else {
        setSaveMessage({ id: planId, type: 'error', text: result.error ?? 'Ошибка сохранения' })
      }
    })
  }

  const formatPrice = (price: number) => {
    if (price === -1) return 'Динамический'
    return price.toLocaleString('ru-RU') + ' ₸'
  }

  return (
    <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-4 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-border/50">
            <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тариф</th>
            <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
            <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Макс. ресурсов</th>
            <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цена / мес</th>
            <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цена / год</th>
            <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">За ресурс</th>
            <th className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действия</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan, idx) => {
            const isEditing = editingId === plan.id
            const rowClass = idx % 2 === 0 ? 'bg-[var(--neu-bg)]' : 'bg-muted/10'

            return (
              <tr key={plan.id} className={rowClass}>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PLAN_BADGE_COLORS[plan.plan]}`}>
                    {PLAN_LABELS[plan.plan]}
                  </span>
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.displayName ?? ''}
                      onChange={e => setEditData(d => ({ ...d, displayName: e.target.value }))}
                      className="neu-inset bg-[var(--neu-bg)] rounded px-2 py-1 text-sm w-36 outline-none"
                    />
                  ) : (
                    <span className="text-sm">{plan.displayName}</span>
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      value={editData.maxResources ?? 0}
                      onChange={e => setEditData(d => ({ ...d, maxResources: parseInt(e.target.value, 10) }))}
                      className="neu-inset bg-[var(--neu-bg)] rounded px-2 py-1 text-sm w-24 outline-none"
                    />
                  ) : (
                    <span className="text-sm">{plan.maxResources}</span>
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      type="number"
                      min={-1}
                      value={editData.priceMonthly ?? 0}
                      onChange={e => setEditData(d => ({ ...d, priceMonthly: parseInt(e.target.value, 10) }))}
                      className="neu-inset bg-[var(--neu-bg)] rounded px-2 py-1 text-sm w-28 outline-none"
                    />
                  ) : (
                    <span className="text-sm">{formatPrice(plan.priceMonthly)}</span>
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      type="number"
                      min={-1}
                      value={editData.priceYearly ?? 0}
                      onChange={e => setEditData(d => ({ ...d, priceYearly: parseInt(e.target.value, 10) }))}
                      className="neu-inset bg-[var(--neu-bg)] rounded px-2 py-1 text-sm w-28 outline-none"
                    />
                  ) : (
                    <span className="text-sm">{formatPrice(plan.priceYearly)}</span>
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      value={editData.pricePerResource ?? 0}
                      onChange={e => setEditData(d => ({ ...d, pricePerResource: parseInt(e.target.value, 10) }))}
                      className="neu-inset bg-[var(--neu-bg)] rounded px-2 py-1 text-sm w-28 outline-none"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {plan.plan === 'ENTERPRISE' ? formatPrice(plan.pricePerResource) : '—'}
                    </span>
                  )}
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(plan.id)}
                          disabled={isPending}
                          className="neu-raised rounded px-3 py-1 text-sm font-medium text-primary hover:opacity-80 disabled:opacity-50 transition-opacity"
                        >
                          {isPending ? '...' : 'Сохранить'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isPending}
                          className="neu-raised rounded px-3 py-1 text-sm font-medium text-muted-foreground hover:opacity-80 disabled:opacity-50 transition-opacity"
                        >
                          Отмена
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(plan)}
                        className="neu-raised rounded px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Изменить
                      </button>
                    )}
                    {saveMessage?.id === plan.id && (
                      <span className={`text-xs ${saveMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                        {saveMessage.text}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}

          {plans.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                Нет тарифных планов. Запустите seed-plans.ts для инициализации.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
