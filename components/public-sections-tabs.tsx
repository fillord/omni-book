'use client'

import { useState } from 'react'

// ---- Serialisable data types (passed from server component) ----------------

export type ResourceTabItem = {
  id: string
  name: string
  description: string | null
  avatarInitial: string
  isTable: boolean
  workDays: string   // already formatted: "Дни: Пн, Вт" or ""
  badges: string[]   // already translated attribute badge labels
}

export type ServiceTabItem = {
  id: string
  name: string
  description: string | null
  priceFormatted: string  // e.g. "5 000 ₸" or "Бесплатно"
  durationLabel: string   // e.g. "60 мин."
}

export type PublicTabSection = {
  id: string
  label: string
  type: 'resources' | 'services' | 'pricing'
  items: ResourceTabItem[] | ServiceTabItem[]
}

export type TabColorConfig = {
  accent: string
  avatarBg: string
  badge: string
  priceAccent: string
}

// ---- Constants -------------------------------------------------------------

const MAX_VISIBLE = 6

// ---- Main component --------------------------------------------------------

export function PublicSectionsTabs({
  sections,
  colors,
  showAllLabel,
}: {
  sections: PublicTabSection[]
  colors: TabColorConfig
  showAllLabel: string
}) {
  const [activeTabId, setActiveTabId] = useState(sections[0]?.id ?? '')
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set())

  if (sections.length === 0) return null

  const activeSection = sections.find((s) => s.id === activeTabId) ?? sections[0]
  const isExpanded = expandedTabs.has(activeSection.id)
  const visibleItems = isExpanded
    ? activeSection.items
    : activeSection.items.slice(0, MAX_VISIBLE)
  const hasMore = !isExpanded && activeSection.items.length > MAX_VISIBLE

  function expand() {
    setExpandedTabs((prev) => new Set([...prev, activeSection.id]))
  }

  return (
    <section className="space-y-6">

      {/* Tab switcher — only shown when there are multiple sections */}
      {sections.length > 1 && (
        <div className="neu-inset bg-[var(--neu-bg)] rounded-2xl p-1.5 flex gap-1 overflow-x-auto scrollbar-hide">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTabId(section.id)}
              className={[
                'flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                section.id === activeSection.id
                  ? `neu-raised ${colors.accent}`
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}

      {/* Content grid */}
      {activeSection.type === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(visibleItems as ResourceTabItem[]).map((item) => (
            <ResourceCard key={item.id} item={item} colors={colors} />
          ))}
        </div>
      )}

      {activeSection.type === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(visibleItems as ServiceTabItem[]).map((item) => (
            <ServiceCard key={item.id} item={item} colors={colors} />
          ))}
        </div>
      )}

      {activeSection.type === 'pricing' && (
        <div className="rounded-2xl bg-[var(--neu-bg)] neu-raised overflow-hidden">
          {(visibleItems as ServiceTabItem[]).map((item, index) => (
            <div
              key={item.id}
              className={index > 0 ? 'border-t border-foreground/5' : ''}
            >
              <PricingRow item={item} colors={colors} />
            </div>
          ))}
        </div>
      )}

      {/* Show All button */}
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={expand}
            className="neu-raised bg-[var(--neu-bg)] px-6 py-2.5 rounded-xl text-sm font-medium text-foreground hover:text-neu-accent transition-colors"
          >
            {showAllLabel}
          </button>
        </div>
      )}

    </section>
  )
}

// ---- Card sub-components ---------------------------------------------------

function ResourceCard({
  item,
  colors,
}: {
  item: ResourceTabItem
  colors: TabColorConfig
}) {
  return (
    <div className="rounded-2xl bg-[var(--neu-bg)] neu-raised p-5 flex flex-col gap-4">
      {item.isTable ? (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-muted">
          🍽️
        </div>
      ) : (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${colors.avatarBg}`}
        >
          {item.avatarInitial}
        </div>
      )}

      <div>
        <p className="font-semibold text-foreground">{item.name}</p>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
        )}
      </div>

      {item.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.badges.map((badge, i) => (
            <span
              key={i}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {item.workDays && (
        <p className="text-xs text-muted-foreground mt-auto">{item.workDays}</p>
      )}
    </div>
  )
}

function ServiceCard({
  item,
  colors,
}: {
  item: ServiceTabItem
  colors: TabColorConfig
}) {
  return (
    <div className="rounded-2xl bg-[var(--neu-bg)] neu-raised p-4 flex flex-col gap-2">
      <p className="font-semibold text-foreground text-sm">{item.name}</p>
      {item.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className={`text-sm font-bold ${colors.priceAccent}`}>
          {item.priceFormatted}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--neu-bg)] neu-inset text-muted-foreground">
          {item.durationLabel}
        </span>
      </div>
    </div>
  )
}

function PricingRow({
  item,
  colors,
}: {
  item: ServiceTabItem
  colors: TabColorConfig
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 bg-[var(--neu-bg)]">
      <div>
        <p className="font-semibold text-foreground text-sm">{item.name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
        )}
      </div>
      <div className="text-right shrink-0 pl-4">
        <p className={`font-bold text-sm ${colors.priceAccent}`}>{item.priceFormatted}</p>
        <p className="text-xs text-muted-foreground">{item.durationLabel}</p>
      </div>
    </div>
  )
}
