'use client'

import { useState } from 'react'
import { Plan, PlanStatus } from '@prisma/client'
import { updateTenantPlan, updateTenantMaxResources, banTenant, deleteTenant } from '@/lib/actions/admin'

export function AdminTenantRow({ tenant }: { tenant: any }) {
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

  return (
    <tr className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${isBanned ? 'bg-red-50/50' : isPending ? 'bg-amber-50/50' : ''}`}>
      <td className="p-4 align-top">
        <div className="font-medium text-zinc-900">{tenant.name}</div>
        <div className="text-xs text-zinc-500 mt-0.5">{tenant.email} • {tenant.slug}.omnibook.com</div>
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      </td>
      <td className="p-4 align-top">
        <div className="text-sm text-zinc-600">{new Date(tenant.createdAt).toLocaleDateString('ru-RU')}</div>
      </td>
      <td className="p-4 align-top text-sm">
        <select
          className="border border-zinc-200 rounded px-2 py-1 bg-white disabled:opacity-50 w-full mb-2"
          value={tenant.plan}
          disabled={loading}
          onChange={(e) => handlePlanChange(e.target.value as Plan)}
        >
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>

        <select
          className={`border rounded px-2 py-1 disabled:opacity-50 w-full text-xs font-semibold ${
            isBanned ? 'bg-red-100 border-red-200 text-red-700' :
            isPending ? 'bg-amber-100 border-amber-200 text-amber-800' :
            tenant.planStatus === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            'bg-zinc-100 border-zinc-200 text-zinc-600'
          }`}
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
          className="w-20 border border-zinc-200 rounded px-2 py-1 bg-white disabled:opacity-50 text-sm"
        />
      </td>
      <td className="p-4 align-top text-sm">
        {tenant._count.resources}
      </td>
      <td className="p-4 align-top">
        <div className="flex flex-col gap-2">
          {!isBanned && (
            <button
              onClick={handleBan}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 transition-colors font-medium"
            >
              Забанить
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors font-medium"
          >
            Удалить
          </button>
        </div>
      </td>
    </tr>
  )
}
