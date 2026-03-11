import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// ---- types ----------------------------------------------------------------

type ResourceAttributes = {
  specialization?: string
  license?: string
  experience_years?: number
  capacity?: number
  floor?: number
  equipment?: string[]
  [key: string]: unknown
}

// ---- helpers ---------------------------------------------------------------

const NICHE_LABELS: Record<string, string> = {
  medicine: 'Медицина',
  beauty: 'Красота',
  horeca: 'HoReCa',
  sports: 'Спорт и досуг',
}

const TYPE_LABELS: Record<string, string> = {
  staff: 'Сотрудник',
  room: 'Кабинет',
  court: 'Корт',
  table: 'Столик',
  other: 'Другое',
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price / 100)
}

function parseAttributes(raw: unknown): ResourceAttributes {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as ResourceAttributes
  }
  return {}
}

// ---- data ------------------------------------------------------------------

async function getDashboardData(tenantId: string) {
  return basePrisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      resources: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
      services: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { bookings: true, users: true },
      },
    },
  })
}

// ---- page ------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) redirect('/login')

  const tenant = await getDashboardData(session.user.tenantId)
  if (!tenant) redirect('/login')
  const attrs = tenant.resources.map((r) => parseAttributes(r.attributes))

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {NICHE_LABELS[tenant.niche ?? ''] ?? tenant.niche} · Тариф:{' '}
            <span className="font-medium capitalize">{tenant.plan}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/${tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Публичная страница ↗
          </a>
          <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
            {tenant.isActive ? 'Активен' : 'Неактивен'}
          </Badge>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Ресурсов" value={tenant.resources.length} />
        <StatCard label="Услуг" value={tenant.services.length} />
        <StatCard label="Бронирований" value={tenant._count.bookings} />
        <StatCard label="Пользователей" value={tenant._count.users} />
      </div>

      {/* Resources table */}
      <Card>
        <CardHeader>
          <CardTitle>Ресурсы</CardTitle>
          <CardDescription>Ресурсы, доступные для бронирования</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Специализация / Оборудование</TableHead>
                <TableHead>Лицензия</TableHead>
                <TableHead className="text-right">Опыт (лет)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenant.resources.map((resource, i) => {
                const a = attrs[i]
                return (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TYPE_LABELS[resource.type] ?? resource.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.specialization ?? (a.equipment ? (a.equipment as string[]).join(', ') : '—')}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {a.license ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.experience_years ?? '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Services table */}
      <Card>
        <CardHeader>
          <CardTitle>Услуги</CardTitle>
          <CardDescription>Услуги, доступные для бронирования</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Услуга</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right">Длительность</TableHead>
                <TableHead className="text-right">Цена</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenant.services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {service.description ?? '—'}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {service.durationMin} мин
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatPrice(service.price, service.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}

// ---- sub-components --------------------------------------------------------

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
