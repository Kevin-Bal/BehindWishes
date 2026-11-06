import type { Member } from '../lib/groups'
import { cn } from '../lib/cn'
import { CheckIcon } from './icons'
import { Avatar } from './ui/Avatar'

interface MemberPickerProps {
  legend: string
  hint?: string
  members: Member[]
  selected: string[]
  onChange: (ids: string[]) => void
  /** Membres cochés d'office et non modifiables, avec la raison affichée. */
  locked?: { ids: string[]; reason: string }
  error?: string
}

/** Liste de membres à cocher (bénéficiaires, participants). Cases de 44 px minimum. */
export function MemberPicker({
  legend,
  hint,
  members,
  selected,
  onChange,
  locked,
  error,
}: MemberPickerProps) {
  const allSelected = members.every((m) => selected.includes(m.id))

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  function toggleAll() {
    const lockedIds = locked?.ids ?? []
    onChange(allSelected ? lockedIds : members.map((m) => m.id))
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <legend className="font-semibold">{legend}</legend>
        <button
          type="button"
          onClick={toggleAll}
          className="min-h-11 px-2 text-sm font-semibold text-accent underline underline-offset-4"
        >
          {allSelected ? 'Tout décocher' : 'Tout le monde'}
        </button>
      </div>
      {hint && <p className="-mt-2 text-sm text-ink-muted">{hint}</p>}
      <ul className="flex flex-col gap-1">
        {members.map((m) => {
          const isLocked = locked?.ids.includes(m.id) ?? false
          const checked = isLocked || selected.includes(m.id)
          return (
            <li key={m.id}>
              <label
                className={cn(
                  'flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-2 py-1',
                  'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent',
                  checked ? 'bg-surface-muted' : '',
                  isLocked && 'cursor-default',
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={isLocked}
                  onChange={() => toggle(m.id)}
                />
                <Avatar name={m.name} color={m.color} emoji={m.emoji} size="sm" />
                <span className="flex-1 truncate font-semibold">{m.name}</span>
                {isLocked && <span className="text-sm text-ink-muted">{locked?.reason}</span>}
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-7 items-center justify-center rounded-lg border-2',
                    checked ? 'border-accent bg-accent text-on-accent' : 'border-line',
                    isLocked && 'opacity-60',
                  )}
                >
                  {checked && <CheckIcon className="size-5" strokeWidth={3} />}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
