import type { ReactNode } from 'react'
import { Avatar } from '../ui/Avatar'

export interface BarIdentity {
  name: string
  color: string
  emoji?: string
  onChange: () => void
}

interface GlassBarProps {
  title: string
  /** Élément à gauche du titre (ex. bouton retour). */
  leading?: ReactNode
  /** Identité courante : avatar et prénom, un tap pour changer. */
  identity?: BarIdentity
}

/** Barre du haut en verre : titre et identité. Le contenu défile dessous. */
export function GlassBar({ title, leading, identity }: GlassBarProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <div className="glass pointer-events-auto mx-auto flex min-h-14 max-w-xl items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4">
        {leading}
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h1>
        {identity && (
          <button
            type="button"
            onClick={identity.onChange}
            aria-label={`Tu es ${identity.name}. Changer de prénom`}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-surface/60 py-1 pr-3 pl-1"
          >
            <Avatar name={identity.name} color={identity.color} emoji={identity.emoji} size="sm" />
            {/* Largeur plafonnée en px : le titre garde sa place même en très grand texte. */}
            <span className="max-w-[88px] truncate text-sm font-semibold">{identity.name}</span>
          </button>
        )}
      </div>
    </header>
  )
}
