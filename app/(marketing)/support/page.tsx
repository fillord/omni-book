"use client"

import Link from "next/link"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { SupportForm } from "@/components/support/SupportForm"
import { Mail, MessageCircle, Phone } from "lucide-react"

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[var(--neu-bg)] min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← На главную
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-2">Поддержка</h1>
            <p className="text-muted-foreground">
              Опишите вашу проблему — мы ответим в течение 24 часов.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick contacts */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Быстрая связь</h2>

              <a
                href="mailto:qz.nursultan@gmail.com"
                className="flex items-center gap-3 rounded-2xl p-4 neu-raised bg-[var(--neu-bg)] hover:text-foreground text-muted-foreground transition-colors group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full neu-inset bg-[var(--neu-bg)]">
                  <Mail className="h-4 w-4 text-neu-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Email</p>
                  <p className="text-xs">qz.nursultan@gmail.com</p>
                </div>
              </a>

              <a
                href="https://t.me/qzlord"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl p-4 neu-raised bg-[var(--neu-bg)] hover:text-foreground text-muted-foreground transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full neu-inset bg-[var(--neu-bg)]">
                  <MessageCircle className="h-4 w-4 text-neu-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Telegram</p>
                  <p className="text-xs">@qzlord</p>
                </div>
              </a>

              <a
                href="tel:87073436423"
                className="flex items-center gap-3 rounded-2xl p-4 neu-raised bg-[var(--neu-bg)] hover:text-foreground text-muted-foreground transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full neu-inset bg-[var(--neu-bg)]">
                  <Phone className="h-4 w-4 text-neu-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Телефон</p>
                  <p className="text-xs">8 707 343-64-23</p>
                </div>
              </a>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 neu-raised bg-[var(--neu-bg)] rounded-2xl p-6">
              <h2 className="text-base font-semibold text-foreground mb-5">Написать в поддержку</h2>
              <SupportForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
