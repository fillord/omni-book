import { basePrisma } from '@/lib/db'
import { AdminTenantRow } from './admin-tenant-row'

export default async function AdminTenantsPage() {
  const tenants = await basePrisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { resources: true }
      },
      users: {
        where: { role: 'OWNER' },
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Управление компаниями</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Список всех зарегистрированных бизнесов на платформе.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Компания</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Владелец</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Регистрация</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-48">Тариф и Статус</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Лимит ресурсов</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Текущих ресурсов</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => (
                <AdminTenantRow key={tenant.id} tenant={tenant} />
              ))}
              
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                    Нет зарегистрированных компаний
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
