'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { syncClients } from '@/lib/actions/clients'
import { toast } from 'sonner'

type Client = {
  id: string
  name: string
  phone: string
  email: string | null
  totalVisits: number
  totalRevenue: number
  lastVisitAt: string | null  // ISO string (serialized from server)
  hasTelegram: boolean
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [syncing, startSync] = useTransition()

  const filtered = useMemo(() =>
    clients.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
    ),
    [clients, query]
  )

  const handleSync = () => {
    startSync(async () => {
      try {
        const result = await syncClients()
        toast.success(t('clients', 'synced').replace('{n}', String(result.synced)))
        router.refresh()
      } catch {
        toast.error(t('clients', 'syncError'))
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <Input
          placeholder={t('clients', 'searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleSync} disabled={syncing} variant="outline">
          {t('clients', 'syncButton')}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('clients', 'colName')}</TableHead>
              <TableHead>{t('clients', 'colContact')}</TableHead>
              <TableHead>{t('clients', 'colVisits')}</TableHead>
              <TableHead>{t('clients', 'colSpent')}</TableHead>
              <TableHead>{t('clients', 'colLastVisit')}</TableHead>
              <TableHead>{t('clients', 'colTelegram')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/dashboard/clients/${c.id}`) }}
              >
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <span>{c.phone}</span>
                  {c.email && <span className="text-muted-foreground text-xs ml-2">{c.email}</span>}
                </TableCell>
                <TableCell>{c.totalVisits}</TableCell>
                <TableCell>{c.totalRevenue.toLocaleString('ru-RU')} ₸</TableCell>
                <TableCell>
                  {c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString('ru-RU') : '—'}
                </TableCell>
                <TableCell>
                  {c.hasTelegram
                    ? <Badge variant="outline">{t('clients', 'telegramConnected')}</Badge>
                    : <span className="text-muted-foreground text-xs">{t('clients', 'telegramNone')}</span>
                  }
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t('clients', 'empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
