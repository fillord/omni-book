'use client'

import { useRouter } from 'next/navigation'

interface Props {
  tenants: { id: string; name: string }[]
  currentTenant: string
  currentEvent: string
  currentFrom: string
  currentTo: string
}

export function AuditLogFilters({ tenants, currentTenant, currentEvent, currentFrom, currentTo }: Props) {
  const router = useRouter()

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = { tenant: currentTenant, event: currentEvent, from: currentFrom, to: currentTo, ...updates }
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={currentTenant}
        onChange={(e) => updateFilters({ tenant: e.target.value })}
        className="neu-inset bg-[var(--neu-bg)] rounded-lg px-3 py-2 text-sm text-foreground"
      >
        <option value="">Все компании</option>
        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <select
        value={currentEvent}
        onChange={(e) => updateFilters({ event: e.target.value })}
        className="neu-inset bg-[var(--neu-bg)] rounded-lg px-3 py-2 text-sm text-foreground"
      >
        <option value="">Все события</option>
        <option value="login">Вход</option>
        <option value="plan_upgrade">Повышение тарифа</option>
        <option value="plan_downgrade">Понижение тарифа</option>
        <option value="service_deleted">Удаление услуги</option>
        <option value="resource_deleted">Удаление ресурса</option>
        <option value="staff_deleted">Удаление сотрудника</option>
      </select>
      <input
        type="date"
        value={currentFrom}
        onChange={(e) => updateFilters({ from: e.target.value })}
        className="neu-inset bg-[var(--neu-bg)] rounded-lg px-3 py-2 text-sm text-foreground"
        placeholder="С даты"
      />
      <input
        type="date"
        value={currentTo}
        onChange={(e) => updateFilters({ to: e.target.value })}
        className="neu-inset bg-[var(--neu-bg)] rounded-lg px-3 py-2 text-sm text-foreground"
        placeholder="По дату"
      />
    </div>
  )
}
