import { useState, type FormEvent, type ReactNode } from 'react'
import { MEMBER_COLORS, MEMBER_EMOJIS } from '../lib/appearance'
import { cn } from '../lib/cn'
import { LIMITS, type Member } from '../lib/groups'
import { CheckIcon } from './icons'
import { GlassSheet } from './glass'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'

export interface MemberDraft {
  name: string
  color: string
  emoji?: string
}

interface MemberSheetProps {
  open: boolean
  onClose: () => void
  /** Membre à modifier ; absent = ajout. */
  member?: Member
  /** Apparence proposée pour un nouveau membre. */
  defaults: { color: string; emoji: string }
  /** Prénoms déjà pris (comparaison insensible à la casse). */
  takenNames: string[]
  onSubmit: (draft: MemberDraft) => Promise<void>
  /** Archiver / désarchiver (B1) — seulement en modification. */
  onToggleArchive?: () => Promise<void>
}

/** Feuille d'ajout / modification d'un membre : prénom, couleur, emoji (B1, B2). */
export function MemberSheet(props: MemberSheetProps) {
  const { open, onClose, member } = props
  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title={member ? `Modifier ${member.name}` : 'Ajouter un membre'}
    >
      {/* Remonté à chaque ouverture pour repartir des bonnes valeurs. */}
      {open && <MemberForm key={member?.id ?? 'new'} {...props} />}
    </GlassSheet>
  )
}

function MemberForm({
  member,
  defaults,
  takenNames,
  onSubmit,
  onClose,
  onToggleArchive,
}: MemberSheetProps) {
  const [name, setName] = useState(member?.name ?? '')
  const [color, setColor] = useState(member?.color ?? defaults.color)
  const [emoji, setEmoji] = useState<string | undefined>(member ? member.emoji : defaults.emoji)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Indique un prénom.')
    const lower = trimmed.toLocaleLowerCase('fr-FR')
    const taken = takenNames.some((n) => n.toLocaleLowerCase('fr-FR') === lower)
    if (taken && lower !== member?.name.toLocaleLowerCase('fr-FR')) {
      return setError('Ce prénom est déjà dans le groupe. Ajoute une initiale pour les distinguer.')
    }
    setBusy(true)
    try {
      await onSubmit({ name: trimmed, color, ...(emoji ? { emoji } : {}) })
      onClose()
    } catch {
      setError('Enregistrement impossible. Vérifie ta connexion et réessaie.')
    } finally {
      setBusy(false)
    }
  }

  async function handleArchive() {
    if (!onToggleArchive) return
    if (!member?.archived && !confirmArchive) return setConfirmArchive(true)
    setBusy(true)
    try {
      await onToggleArchive()
      onClose()
    } catch {
      setError('Action impossible. Vérifie ta connexion et réessaie.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Avatar name={name || '?'} color={color} emoji={emoji} size="lg" />
        <div className="flex-1">
          <TextField
            label="Prénom"
            value={name}
            maxLength={LIMITS.memberName}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(event) => {
              setName(event.target.value)
              setError(undefined)
            }}
            error={error}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Couleur</legend>
        <div className="flex flex-wrap gap-2">
          {MEMBER_COLORS.map((c, index) => (
            <label
              key={c}
              className="relative flex size-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent"
              style={{ backgroundColor: c }}
            >
              <input
                type="radio"
                name="member-color"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                className="sr-only"
                aria-label={`Couleur ${index + 1}`}
              />
              {color === c && <CheckIcon className="size-6 text-white" strokeWidth={3} />}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Emoji</legend>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          <EmojiOption label="Aucun" selected={!emoji} onSelect={() => setEmoji(undefined)}>
            <span className="text-sm font-semibold">Aa</span>
          </EmojiOption>
          {MEMBER_EMOJIS.map((e) => (
            <EmojiOption key={e} label={e} selected={emoji === e} onSelect={() => setEmoji(e)}>
              <span className="text-2xl">{e}</span>
            </EmojiOption>
          ))}
        </div>
      </fieldset>

      <Button type="submit" variant="primary" size="lg" disabled={busy}>
        {member ? 'Enregistrer' : 'Ajouter'}
      </Button>

      {member && onToggleArchive && (
        <Button
          variant={member.archived ? 'secondary' : 'danger'}
          onClick={handleArchive}
          disabled={busy}
        >
          {member.archived
            ? 'Remettre dans le groupe'
            : confirmArchive
              ? `Oui, archiver ${member.name}`
              : 'Archiver ce membre'}
        </Button>
      )}
      {confirmArchive && !member?.archived && (
        <p className="-mt-3 text-center text-sm text-ink-muted" role="status">
          {member?.name} n’apparaîtra plus dans les nouveaux évènements. Son historique est
          conservé.
        </p>
      )}
    </form>
  )
}

function EmojiOption({
  label,
  selected,
  onSelect,
  children,
}: {
  label: string
  selected: boolean
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <label
      className={cn(
        'flex aspect-square min-h-11 cursor-pointer items-center justify-center rounded-2xl border-2',
        'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent',
        selected ? 'border-accent bg-surface' : 'border-transparent bg-surface-muted',
      )}
    >
      <input
        type="radio"
        name="member-emoji"
        checked={selected}
        onChange={onSelect}
        className="sr-only"
        aria-label={label}
      />
      {children}
    </label>
  )
}
