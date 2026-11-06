import { NavLink } from 'react-router'
import type { ComponentType, SVGProps } from 'react'
import { cn } from '../../lib/cn'

export interface TabItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Correspondance exacte de la route (pour l'onglet racine). */
  end?: boolean
}

/** Barre d'onglets flottante en capsule, en bas de l'écran. */
export function GlassTabBar({ items }: { items: TabItem[] }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <ul className="glass pointer-events-auto mx-auto flex max-w-md items-stretch justify-around rounded-full p-1.5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-xs font-semibold transition-colors duration-200',
                  isActive ? 'bg-surface text-accent shadow-sm' : 'text-ink-muted',
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
