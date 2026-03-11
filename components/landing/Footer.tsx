import Link from "next/link"

const LINKS = [
  { label: "О нас", href: "#" },
  { label: "Тарифы", href: "#pricing" },
  { label: "Документация", href: "#" },
  { label: "Поддержка", href: "#" },
]

export function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-400 py-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <Link href="/" className="font-bold text-lg text-white">
            omni<span className="text-indigo-400">book</span>
          </Link>
          <p className="text-xs text-zinc-500">Универсальная платформа онлайн-записи</p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <p className="text-xs text-zinc-500">© 2026 omni-book</p>
      </div>
    </footer>
  )
}
