'use client'

import { useState, useRef, type FormEvent } from 'react'
import { Send, CheckCircle, Loader2 } from 'lucide-react'

interface SupportFormProps {
  /** Pre-filled values (dashboard context) */
  defaultName?: string
  defaultEmail?: string
  defaultPhone?: string
  defaultBusinessName?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

function applyPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  let result = ''
  if (digits.length > 0) result += digits[0]
  if (digits.length > 1) result += ' (' + digits.slice(1, 4)
  if (digits.length >= 4) result += ') ' + digits.slice(4, 7)
  if (digits.length >= 7) result += '-' + digits.slice(7, 9)
  if (digits.length >= 9) result += '-' + digits.slice(9, 11)
  return result
}

export function SupportForm({
  defaultName = '',
  defaultEmail = '',
  defaultPhone = '',
  defaultBusinessName,
}: SupportFormProps) {
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState(defaultPhone ? applyPhoneMask(defaultPhone) : '')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handlePhoneInput(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(applyPhoneMask(e.target.value))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const rawPhone = phone.replace(/\D/g, '')
    if (rawPhone.length < 10) {
      setErrorMsg('Введите корректный номер телефона')
      setStatus('error')
      return
    }

    try {
      const res = await fetch('/api/support/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: rawPhone,
          message: message.trim(),
          businessName: defaultBusinessName,
        }),
      })

      if (!res.ok) throw new Error('Server error')
      setStatus('success')
    } catch {
      setErrorMsg('Не удалось отправить сообщение. Попробуйте ещё раз.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full neu-raised bg-[var(--neu-bg)]">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Сообщение отправлено!</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Мы получили ваш запрос и ответим в течение 24 часов.
        </p>
        <button
          type="button"
          onClick={() => { setStatus('idle'); setMessage('') }}
          className="mt-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Отправить ещё одно сообщение
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="sf-name" className="text-sm font-medium text-foreground">
          Имя <span className="text-red-400">*</span>
        </label>
        <input
          id="sf-name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Иван Иванов"
          className="
            w-full rounded-xl px-4 py-2.5 text-sm
            bg-[var(--neu-bg)] text-foreground placeholder:text-muted-foreground
            shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]
            border-none outline-none ring-0
            focus:shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)]
            transition-shadow duration-200
          "
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="sf-email" className="text-sm font-medium text-foreground">
          Email <span className="text-red-400">*</span>
        </label>
        <input
          id="sf-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="
            w-full rounded-xl px-4 py-2.5 text-sm
            bg-[var(--neu-bg)] text-foreground placeholder:text-muted-foreground
            shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]
            border-none outline-none ring-0
            focus:shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)]
            transition-shadow duration-200
          "
        />
      </div>

      {/* Phone with mask */}
      <div className="space-y-1.5">
        <label htmlFor="sf-phone" className="text-sm font-medium text-foreground">
          Телефон <span className="text-red-400">*</span>
        </label>
        <input
          id="sf-phone"
          type="tel"
          required
          autoComplete="tel"
          value={phone}
          onChange={handlePhoneInput}
          placeholder="8 (707) 343-64-23"
          className="
            w-full rounded-xl px-4 py-2.5 text-sm
            bg-[var(--neu-bg)] text-foreground placeholder:text-muted-foreground
            shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]
            border-none outline-none ring-0
            focus:shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)]
            transition-shadow duration-200
          "
        />
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label htmlFor="sf-message" className="text-sm font-medium text-foreground">
          Сообщение <span className="text-red-400">*</span>
        </label>
        <textarea
          id="sf-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Опишите ваш вопрос или проблему..."
          className="
            w-full rounded-xl px-4 py-2.5 text-sm resize-none
            bg-[var(--neu-bg)] text-foreground placeholder:text-muted-foreground
            shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]
            border-none outline-none ring-0
            focus:shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)]
            transition-shadow duration-200
          "
        />
      </div>

      {/* Error */}
      {status === 'error' && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading' || !name.trim() || !email.trim() || !phone || !message.trim()}
        className="
          w-full flex items-center justify-center gap-2
          rounded-xl px-6 py-3 text-sm font-semibold
          bg-[var(--neu-bg)] text-foreground
          shadow-[4px_4px_8px_var(--neu-shadow-dark),-4px_-4px_8px_var(--neu-shadow-light)]
          hover:shadow-[2px_2px_4px_var(--neu-shadow-dark),-2px_-2px_4px_var(--neu-shadow-light)]
          active:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_8px_var(--neu-shadow-dark),-4px_-4px_8px_var(--neu-shadow-light)]
          transition-all duration-200
        "
      >
        {status === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {status === 'loading' ? 'Отправка...' : 'Отправить сообщение'}
      </button>
    </form>
  )
}
