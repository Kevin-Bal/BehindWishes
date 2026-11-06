import { cn } from '../lib/cn'
import type { Priority } from '../lib/wishFormat'

const LABELS: Record<Priority, string> = {
  1: 'Ça me ferait plaisir',
  2: 'J’en ai vraiment envie',
  3: 'Mon rêve',
}

/** Affichage de la priorité (lecture seule). */
export function Stars({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn('text-sm tracking-tight text-reserved', className)}
      role="img"
      aria-label={`Priorité ${priority} sur 3`}
      title={LABELS[priority]}
    >
      {'★'.repeat(priority)}
      <span className="text-ink-muted/40">{'★'.repeat(3 - priority)}</span>
    </span>
  )
}

/** Choix de la priorité : un tap sur l'étoile active l'enlève. */
export function StarsInput({
  value,
  onChange,
}: {
  value: Priority | undefined
  onChange: (value: Priority | undefined) => void
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 font-semibold">Priorité</legend>
      <div className="flex items-center gap-1">
        {([1, 2, 3] as const).map((p) => {
          const active = (value ?? 0) >= p
          return (
            <button
              key={p}
              type="button"
              aria-label={`${p} étoile${p > 1 ? 's' : ''} : ${LABELS[p]}`}
              aria-pressed={value === p}
              onClick={() => onChange(value === p ? undefined : p)}
              className={cn(
                'flex size-11 items-center justify-center rounded-full text-3xl leading-none',
                active ? 'text-reserved' : 'text-ink-muted/40',
              )}
            >
              ★
            </button>
          )
        })}
        <span className="ml-2 text-sm text-ink-muted">{value ? LABELS[value] : 'Aucune'}</span>
      </div>
    </fieldset>
  )
}
