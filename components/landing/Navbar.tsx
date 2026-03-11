"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [open, setOpen] = useState(false)

  const links = [
    { label: "Возможности", href: "#features" },
    { label: "Тарифы", href: "#pricing" },
    { label: "Демо", href: "#demo" },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight text-zinc-900">
          omni<span className="text-indigo-600">book</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-600">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-zinc-900 transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
          >
            Регистрация
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-700 py-2 hover:text-indigo-600 transition-colors"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <hr className="border-zinc-200" />
          <Link href="/login" className="text-sm text-zinc-700 py-2" onClick={() => setOpen(false)}>
            Войти
          </Link>
          <Link
            href="/register"
            className="text-sm text-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium"
            onClick={() => setOpen(false)}
          >
            Регистрация
          </Link>
        </div>
      )}
    </header>
  )
}
