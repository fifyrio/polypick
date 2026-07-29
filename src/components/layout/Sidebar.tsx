'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import {
  IconHome,
  IconSparkle,
  IconDrop,
  IconCoach,
  IconFlask,
  IconHelp,
  IconSignOut,
} from './icons'

interface NavItem {
  key: string
  label: string
  icon: (p: { className?: string }) => JSX.Element
  section?: 'main' | 'tools'
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: IconHome, section: 'main' },
  { key: 'analyzer', label: 'AI Analyzer', icon: IconSparkle, section: 'tools' },
  { key: 'picks', label: 'Picks', icon: IconDrop, section: 'tools' },
  { key: 'coach', label: 'AI Coach', icon: IconCoach, section: 'tools' },
  { key: 'paper', label: 'Paper Trading', icon: IconFlask, section: 'tools' },
  { key: 'help', label: 'Help Center', icon: IconHelp, section: 'tools' },
]

export function Sidebar() {
  const [active, setActive] = useState('analyzer')

  const mainItems = NAV.filter((n) => n.section === 'main')
  const toolItems = NAV.filter((n) => n.section === 'tools')

  return (
    <aside className="relative z-10 hidden w-64 shrink-0 flex-col border-r border-paper-line bg-paper/60 lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-paper-line px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-brand-400 font-mono text-lg font-bold">
          P
        </span>
        <span className="text-[17px] font-semibold tracking-tight">Polypick</span>
      </div>

      {/* Nav */}
      <nav className="scroll-slim flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {mainItems.map((item) => (
            <NavButton
              key={item.key}
              item={item}
              active={active === item.key}
              onClick={() => setActive(item.key)}
            />
          ))}
        </ul>

        <p className="px-3 pb-2 pt-5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">
          Tools
        </p>
        <ul className="space-y-1">
          {toolItems.map((item) => (
            <NavButton
              key={item.key}
              item={item}
              active={active === item.key}
              onClick={() => setActive(item.key)}
            />
          ))}
        </ul>
      </nav>

      {/* Offer card */}
      <div className="px-3 pb-3">
        <div className="overflow-hidden rounded-xl2 bg-brand-ink p-4 text-white shadow-pop ring-1 ring-black/20">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-400">
            Limited offer
          </p>
          <p className="mt-2 font-serif text-xl leading-tight">
            Unlock <em className="not-italic text-brand-400">All-Access</em>
          </p>
          <p className="mt-1 text-[13px] text-white/60">
            20% off with{' '}
            <span className="font-mono text-white">RICH20</span>
          </p>
          <button className="mt-3 w-full rounded-lg bg-brand-500 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-400">
            See plans
          </button>
        </div>
      </div>

      <button className="flex items-center gap-3 border-t border-paper-line px-6 py-4 text-sm font-medium text-ink-soft transition hover:text-ink">
        <IconSignOut className="h-[18px] w-[18px]" />
        Sign out
      </button>
    </aside>
  )
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <li>
      <button
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
          active
            ? 'bg-ink text-white shadow-card'
            : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] transition',
            active ? 'text-brand-400' : 'text-ink-faint group-hover:text-ink'
          )}
        />
        {item.label}
      </button>
    </li>
  )
}
