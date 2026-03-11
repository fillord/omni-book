'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Pencil, PowerOff, Power, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
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
import { ServiceForm, formatPrice } from '@/components/service-form'
import {
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
  type ServiceWithRelations,
} from '@/lib/actions/services'
import type { ResourceWithRelations } from '@/lib/actions/resources'
import type { CreateServiceInput, UpdateServiceInput } from '@/lib/validations/service'

// ---- props -----------------------------------------------------------------

type Props = {
  services: ServiceWithRelations[]
  resources: ResourceWithRelations[]
  canEdit: boolean
}

// ---- component -------------------------------------------------------------

export function ServicesManager({ services, resources, canEdit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // filter state
  const [filterStatus, setFilterStatus] = useState('all')

  // dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editService, setEditService] = useState<ServiceWithRelations | null>(null)

  // error state
  const [actionError, setActionError] = useState<string | null>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  // ---- filter ---------------------------------------------------------------

  const filtered = services.filter((s) => {
    if (filterStatus === 'active' && !s.isActive) return false
    if (filterStatus === 'inactive' && s.isActive) return false
    return true
  })

  // ---- handlers -------------------------------------------------------------

  async function handleCreate(data: CreateServiceInput | UpdateServiceInput) {
    setActionError(null)
    try {
      await createService(data as CreateServiceInput)
      setCreateOpen(false)
      refresh()
      toast.success('Услуга создана')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка создания'
      setActionError(msg)
      toast.error(msg)
    }
  }

  async function handleEdit(data: CreateServiceInput | UpdateServiceInput) {
    if (!editService) return
    setActionError(null)
    try {
      await updateService(editService.id, data as UpdateServiceInput)
      setEditService(null)
      refresh()
      toast.success('Изменения сохранены')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения'
      const display = msg.includes('not found') || msg.includes('не найдена')
        ? 'Данные были изменены, обновите страницу'
        : msg
      setActionError(display)
      toast.error(display)
    }
  }

  async function handleToggle(id: string) {
    setActionError(null)
    try {
      await toggleServiceActive(id)
      refresh()
      toast.success('Статус обновлён')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      setActionError(msg)
      toast.error(msg)
    }
  }

  async function handleDelete(id: string) {
    setActionError(null)
    try {
      await deleteService(id)
      refresh()
      toast.success('Услуга удалена')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка удаления'
      setActionError(msg)
      toast.error(msg)
    }
  }

  // ---- render ---------------------------------------------------------------

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
        {canEdit && (
          <Button size="sm" onClick={() => { setActionError(null); setCreateOpen(true) }}>
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Добавить услугу
          </Button>
        )}
      </div>

      {/* Errors */}
      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
            🗂️
          </div>
          <div>
            <p className="font-medium">Услуги не найдены</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {services.length === 0
                ? 'Добавьте первую услугу для приёма бронирований.'
                : 'Попробуйте изменить фильтры.'}
            </p>
          </div>
          {canEdit && services.length === 0 && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Добавить услугу
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map((s) => (
              <div
                key={s.id}
                className={['rounded-lg border bg-card p-3 space-y-2', !s.isActive ? 'opacity-60' : ''].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{s.description}</p>
                    )}
                  </div>
                  <Badge variant={s.isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                    {s.isActive ? 'Активна' : 'Неактивна'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.durationMin} мин · {formatPrice(s.price, s.currency)}
                </p>
                {s.resources.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.resources.map((rs) => (
                      <Badge key={rs.resource.id} variant="secondary" className="text-xs">
                        {rs.resource.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {canEdit && (
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => { setActionError(null); setEditService(s) }} disabled={isPending}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => handleToggle(s.id)} disabled={isPending}>
                      {s.isActive ? <PowerOff className="h-3.5 w-3.5 text-amber-600" /> : <Power className="h-3.5 w-3.5 text-green-600" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => handleDelete(s.id)} disabled={isPending}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <Table className="hidden sm:table">
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Длительность</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Ресурсы</TableHead>
                <TableHead>Статус</TableHead>
                {canEdit && <TableHead className="text-right">Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className={!s.isActive ? 'opacity-60' : undefined}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    {s.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
                        {s.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{s.durationMin} мин</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatPrice(s.price, s.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.resources.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        s.resources.map((rs) => (
                          <Badge key={rs.resource.id} variant="secondary" className="text-xs">
                            {rs.resource.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? 'default' : 'secondary'}>
                      {s.isActive ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" title="Редактировать" onClick={() => { setActionError(null); setEditService(s) }} disabled={isPending}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" title={s.isActive ? 'Деактивировать' : 'Активировать'} onClick={() => handleToggle(s.id)} disabled={isPending}>
                          {s.isActive ? <PowerOff className="h-3.5 w-3.5 text-amber-600" /> : <Power className="h-3.5 w-3.5 text-green-600" />}
                        </Button>
                        <Button size="sm" variant="ghost" title="Удалить" onClick={() => handleDelete(s.id)} disabled={isPending}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* FAB for mobile */}
      {canEdit && (
        <button
          onClick={() => { setActionError(null); setCreateOpen(true) }}
          className="sm:hidden fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          title="Добавить услугу"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Новая услуга</DialogTitle>
          </DialogHeader>
          <ServiceForm
            availableResources={resources}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editService} onOpenChange={(open) => !open && setEditService(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать услугу</DialogTitle>
          </DialogHeader>
          {editService && (
            <ServiceForm
              service={editService}
              availableResources={resources}
              onSubmit={handleEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
