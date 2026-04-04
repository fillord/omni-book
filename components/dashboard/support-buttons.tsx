'use client'

import { Mail, MessageCircle, Phone } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

const SUPPORT_LINKS = [
  {
    key: 'supportEmail',
    href: 'mailto:qz.nursultan@gmail.com',
    Icon: Mail,
    label: 'Email',
  },
  {
    key: 'supportTelegram',
    href: 'https://t.me/qzlord',
    Icon: MessageCircle,
    label: 'Telegram',
  },
  {
    key: 'supportWhatsapp',
    href: 'https://wa.me/77073436423',
    Icon: Phone,
    label: 'WhatsApp',
  },
] as const

export function SupportButtons() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-xs font-medium text-muted-foreground tracking-wide">
        {t('dashboard', 'supportTitle')}
      </p>
      <div className="flex items-center gap-3">
        {SUPPORT_LINKS.map(({ key, href, Icon }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('dashboard', key)}
            className="
              flex items-center justify-center
              h-10 w-10 rounded-full
              bg-[var(--neu-bg)]
              shadow-[4px_4px_8px_var(--neu-shadow-dark),-4px_-4px_8px_var(--neu-shadow-light)]
              text-muted-foreground
              transition-all duration-200
              hover:shadow-[2px_2px_4px_var(--neu-shadow-dark),-2px_-2px_4px_var(--neu-shadow-light)]
              hover:text-foreground
              active:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)]
            "
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  )
}
