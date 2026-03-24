'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plan, PlanStatus } from '@prisma/client'
import { updateTenantPlan, updateTenantMaxResources, banTenant, deleteTenant } from '@/lib/actions/admin'

interface Tenant {
  id: string
  name: string
  slug: string
  email: string | null
  plan: Plan
  planStatus: PlanStatus
  maxResources: number
  createdAt: Date | string
  _count: {
    resources: number
  }
  users: {
    name: string | null
    email: string
    phone: string | null
  }[]
}

export function AdminTenantRow({ tenant }: { tenant: Tenant }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePlanChange = async (newPlan: Plan) => {
    setLoading(true)
    setError('')
    const res = await updateTenantPlan(tenant.id, newPlan, tenant.planStatus)
    if (res?.error) setError(res.error)
    setLoading(false)
  }

  const handleStatusChange = async (newStatus: PlanStatus) => {
    setLoading(true)
    setError('')
    const res = await updateTenantPlan(tenant.id, tenant.plan as Plan, newStatus)
    if (res?.error) setError(res.error)
    setLoading(false)
  }

  const handleMaxResourcesChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (isNaN(val) || val === tenant.maxResources) return

    setLoading(true)
    setError('')
    const res = await updateTenantMaxResources(tenant.id, val)
    if (res?.error) {
      setError(res.error)
      e.target.value = tenant.maxResources.toString()
    }
    setLoading(false)
  }

  const handleBan = async () => {
    setLoading(true)
    setError('')
    const res = await banTenant(tenant.id)
    if (res?.error) setError(res.error)
    setLoading(false)
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Удалить компанию "${tenant.name}"?\n\nЭто действие необратимо — удалятся все ресурсы, услуги, бронирования и пользователи.`
    )
    if (!confirmed) return

    setLoading(true)
    setError('')
    const res = await deleteTenant(tenant.id)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
    // При успехе строка исчезнет после revalidatePath
  }

  const isBanned = tenant.planStatus === 'BANNED'
  const isPending = tenant.planStatus === 'PENDING'
  const owner = tenant.users[0]

  return (
    <tr
      className={[
        'transition-colors',
        isBanned ? 'opacity-60' : isPending ? 'opacity-80' : '',
      ].join(' ')}
    >
      <td className="p-4 align-top">
        <Link
          href={`/admin/tenants/${tenant.id}`}
          className="font-medium text-foreground hover:text-neu-accent transition-colors underline-offset-2 hover:underline"
        >
          {tenant.name}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">{tenant.email} • {tenant.slug}.omnibook.com</div>
        {error && <div className="text-xs text-destructive mt-1">{error}</div>}
      </td>
      <td className="p-4 align-top">
        {owner ? (
          <div className="space-y-0.5 text-sm">
            <p className="font-medium text-foreground truncate">
              {owner.name || '—'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {owner.email}
            </p>
            {owner.phone && (
              <p className="text-xs text-muted-foreground truncate">
                {owner.phone}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Владелец не назначен
          </p>
        )}
      </td>
      <td className="p-4 align-top">
        <div className="text-sm text-muted-foreground">{new Date(tenant.createdAt).toLocaleDateString('ru-RU')}</div>
      </td>
      <td className="p-4 align-top text-sm">
        <select
          className="neu-inset bg-[var(--neu-bg)] border-0 rounded px-2 py-1 text-foreground disabled:opacity-50 w-full mb-2"
          value={tenant.plan}
          disabled={loading}
          onChange={(e) => handlePlanChange(e.target.value as Plan)}
        >
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>

        <select
          className={[
            'neu-inset bg-[var(--neu-bg)] border-0 rounded px-2 py-1 disabled:opacity-50 w-full text-xs font-semibold',
            isBanned ? 'text-destructive' :
            isPending ? 'text-amber-500' :
            tenant.planStatus === 'ACTIVE' ? 'text-emerald-400 [filter:drop-shadow(0_0_4px_currentColor)]' :
            'text-foreground',
          ].join(' ')}
          value={tenant.planStatus}
          disabled={loading}
          onChange={(e) => handleStatusChange(e.target.value as PlanStatus)}
        >
          <option value="ACTIVE">Активен</option>
          <option value="PENDING">Ожидает оплаты</option>
          <option value="EXPIRED">Истёк / Отменён</option>
          <option value="BANNED">Заблокирован</option>
        </select>
      </td>
      <td className="p-4 align-top">
        <input
          type="number"
          min="1"
          defaultValue={tenant.maxResources}
          onBlur={handleMaxResourcesChange}
          disabled={loading}
          className="w-20 neu-inset bg-[var(--neu-bg)] border-0 rounded px-2 py-1 text-foreground disabled:opacity-50 text-sm"
        />
      </td>
      <td className="p-4 align-top text-sm text-foreground">
        {tenant._count.resources}
      </td>
      <td className="p-4 align-top">
        <div className="flex flex-col gap-2">
          {!isBanned && (
            <button
              onClick={handleBan}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-md neu-raised bg-[var(--neu-bg)] text-amber-500 hover:text-amber-600 disabled:opacity-50 transition-all duration-300 ease-in-out active:neu-inset font-medium"
            >
              Забанить
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-md neu-raised bg-[var(--neu-bg)] text-destructive hover:text-destructive/80 disabled:opacity-50 transition-all duration-300 ease-in-out active:neu-inset font-medium"
          >
            Удалить
          </button>
        </div>
      </td>
    </tr>
  )
}
