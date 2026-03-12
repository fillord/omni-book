import { PrismaClient } from '@prisma/client'
import { AdminTenantRow } from './admin-tenant-row'

const prisma = new PrismaClient()

export default async function AdminTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { resources: true }
      }
    }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Управление компаниями</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Список всех зарегистрированных бизнесов на платформе.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200">
                <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Компания</th>
                <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Регистрация</th>
                <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-48">Тариф и Статус</th>
                <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Лимит ресурсов</th>
                <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Текущих ресурсов</th>
                <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => (
                <AdminTenantRow key={tenant.id} tenant={tenant} />
              ))}
              
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-sm">
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
