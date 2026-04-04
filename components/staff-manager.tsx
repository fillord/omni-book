'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Trash2, Users, Shield, ShieldCheck } from 'lucide-react'
import { getStaffMembers, inviteStaff, removeStaff, updateStaffRole } from '@/lib/actions/staff'
import { toast } from 'sonner'
import { BillingLimitAlert } from '@/components/billing-limit-alert'

type StaffMember = {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
}

export function StaffManager({ planStatus }: { planStatus?: string }) {
  const isExpired = planStatus === 'EXPIRED'
  const [members, setMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [limitPlan, setLimitPlan] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'STAFF' | 'OWNER'>('STAFF')

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    try {
      const data = await getStaffMembers()
      setMembers(data)
    } catch {
      toast.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  function handleInvite() {
    if (!name.trim() || !email.trim() || !password.trim()) return

    startTransition(async () => {
      const result = await inviteStaff({ name: name.trim(), email: email.trim(), password, role })
      if ('error' in result && result.error === 'LIMIT_REACHED') {
        setDialogOpen(false)
        setLimitPlan(result.plan ?? 'FREE')
      } else if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Сотрудник добавлен')
        setDialogOpen(false)
        setName('')
        setEmail('')
        setPassword('')
        setRole('STAFF')
        await loadMembers()
      }
    })
  }

  function handleRemove(userId: string, userName: string | null) {
    if (!confirm(`Удалить ${userName || 'сотрудника'}?`)) return

    startTransition(async () => {
      const result = await removeStaff(userId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Сотрудник удалён')
        await loadMembers()
      }
    })
  }

  function handleRoleChange(userId: string, newRole: 'STAFF' | 'OWNER') {
    startTransition(async () => {
      const result = await updateStaffRole(userId, newRole)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Роль обновлена')
        await loadMembers()
      }
    })
  }

  const ROLE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    OWNER:      { label: 'Владелец',    variant: 'default' },
    STAFF:      { label: 'Сотрудник',   variant: 'secondary' },
    CUSTOMER:   { label: 'Клиент',      variant: 'outline' },
    SUPERADMIN: { label: 'Superadmin',  variant: 'default' },
  }

  return (
    <div className="space-y-4">
      {limitPlan && (
        <BillingLimitAlert plan={limitPlan} onDismiss={() => setLimitPlan(null)} />
      )}
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 gap-4 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Команда
          </CardTitle>
          <CardDescription>Управление сотрудниками вашего бизнеса</CardDescription>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-1.5" disabled={isExpired} />}>
            <UserPlus className="h-4 w-4" />
            Добавить
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить сотрудника</DialogTitle>
              <DialogDescription>
                Создайте аккаунт для нового сотрудника. Передайте ему логин и пароль.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input placeholder="Иван Иванов" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="staff@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Пароль</Label>
                <Input type="password" placeholder="Минимум 8 символов" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Роль</Label>
                <Select value={role} onValueChange={(v) => setRole(v as 'STAFF' | 'OWNER')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Сотрудник</SelectItem>
                    <SelectItem value="OWNER">Владелец</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleInvite} disabled={isPending || !name.trim() || !email.trim() || password.length < 8}>
                {isPending ? 'Создаём…' : 'Создать'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      {isExpired && (
        <div className="px-6 pb-4">
          <p className="text-sm text-orange-500">
            Управление персоналом недоступно — подписка истекла. Продлите PRO для восстановления доступа.
          </p>
        </div>
      )}

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg neu-inset bg-[var(--neu-bg)] animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Нет сотрудников. Добавьте первого!
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const badge = ROLE_BADGE[m.role] ?? { label: m.role, variant: 'outline' as const }
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg neu-raised bg-[var(--neu-bg)] px-3 py-2.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {(m.name ?? m.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{m.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={m.role}
                      onValueChange={(v) => handleRoleChange(m.id, v as 'STAFF' | 'OWNER')}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-7 w-auto text-xs gap-1 border-none shadow-none">
                        <Badge variant={badge.variant} className="gap-1">
                          {m.role === 'OWNER' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          {badge.label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF">Сотрудник</SelectItem>
                        <SelectItem value="OWNER">Владелец</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(m.id, m.name)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}
