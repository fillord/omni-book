'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { sendTelegramToClient } from '@/lib/actions/clients'
import { toast } from 'sonner'

type SerializedClient = {
  id: string
  name: string
  phone: string
  email: string | null
  totalVisits: number
  totalRevenue: number
  lastVisitAt: string | null
  hasTelegram: boolean
}

type SerializedBooking = {
  id: string
  startsAt: string
  status: string
  serviceName: string
  servicePrice: number
  resourceName: string
}

export function ClientDetail({
  client,
  bookings,
}: {
  client: SerializedClient
  bookings: SerializedBooking[]
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [sending, startSend] = useTransition()

  const handleSend = () => {
    if (!message.trim()) return
    startSend(async () => {
      try {
        const result = await sendTelegramToClient(client.id, message)
        if (result.success) {
          toast.success(t('clients', 'messageSent'))
          setMessage('')
        } else {
          toast.error(t('clients', 'messageError'))
        }
      } catch {
        toast.error(t('clients', 'messageError'))
      }
    })
  }

  return (
    <>
      {/* Back link */}
      <Button variant="ghost" onClick={() => router.push('/dashboard/clients')} className="mb-4">
        {t('clients', 'backToList')}
      </Button>

      {/* Client info card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{client.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{t('clients', 'colContact')}: {client.phone}{client.email ? ` / ${client.email}` : ''}</p>
          <p>{t('clients', 'colVisits')}: {client.totalVisits}</p>
          <p>{t('clients', 'colSpent')}: {client.totalRevenue.toLocaleString('ru-RU')} ₸</p>
          <p>{t('clients', 'colLastVisit')}: {client.lastVisitAt ? new Date(client.lastVisitAt).toLocaleDateString('ru-RU') : '—'}</p>
          <p>{t('clients', 'colTelegram')}: {client.hasTelegram
            ? <Badge variant="outline">{t('clients', 'telegramConnected')}</Badge>
            : <span className="text-muted-foreground">{t('clients', 'telegramNone')}</span>
          }</p>
        </CardContent>
      </Card>

      {/* Telegram send section — only shown when hasTelegram is true */}
      {client.hasTelegram && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t('clients', 'sendMessage')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full rounded-md border p-3 text-sm bg-[var(--neu-bg)] neu-inset min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t('clients', 'messagePlaceholder')}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
            >
              {t('clients', 'sendMessage')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Telegram notice for clients without Telegram */}
      {!client.hasTelegram && (
        <Card className="mb-6">
          <CardContent className="py-4 text-sm text-muted-foreground">
            {t('clients', 'noTelegram')}
          </CardContent>
        </Card>
      )}

      {/* Booking history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('clients', 'bookingHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('clients', 'colDate')}</TableHead>
                <TableHead>{t('clients', 'colService')}</TableHead>
                <TableHead>{t('clients', 'colResource')}</TableHead>
                <TableHead>{t('clients', 'colPrice')}</TableHead>
                <TableHead>{t('clients', 'colStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(b => (
                <TableRow key={b.id}>
                  <TableCell>{new Date(b.startsAt).toLocaleDateString('ru-RU')}</TableCell>
                  <TableCell>{b.serviceName}</TableCell>
                  <TableCell>{b.resourceName}</TableCell>
                  <TableCell>{b.servicePrice.toLocaleString('ru-RU')} ₸</TableCell>
                  <TableCell>
                    <Badge variant="outline">{b.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t('clients', 'noBookings')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
