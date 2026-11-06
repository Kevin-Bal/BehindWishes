import { BookmarkIcon, CheckIcon, CircleIcon } from '../icons'
import { cn } from '../../lib/cn'

export type WishStatus = 'free' | 'reserved' | 'purchased'

const LABELS: Record<WishStatus, string> = {
  free: 'Libre',
  reserved: 'Réservé',
  purchased: 'Acheté',
}

interface StatusChipProps {
  status: WishStatus
  /** Nombre de personnes ayant réservé / acheté. */
  count?: number
  className?: string
}

/**
 * Puce de statut opaque. Le statut est porté par le texte et l'icône,
 * jamais par la couleur seule.
 */
export function StatusChip({ status, count = 0, className }: StatusChipProps) {
  const Icon =
    status === 'purchased' ? CheckIcon : status === 'reserved' ? BookmarkIcon : CircleIcon
  const showCount = status !== 'free' && count > 0
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 text-sm font-semibold',
        status === 'free' && 'bg-surface-muted text-ink-muted',
        status === 'reserved' && 'bg-reserved-bg text-reserved',
        status === 'purchased' && 'bg-purchased-bg text-purchased',
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={2.5} />
      {LABELS[status]}
      {showCount && (
        <span aria-label={`par ${count} personne${count > 1 ? 's' : ''}`}>· {count}</span>
      )}
    </span>
  )
}
