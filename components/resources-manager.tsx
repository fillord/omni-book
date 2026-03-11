'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Pencil, PowerOff, Power, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResourceForm } from '@/components/resource-form'
import {
  createResource,
  updateResource,
  deleteResource,
  toggleResourceActive,
  type ResourceWithRelations,
  type ScheduleEntry,
} from '@/lib/actions/resources'
import { getNicheConfig, type AttributeField } from '@/lib/niche/config'
import type { CreateResourceInput, UpdateResourceInput } from '@/lib/validations/resource'

// ---- props -----------------------------------------------------------------

type Props = {
  resources: ResourceWithRelations[]
  canEdit: boolean
  niche: string
}

// ---- helpers ---------------------------------------------------------------

function getAttrDisplay(resource: ResourceWithRelations, field: AttributeField): string {
  if (field.forTypes && !field.forTypes.includes(resource.type)) return '—'
  const attrs = (
    resource.attributes && typeof resource.attributes === 'object' && !Array.isArray(resource.attributes)
      ? resource.attributes
      : {}
  ) as Record<string, unknown>
  const val = attrs[field.key]
  if (val == null || val === '') return '—'
  if (typeof val === 'boolean')  return val ? 'Да' : 'Нет'
  if (Array.isArray(val))        return val.join(', ') || '—'
  return String(val)
}

// ---- component -------------------------------------------------------------

export function ResourcesManager({ resources, canEdit, niche }: Props) {
  const router   = useRouter()
  const [isPending, startTransition] = useTransition()

  const nicheConfig  = getNicheConfig(niche)
  const attrColumns  = nicheConfig.attributeFields.filter((f) => f.showInTable)

  // filter state
  const [filterType,   setFilterType]   = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // dialog state
  const [createOpen,   setCreateOpen]   = useState(false)
  const [editResource, setEditResource] = useState<ResourceWithRelations | null>(null)

  // inline error / confirmation
  const [actionError,  setActionError]  = useState<string | null>(null)
  const [futureWarning, setFutureWarning] = useState<{ id: string; count: number } | null>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  // ---- filter ---------------------------------------------------------------

  const filtered = resources.filter((r) => {
    if (filterType !== 'all' && r.type !== filterType) return false
    if (filterStatus === 'active'   && !r.isActive) return false
    if (filterStatus === 'inactive' &&  r.isActive) return false
    return true
  })

  // ---- handlers -------------------------------------------------------------

  async function handleCreate(data: CreateResourceInput | UpdateResourceInput, schedule: ScheduleEntry[]) {
    setActionError(null)
    try {
      await createResource(data as CreateResourceInput, schedule)
      setCreateOpen(false)
      refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Ошибка создания')
    }
  }

  async function handleEdit(data: CreateResourceInput | UpdateResourceInput, schedule: ScheduleEntry[]) {
    if (!editResource) return
    setActionError(null)
    try {
      await updateResource(editResource.id, data as UpdateResourceInput, schedule)
      setEditResource(null)
      refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения'
      setActionError(
        msg.includes('Record') || msg.includes('not found')
          ? 'Данные были изменены, обновите страницу'
          : msg
      )
    }
  }

  async function handleToggle(id: string) {
    setActionError(null)
    try {
      await toggleResourceActive(id)
      refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  async function handleDelete(id: string) {
    setActionError(null)
    setFutureWarning(null)
    try {
      await deleteResource(id)
      refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.startsWith('FUTURE_BOOKINGS:')) {
        const count = parseInt(msg.split(':')[1])
        setFutureWarning({ id, count })
      } else {
        setActionError(msg || 'Ошибка удаления')
      }
    }
  }

  // ---- render ---------------------------------------------------------------

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="all">Все типы</option>
            {nicheConfig.resourceTypes.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => { setActionError(null); setCreateOpen(true) }}>
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Добавить {nicheConfig.resourceLabel.toLowerCase()}
          </Button>
        )}
      </div>

      {/* Errors */}
      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Future bookings warning */}
      {futureWarning && (
        <div className="rounded-md border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-950/20">
          <p className="font-medium text-amber-800 dark:text-amber-300">
            Нельзя удалить: есть {futureWarning.count} будущих бронирований
          </p>
          <p className="mt-1 text-muted-foreground">
            Деактивируйте {nicheConfig.resourceLabel.toLowerCase()}, чтобы прекратить принимать новые записи.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                setFutureWarning(null)
                await handleToggle(futureWarning.id)
              }}
            >
              Деактивировать
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFutureWarning(null)}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
            📋
          </div>
          <div>
            <p className="font-medium">{nicheConfig.resourceLabelPlural} не найдены</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {resources.length === 0
                ? `Добавьте первый${nicheConfig.resourceLabel === 'Площадка' ? 'у' : ''} ${nicheConfig.resourceLabel.toLowerCase()}, чтобы начать принимать бронирования.`
                : 'Попробуйте изменить фильтры.'}
            </p>
          </div>
          {canEdit && resources.length === 0 && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Добавить {nicheConfig.resourceLabel.toLowerCase()}
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              {/* Niche-specific attribute columns */}
              {attrColumns.map((f) => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
              <TableHead>Услуги</TableHead>
              <TableHead>Статус</TableHead>
              {canEdit && <TableHead className="text-right">Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} className={!r.isActive ? 'opacity-60' : undefined}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {nicheConfig.resourceTypes.find((rt) => rt.value === r.type)?.label ?? r.type}
                  </Badge>
                </TableCell>
                {/* Niche attribute values */}
                {attrColumns.map((f) => (
                  <TableCell key={f.key} className="text-sm text-muted-foreground">
                    {getAttrDisplay(r, f)}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {r.services.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      r.services.map((rs) => (
                        <Badge key={rs.service.id} variant="secondary" className="text-xs">
                          {rs.service.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={r.isActive ? 'default' : 'secondary'}>
                    {r.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Редактировать"
                        onClick={() => { setActionError(null); setEditResource(r) }}
                        disabled={isPending}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title={r.isActive ? 'Деактивировать' : 'Активировать'}
                        onClick={() => handleToggle(r.id)}
                        disabled={isPending}
                      >
                        {r.isActive ? (
                          <PowerOff className="h-3.5 w-3.5 text-amber-600" />
                        ) : (
                          <Power className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Удалить"
                        onClick={() => handleDelete(r.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый {nicheConfig.resourceLabel.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <ResourceForm niche={niche} onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editResource} onOpenChange={(open) => !open && setEditResource(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать {nicheConfig.resourceLabel.toLowerCase()}</DialogTitle>
          </DialogHeader>
          {editResource && (
            <ResourceForm niche={niche} resource={editResource} onSubmit={handleEdit} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
