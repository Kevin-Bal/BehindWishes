import { Link, useLocation } from 'react-router'
import type { ComponentType, SVGProps } from 'react'
import { cn } from '../../lib/cn'

export interface TabItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Correspondance exacte de la route (pour l'onglet racine). */
  end?: boolean
  /** Autres débuts de chemin qui appartiennent à cet onglet (écrans de détail). */
  also?: string[]
}

function matches(pathname: string, { to, end, also = [] }: TabItem) {
  const own = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
  return own || also.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Barre d'onglets flottante en capsule, en bas de l'écran. Elle reste visible sur les
 * écrans de détail ; l'onglet dont ils dépendent reste marqué.
 */
export function GlassTabBar({ items }: { items: TabItem[] }) {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="Navigation principale"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <ul className="glass pointer-events-auto mx-auto flex max-w-md items-stretch justify-around rounded-full p-1.5">
        {items.map((item) => {
          const { to, label, icon: Icon } = item
          const active = matches(pathname, item)
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-current={active ? (pathname === to ? 'page' : 'true') : undefined}
                className={cn(
                  // Libellés plafonnés : comme sur iOS, la barre d'onglets ne grossit pas avec le texte.
                  'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[min(0.75rem,14px)] leading-tight font-semibold whitespace-nowrap transition-colors duration-200',
                  active ? 'bg-surface text-accent shadow-sm' : 'text-ink-muted',
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
