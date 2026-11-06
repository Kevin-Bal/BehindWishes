import { cn } from '../../lib/cn'

interface AvatarProps {
  name: string
  /** Couleur du membre (hex). */
  color: string
  emoji?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Pastille opaque d'un membre : emoji (ou initiale) sur sa couleur. */
export function Avatar({ name, color, emoji, size = 'md', className }: AvatarProps) {
  const initial = name.trim().charAt(0).toLocaleUpperCase('fr-FR')
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: color }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface',
        size === 'sm' && 'size-8 text-base',
        size === 'md' && 'size-11 text-xl',
        size === 'lg' && 'size-16 text-3xl',
        className,
      )}
    >
      {emoji || initial}
    </span>
  )
}
