import { useId } from 'react'
import { cn } from '../../lib/cn'

interface SegmentedControlProps<T extends string> {
  label: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  /**
   * `content` (défaut) : piste opaque, pour un sélecteur posé dans une carte ou un
   * formulaire — pas de verre dans la couche de contenu.
   * `glass` : piste en verre, seulement pour un sélecteur flottant (barre d'outils).
   */
  surface?: 'content' | 'glass'
}

/**
 * Sélecteur segmenté. Le segment choisi est marqué par un curseur bordé (contraste
 * ≥ 3:1 avec la piste) et par la graisse du texte, jamais par la couleur seule.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  surface = 'content',
}: SegmentedControlProps<T>) {
  const name = useId()
  return (
    <fieldset
      className={cn(
        'flex rounded-full p-1',
        surface === 'glass' ? 'glass' : 'border border-line bg-surface-muted',
      )}
    >
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const checked = option.value === value
        return (
          <label
            key={option.value}
            className={cn(
              'flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full border-2 px-2 text-center text-sm leading-tight transition-colors duration-200',
              'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent',
              checked
                ? 'border-ink-muted bg-surface font-bold text-ink shadow-sm'
                : 'border-transparent font-semibold text-ink-muted',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        )
      })}
    </fieldset>
  )
}
