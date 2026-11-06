import { useId } from 'react'
import { cn } from '../../lib/cn'

interface SegmentedControlProps<T extends string> {
  label: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}

/** Sélecteur segmenté en verre, sélection en capsule opaque. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId()
  return (
    <fieldset className="glass flex rounded-full p-1">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const checked = option.value === value
        return (
          <label
            key={option.value}
            className={cn(
              'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors duration-200',
              'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent',
              checked ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted',
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
