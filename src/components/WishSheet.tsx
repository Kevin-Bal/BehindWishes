import { useRef, useState, type FormEvent } from 'react'
import type { Wish, WishDraft } from '../lib/wishes'
import {
  normalizeUrl,
  parsePrice,
  priceInputValue,
  WISH_LIMITS,
  type Priority,
} from '../lib/wishFormat'
import { GlassSheet } from './glass'
import { StarsInput } from './Stars'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'

interface WishSheetProps {
  open: boolean
  onClose: () => void
  /** Souhait à modifier ; absent = ajout. */
  wish?: Wish
  onSubmit: (draft: WishDraft) => Promise<void>
  onDelete?: () => Promise<void>
}

/**
 * Ajout / modification d'un souhait (D2, D3) dans une feuille modale.
 * Trois champs visibles ; « Plus d'options » déplie le prix et la priorité.
 */
export function WishSheet(props: WishSheetProps) {
  return (
    <GlassSheet
      open={props.open}
      onClose={props.onClose}
      title={props.wish ? 'Modifier le souhait' : 'Nouveau souhait'}
    >
      {props.open && <WishForm key={props.wish?.id ?? 'new'} {...props} />}
    </GlassSheet>
  )
}

type Errors = { title?: string; url?: string; price?: string; submit?: string }

function WishForm({ wish, onSubmit, onClose, onDelete }: WishSheetProps) {
  const [title, setTitle] = useState(wish?.title ?? '')
  const [url, setUrl] = useState(wish?.url ?? '')
  const [description, setDescription] = useState(wish?.description ?? '')
  const [price, setPrice] = useState(priceInputValue(wish?.priceEstimate))
  const [priority, setPriority] = useState<Priority | undefined>(wish?.priority)
  const [moreOptions, setMoreOptions] = useState(
    wish?.priceEstimate !== undefined || wish?.priority !== undefined,
  )
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)

  function reset() {
    setTitle('')
    setUrl('')
    setDescription('')
    setPrice('')
    setPriority(undefined)
    setErrors({})
    // Prêt pour le souhait suivant sans toucher l'écran.
    titleRef.current?.focus()
  }

  async function save(keepOpen: boolean) {
    const next: Errors = {}
    if (!title.trim()) next.title = 'Indique ce qui te ferait plaisir.'
    const normalizedUrl = url.trim() ? normalizeUrl(url) : undefined
    if (normalizedUrl === null) next.url = 'Ce lien ne semble pas valide (http ou https).'
    const parsedPrice = parsePrice(price)
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      next.price = 'Indique un prix en euros, par exemple 25 ou 12,50.'
      setMoreOptions(true)
    }
    setErrors(next)
    if (next.title || next.url || next.price) return

    setBusy(true)
    try {
      await onSubmit({
        title,
        ...(normalizedUrl ? { url: normalizedUrl } : {}),
        ...(description.trim() ? { description } : {}),
        ...(parsedPrice !== null ? { priceEstimate: parsedPrice } : {}),
        ...(priority ? { priority } : {}),
      })
      if (keepOpen) reset()
      else onClose()
    } catch {
      setErrors({ submit: 'Enregistrement impossible. Vérifie ta connexion et réessaie.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!confirmDelete) return setConfirmDelete(true)
    setBusy(true)
    try {
      await onDelete()
      onClose()
    } catch {
      setErrors({ submit: 'Suppression impossible. Vérifie ta connexion et réessaie.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        void save(false)
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <TextField
        ref={titleRef}
        label="Titre"
        placeholder="Un livre, un pull taille M…"
        value={title}
        maxLength={WISH_LIMITS.title}
        autoComplete="off"
        enterKeyHint="done"
        onChange={(e) => {
          setTitle(e.target.value)
          setErrors((x) => ({ ...x, title: undefined }))
        }}
        error={errors.title}
      />
      <TextField
        label="Lien (facultatif)"
        placeholder="https://…"
        type="url"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={url}
        maxLength={WISH_LIMITS.url}
        onChange={(e) => {
          setUrl(e.target.value)
          setErrors((x) => ({ ...x, url: undefined }))
        }}
        error={errors.url}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="wish-description" className="font-semibold">
          Précisions (facultatif)
        </label>
        <textarea
          id="wish-description"
          rows={2}
          placeholder="Couleur, taille, modèle…"
          value={description}
          maxLength={WISH_LIMITS.description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-12 rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted/60"
        />
      </div>

      {moreOptions ? (
        <>
          <TextField
            label="Prix indicatif (€)"
            placeholder="25"
            inputMode="decimal"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value)
              setErrors((x) => ({ ...x, price: undefined }))
            }}
            error={errors.price}
          />
          <StarsInput value={priority} onChange={setPriority} />
        </>
      ) : (
        <button
          type="button"
          onClick={() => setMoreOptions(true)}
          className="min-h-11 self-start font-semibold text-accent underline underline-offset-4"
        >
          Plus d’options (prix, priorité)
        </button>
      )}

      {errors.submit && (
        <p role="alert" className="text-center font-semibold text-danger">
          {errors.submit}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={busy}>
        {wish ? 'Enregistrer' : 'Ajouter'}
      </Button>
      {!wish && (
        <Button disabled={busy} onClick={() => void save(true)}>
          Ajouter et en saisir un autre
        </Button>
      )}
      {wish && onDelete && (
        <>
          <Button variant="danger" disabled={busy} onClick={handleDelete}>
            {confirmDelete ? 'Oui, supprimer ce souhait' : 'Supprimer ce souhait'}
          </Button>
          {confirmDelete && (
            <p role="status" className="-mt-2 text-center text-sm text-ink-muted">
              Il disparaîtra de ta liste.
            </p>
          )}
        </>
      )}
    </form>
  )
}
