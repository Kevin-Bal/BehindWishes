import { useEffect, type ReactNode } from 'react'
import { GlassBar, GlassTabBar, type BarIdentity, type TabItem } from './glass'
import { cn } from '../lib/cn'

interface ScreenProps {
  title: string
  leading?: ReactNode
  identity?: BarIdentity
  tabs?: TabItem[]
  /** Bouton flottant (ex. « + »), posé au-dessus de la barre d'onglets. */
  fab?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Gabarit d'écran : barre du haut en verre, contenu opaque qui défile dessous,
 * barre d'onglets et bouton flottant facultatifs (3 éléments de verre au plus).
 */
export function Screen({ title, leading, identity, tabs, fab, children, className }: ScreenProps) {
  useEffect(() => {
    document.title = `${title} · Derrière la liste`
    return () => {
      document.title = 'Derrière la liste'
    }
  }, [title])

  return (
    <>
      <GlassBar title={title} leading={leading} identity={identity} />
      <main
        className={cn(
          'mx-auto flex w-full max-w-xl flex-col gap-4 px-4',
          'pt-[calc(max(env(safe-area-inset-top),0.75rem)+4.75rem)]',
          tabs
            ? 'pb-[calc(max(env(safe-area-inset-bottom),0.75rem)+6rem)]'
            : 'pb-[max(env(safe-area-inset-bottom),1.5rem)]',
          className,
        )}
      >
        {children}
      </main>
      {fab && (
        <div
          className={cn(
            'fixed right-4 z-30',
            tabs
              ? 'bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+5.25rem)]'
              : 'bottom-[max(env(safe-area-inset-bottom),1rem)]',
          )}
        >
          {fab}
        </div>
      )}
      {tabs && <GlassTabBar items={tabs} />}
    </>
  )
}
