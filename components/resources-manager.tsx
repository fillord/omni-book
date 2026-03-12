"use client"

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
import { useI18n } from '@/lib/i18n/context'
import { getDbTranslation } from '@/lib/i18n/db-translations'

// ---- props -----------------------------------------------------------------

type Props = {
  resources: ResourceWithRelations[]
  canEdit: boolean
  niche: string
}

// ---- helpers ---------------------------------------------------------------

function getAttrDisplay(
  resource: ResourceWithRelations,
  field: AttributeField,
  yes: string,
  no: string,
): string {
  if (field.forTypes && !field.forTypes.includes(resource.type)) return '—'
  const attrs = (
    resource.attributes && typeof resource.attributes === 'object' && !Array.isArray(resource.attributes)
      ? resource.attributes
      : {}
  ) as Record<string, unknown>
  const val = attrs[field.key]
  if (val == null || val === '') return '—'
  if (typeof val === 'boolean')  return val ? yes : no
  if (Array.isArray(val))        return val.join(', ') || '—'
  return String(val)
}

// ---- component -------------------------------------------------------------

export function ResourcesManager({ resources, canEdit, niche }: Props) {
  const { t, locale }    = useI18n()
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
      toast.success(`${t('niche', nicheConfig.resourceLabel)} ${t('dashboard', 'resourceCreatedSuffix')}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('dashboard', 'errorCreate')
      setActionError(msg)
      toast.error(msg)
    }
  }

  async function handleEdit(data: CreateResourceInput | UpdateResourceInput, schedule: ScheduleEntry[]) {
    if (!editResource) return
    setActionError(null)
    try {
      await updateResource(editResource.id, data as UpdateResourceInput, schedule)
      setEditResource(null)
      refresh()
      toast.success(t('dashboard', 'saved'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('dashboard', 'errorSave')
      const display = msg.includes('Record') || msg.includes('not found')
        ? t('dashboard', 'dataChanged')
        : msg
      setActionError(display)
      toast.error(display)
    }
  }

  async function handleToggle(id: string) {
    setActionError(null)
    try {
      await toggleResourceActive(id)
      refresh()
      toast.success(t('dashboard', 'statusUpdated'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common', 'error')
      setActionError(msg)
      toast.error(msg)
    }
  }

  async function handleDelete(id: string) {
    setActionError(null)
    setFutureWarning(null)
    try {
      await deleteResource(id)
      refresh()
      toast.success(`${t('niche', nicheConfig.resourceLabel)} ${t('dashboard', 'resourceDeletedSuffix')}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.startsWith('FUTURE_BOOKINGS:')) {
        const count = parseInt(msg.split(':')[1])
        setFutureWarning({ id, count })
      } else {
        const display = msg || t('dashboard', 'errorDelete')
        setActionError(display)
        toast.error(display)
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
            <option value="all">{t('dashboard', 'allTypes')}</option>
            {nicheConfig.resourceTypes.map((rt) => (
              <option key={rt.value} value={rt.value}>{t('niche', rt.label)}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="all">{t('dashboard', 'allStatuses')}</option>
            <option value="active">{t('dashboard', 'activeFilter')}</option>
            <option value="inactive">{t('dashboard', 'inactiveFilter')}</option>
          </select>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => { setActionError(null); setCreateOpen(true) }}>
            <PlusCircle className="mr-1.5 h-4 w-4" />
            {t('common', 'add')} {t('niche', nicheConfig.resourceLabel).toLowerCase()}
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
            {t('dashboard', 'cantDelete').replace('{n}', String(futureWarning.count))}
          </p>
          <p className="mt-1 text-muted-foreground">
            {t('dashboard', 'deactivateHint')} {t('niche', nicheConfig.resourceLabel).toLowerCase()}, {t('dashboard', 'toStopBookings')}
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
              {t('dashboard', 'deactivate')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFutureWarning(null)}>
              {t('common', 'cancel')}
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
            <p className="font-medium">{t('niche', nicheConfig.resourceLabelPlural)} {t('dashboard', 'notFound')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {resources.length === 0
                ? `${t('common', 'add')} ${t('niche', nicheConfig.resourceLabel).toLowerCase()}`
                : t('dashboard', 'changeFilters')}
            </p>
          </div>
          {canEdit && resources.length === 0 && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusCircle className="mr-1.5 h-4 w-4" />
              {t('common', 'add')} {t('niche', nicheConfig.resourceLabel).toLowerCase()}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map((r) => (
              <div
                key={r.id}
                className={['rounded-lg border bg-card p-3 space-y-2', !r.isActive ? 'opacity-60' : ''].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{getDbTranslation(r, 'name', locale)}</p>
                    <p className="text-xs text-muted-foreground">
                      {nicheConfig.resourceTypes.find((rt) => rt.value === r.type)?.label 
                        ? t('niche', nicheConfig.resourceTypes.find((rt) => rt.value === r.type)!.label) 
                        : r.type}
                    </p>
                  </div>
                  <Badge variant={r.isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                    {r.isActive ? t('dashboard', 'active') : t('dashboard', 'inactive')}
                  </Badge>
                </div>
                {attrColumns.map((f) => {
                  const val = getAttrDisplay(r, f, t('common', 'yes'), t('common', 'no'))
                  if (val === '—') return null
                  return (
                    <p key={f.key} className="text-xs text-muted-foreground">
                      {t('niche', f.label)}: <span className="text-foreground">{val}</span>
                    </p>
                  )
                })}
                {r.services.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.services.map((rs) => (
                      <Badge key={rs.service.id} variant="secondary" className="text-xs">
                        {getDbTranslation(rs.service, 'name', locale)}
                      </Badge>
                    ))}
                  </div>
                )}
                {canEdit && (
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => { setActionError(null); setEditResource(r) }} disabled={isPending}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => handleToggle(r.id)} disabled={isPending}>
                      {r.isActive ? <PowerOff className="h-3.5 w-3.5 text-amber-600" /> : <Power className="h-3.5 w-3.5 text-green-600" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => handleDelete(r.id)} disabled={isPending}>
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
                <TableHead>{t('dashboard', 'name')}</TableHead>
                <TableHead>{t('dashboard', 'type')}</TableHead>
                {attrColumns.map((f) => (
                  <TableHead key={f.key}>{t('niche', f.label)}</TableHead>
                ))}
                <TableHead>{t('dashboard', 'services')}</TableHead>
                <TableHead>{t('dashboard', 'status')}</TableHead>
                {canEdit && <TableHead className="text-right">{t('dashboard', 'actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className={!r.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="font-medium">{getDbTranslation(r, 'name', locale)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {nicheConfig.resourceTypes.find((rt) => rt.value === r.type)?.label 
                        ? t('niche', nicheConfig.resourceTypes.find((rt) => rt.value === r.type)!.label) 
                        : r.type}
                    </Badge>
                  </TableCell>
                  {attrColumns.map((f) => (
                    <TableCell key={f.key} className="text-sm text-muted-foreground">
                      {getAttrDisplay(r, f, t('common', 'yes'), t('common', 'no'))}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.services.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        r.services.map((rs) => (
                          <Badge key={rs.service.id} variant="secondary" className="text-xs">
                            {getDbTranslation(rs.service, 'name', locale)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? 'default' : 'secondary'}>
                      {r.isActive ? t('dashboard', 'active') : t('dashboard', 'inactive')}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" title={t('common', 'edit')} onClick={() => { setActionError(null); setEditResource(r) }} disabled={isPending}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" title={r.isActive ? t('dashboard', 'deactivate') : t('dashboard', 'activate')} onClick={() => handleToggle(r.id)} disabled={isPending}>
                          {r.isActive ? <PowerOff className="h-3.5 w-3.5 text-amber-600" /> : <Power className="h-3.5 w-3.5 text-green-600" />}
                        </Button>
                        <Button size="sm" variant="ghost" title={t('common', 'delete')} onClick={() => handleDelete(r.id)} disabled={isPending}>
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
          title={`${t('common', 'add')} ${t('niche', nicheConfig.resourceLabel).toLowerCase()}`}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('common', 'create')} {t('niche', nicheConfig.resourceLabel).toLowerCase()}</DialogTitle>
          </DialogHeader>
          <ResourceForm niche={niche} onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editResource} onOpenChange={(open) => !open && setEditResource(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('common', 'edit')} {t('niche', nicheConfig.resourceLabel).toLowerCase()}</DialogTitle>
          </DialogHeader>
          {editResource && (
            <ResourceForm niche={niche} resource={editResource} onSubmit={handleEdit} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
