import type { ReactNode } from 'react'

interface GlassBarProps {
  title: string
  /** Élément à gauche du titre (ex. bouton retour). */
  leading?: ReactNode
  /** Identité courante : affiche « Tu es Léa · Changer ». */
  identity?: { name: string; onChange: () => void }
}

/** Barre du haut en verre : titre et identité. Le contenu défile dessous. */
export function GlassBar({ title, leading, identity }: GlassBarProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <div className="glass pointer-events-auto mx-auto flex min-h-14 max-w-xl items-center gap-2 rounded-full py-1.5 pr-2 pl-4">
        {leading}
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h1>
        {identity && (
          <button
            type="button"
            onClick={identity.onChange}
            className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold"
          >
            Tu es {identity.name} · <span className="underline underline-offset-2">Changer</span>
          </button>
        )}
      </div>
    </header>
  )
}
