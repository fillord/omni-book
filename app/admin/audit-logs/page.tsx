import { basePrisma } from '@/lib/db'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { AuditLogFilters } from './audit-log-filters'

const EVENT_LABELS: Record<string, string> = {
  login: 'Вход',
  plan_upgrade: 'Повышение тарифа',
  plan_downgrade: 'Понижение тарифа',
  service_deleted: 'Удаление услуги',
  resource_deleted: 'Удаление ресурса',
  staff_deleted: 'Удаление сотрудника',
}

const REASON_LABELS: Record<string, string> = {
  subscription_expired: 'Истечение подписки',
  manual_downgrade: 'Ручной перевод',
  plan_change: 'Смена тарифа',
}

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Бесплатный',
  PRO: 'PRO',
  ENTERPRISE: 'Enterprise',
}

const ACTIVATED_BY_LABELS: Record<string, string> = {
  superadmin: 'Администратор',
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string') return String(value)
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

type DetailParts = { label: string; value: string }[]

function parseDetailParts(d: Record<string, unknown>): DetailParts | null {
  const parts: DetailParts = []

  if (d.oldPlan && d.newPlan) {
    const from = PLAN_LABELS[d.oldPlan as string] ?? d.oldPlan as string
    const to = PLAN_LABELS[d.newPlan as string] ?? d.newPlan as string
    parts.push({ label: 'Изменение', value: `${from} → ${to}` })
  }
  if (d.reason) {
    parts.push({ label: 'Причина', value: REASON_LABELS[d.reason as string] ?? d.reason as string })
  }
  if (d.previousPlan) {
    parts.push({ label: 'Предыдущий план', value: PLAN_LABELS[d.previousPlan as string] ?? d.previousPlan as string })
  }
  if (d.activatedBy) {
    parts.push({ label: 'Активировал', value: ACTIVATED_BY_LABELS[d.activatedBy as string] ?? d.activatedBy as string })
  }
  if (d.newExpiry) {
    parts.push({ label: 'Истекает', value: formatDate(d.newExpiry) })
  }
  if (d.serviceName) parts.push({ label: 'Услуга', value: d.serviceName as string })
  if (d.resourceName) parts.push({ label: 'Ресурс', value: d.resourceName as string })
  if (d.staffEmail) parts.push({ label: 'Сотрудник', value: d.staffEmail as string })
  if (d.email) parts.push({ label: 'Email', value: d.email as string })

  return parts.length > 0 ? parts : null
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; event?: string; from?: string; to?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const pageSize = 50

  const where: Record<string, unknown> = {}
  if (params.tenant) where.tenantId = params.tenant
  if (params.event) where.eventType = params.event

  // Date range filter — filter by tenant, event type, date range
  if (params.from || params.to) {
    const createdAt: Record<string, Date> = {}
    if (params.from) {
      createdAt.gte = new Date(params.from + 'T00:00:00.000Z')
    }
    if (params.to) {
      createdAt.lte = new Date(params.to + 'T23:59:59.999Z')
    }
    where.createdAt = createdAt
  }

  const [logs, total, tenants] = await Promise.all([
    basePrisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { tenant: { select: { name: true, slug: true } } },
    }),
    basePrisma.auditLog.count({ where }),
    basePrisma.tenant.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams()
    if (params.tenant) sp.set('tenant', params.tenant)
    if (params.event) sp.set('event', params.event)
    if (params.from) sp.set('from', params.from)
    if (params.to) sp.set('to', params.to)
    sp.set('page', String(p))
    return `/admin/audit-logs?${sp.toString()}`
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 neu-raised bg-[var(--neu-bg)] rounded-xl flex items-center justify-center">
          <FileText size={20} className="text-neu-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Логи действий</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Аудит критических событий: входы, смена тарифов, удаления данных.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="neu-raised bg-[var(--neu-bg)] rounded-xl p-4">
        <AuditLogFilters
          tenants={tenants}
          currentTenant={params.tenant || ''}
          currentEvent={params.event || ''}
          currentFrom={params.from || ''}
          currentTo={params.to || ''}
        />
      </div>

      {/* Table */}
      <div className="neu-raised bg-[var(--neu-bg)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="neu-inset bg-[var(--neu-bg)]">
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Дата</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Компания</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Событие</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Детали</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-transparent hover:bg-[var(--neu-bg)] transition-colors">
                  <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-4 text-sm font-medium text-foreground">
                    {log.tenant?.name ?? log.tenantId}
                  </td>
                  <td className="p-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium neu-inset bg-[var(--neu-bg)] text-foreground">
                      {EVENT_LABELS[log.eventType] ?? log.eventType}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {(() => {
                      if (!log.details || typeof log.details !== 'object') return '—'
                      const parts = parseDetailParts(log.details as Record<string, unknown>)
                      if (!parts) return '—'
                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {parts.map(({ label, value }) => (
                            <span
                              key={label}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs neu-inset bg-[var(--neu-bg)]"
                            >
                              <span className="text-muted-foreground/70">{label}:</span>
                              <span className="text-foreground font-medium">{value}</span>
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">
                    Нет записей по заданным фильтрам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Страница {page} из {totalPages} ({total} записей)
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                className="px-4 py-2 rounded-lg text-sm neu-raised bg-[var(--neu-bg)] text-foreground hover:text-neu-accent transition-colors"
              >
                ← Назад
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-4 py-2 rounded-lg text-sm neu-raised bg-[var(--neu-bg)] text-foreground hover:text-neu-accent transition-colors"
              >
                Вперёд →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
