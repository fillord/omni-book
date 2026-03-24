import { basePrisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SendNotificationForm } from './send-notification-form'

export default async function TenantDetailPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params

  const [tenant, services, resources, staff] = await Promise.all([
    basePrisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        planStatus: true,
        email: true,
        phone: true,
        createdAt: true,
        niche: true,
      },
    }),
    basePrisma.service.findMany({
      where: { tenantId },
      select: { id: true, name: true, durationMin: true, price: true, currency: true, isActive: true },
      orderBy: { name: 'asc' },
    }),
    basePrisma.resource.findMany({
      where: { tenantId },
      select: { id: true, name: true, type: true, capacity: true, isActive: true },
      orderBy: { name: 'asc' },
    }),
    basePrisma.user.findMany({
      where: { tenantId, role: { in: ['OWNER', 'STAFF'] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!tenant) notFound()

  const planLabels: Record<string, string> = {
    FREE: 'Free',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
  }

  const statusStyles: Record<string, string> = {
    ACTIVE: 'text-emerald-400',
    PENDING: 'text-amber-500',
    EXPIRED: 'text-muted-foreground',
    BANNED: 'text-destructive',
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Активен',
    PENDING: 'Ожидает оплаты',
    EXPIRED: 'Истёк',
    BANNED: 'Заблокирован',
  }

  const roleLabels: Record<string, string> = {
    OWNER: 'Владелец',
    STAFF: 'Персонал',
    CUSTOMER: 'Клиент',
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/admin/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к списку
      </Link>

      {/* Header */}
      <div className="neu-raised bg-[var(--neu-bg)] rounded-xl p-6 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{tenant.name}</h1>
          <span className="text-xs px-2 py-0.5 rounded-md neu-inset bg-[var(--neu-bg)] text-muted-foreground font-medium">
            {planLabels[tenant.plan] ?? tenant.plan}
          </span>
          <span className={`text-xs font-semibold ${statusStyles[tenant.planStatus] ?? 'text-foreground'}`}>
            {statusLabels[tenant.planStatus] ?? tenant.planStatus}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {tenant.slug}.omnibook.com
          {tenant.email && ` • ${tenant.email}`}
          {tenant.phone && ` • ${tenant.phone}`}
          {tenant.niche && ` • ${tenant.niche}`}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="neu-inset bg-[var(--neu-bg)]">
          <TabsTrigger value="services">Услуги ({services.length})</TabsTrigger>
          <TabsTrigger value="resources">Ресурсы ({resources.length})</TabsTrigger>
          <TabsTrigger value="staff">Персонал ({staff.length})</TabsTrigger>
        </TabsList>

        {/* Services tab */}
        <TabsContent value="services">
          <div className="neu-raised bg-[var(--neu-bg)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="neu-inset bg-[var(--neu-bg)]">
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Длительность</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цена</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                        Нет данных
                      </td>
                    </tr>
                  ) : (
                    services.map((service) => (
                      <tr key={service.id} className="transition-colors">
                        <td className="p-4 text-sm text-foreground font-medium">{service.name}</td>
                        <td className="p-4 text-sm text-foreground">{service.durationMin} мин</td>
                        <td className="p-4 text-sm text-foreground">
                          {service.price != null
                            ? `${(service.price / 100).toLocaleString('ru-RU')} ${service.currency}`
                            : '—'}
                        </td>
                        <td className="p-4 text-sm">
                          <span className={`inline-flex items-center gap-1.5 ${service.isActive ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                            <span className={`h-2 w-2 rounded-full ${service.isActive ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                            {service.isActive ? 'Активна' : 'Неактивна'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Resources tab */}
        <TabsContent value="resources">
          <div className="neu-raised bg-[var(--neu-bg)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="neu-inset bg-[var(--neu-bg)]">
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тип</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Вместимость</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                        Нет данных
                      </td>
                    </tr>
                  ) : (
                    resources.map((resource) => (
                      <tr key={resource.id} className="transition-colors">
                        <td className="p-4 text-sm text-foreground font-medium">{resource.name}</td>
                        <td className="p-4 text-sm text-foreground">{resource.type}</td>
                        <td className="p-4 text-sm text-foreground">{resource.capacity ?? '—'}</td>
                        <td className="p-4 text-sm">
                          <span className={`inline-flex items-center gap-1.5 ${resource.isActive ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                            <span className={`h-2 w-2 rounded-full ${resource.isActive ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                            {resource.isActive ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Staff tab */}
        <TabsContent value="staff">
          <div className="neu-raised bg-[var(--neu-bg)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="neu-inset bg-[var(--neu-bg)]">
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Имя</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Роль</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-sm text-muted-foreground">
                        Нет данных
                      </td>
                    </tr>
                  ) : (
                    staff.map((member) => (
                      <tr key={member.id} className="transition-colors">
                        <td className="p-4 text-sm text-foreground font-medium">{member.name || '—'}</td>
                        <td className="p-4 text-sm text-foreground">{member.email}</td>
                        <td className="p-4 text-sm text-foreground">{roleLabels[member.role] ?? member.role}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Send Notification */}
      <div className="neu-raised bg-[var(--neu-bg)] rounded-xl p-6 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Отправить уведомление</h2>
        <SendNotificationForm tenantId={tenantId} />
      </div>
    </div>
  )
}
