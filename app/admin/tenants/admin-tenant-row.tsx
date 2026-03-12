'use client'

import { useState } from 'react'
import { Plan, PlanStatus } from '@prisma/client'
import { updateTenantPlan, updateTenantMaxResources } from '@/lib/actions/admin'

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

  const isPending = tenant.planStatus === 'PENDING'

  return (
    <tr className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${isPending ? 'bg-amber-50/50' : ''}`}>
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
    </tr>
  )
}
