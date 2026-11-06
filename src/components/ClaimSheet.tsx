import { useState } from 'react'
import { aggregateStatus, changedSinceClaim, type Claim } from '../lib/claims'
import type { Member } from '../lib/groups'
import { formatPrice, urlDomain } from '../lib/wishFormat'
import type { Wish } from '../lib/wishes'
import { GlassSheet } from './glass'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { StatusChip } from './ui/StatusChip'

interface ClaimSheetProps {
  open: boolean
  onClose: () => void
  wish: Wish | undefined
  claims: Claim[]
  meId: string
  members: Member[]
  onReserve: () => Promise<void>
  onSetPurchased: (purchased: boolean) => Promise<void>
  onCancel: () => Promise<void>
}

/**
 * Détail d'un souhait sur la liste d'un AUTRE : qui l'a pris (E1), et mes actions
 * (E2 réserver avec avertissement, E3 acheté / annuler). Jamais affiché sur ma liste.
 */
export function ClaimSheet(props: ClaimSheetProps) {
  return (
    <GlassSheet open={props.open} onClose={props.onClose} title={props.wish?.title ?? 'Souhait'}>
      {props.open && props.wish && <ClaimDetail key={props.wish.id} {...props} wish={props.wish} />}
    </GlassSheet>
  )
}

function ClaimDetail({
  wish,
  claims,
  meId,
  members,
  onClose,
  onReserve,
  onSetPurchased,
  onCancel,
}: ClaimSheetProps & { wish: Wish }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const mine = claims.find((c) => c.claimedBy === meId)
  const others = claims.filter((c) => c.claimedBy !== meId)
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? 'Quelqu’un'
  const othersPurchased = others.filter((c) => c.status === 'purchased')

  async function run(action: () => Promise<void>, close = false) {
    setBusy(true)
    setError(undefined)
    try {
      await action()
      if (close) onClose()
    } catch {
      setError('Action impossible. Vérifie ta connexion et réessaie.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {wish.imageUrl && (
        <img
          src={wish.imageUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="max-h-48 self-center rounded-2xl border border-line bg-white object-contain"
          onError={(e) => {
            e.currentTarget.hidden = true
          }}
        />
      )}
      {wish.description && (
        <p className="whitespace-pre-line text-ink-muted break-words">{wish.description}</p>
      )}
      {(wish.priceEstimate !== undefined || wish.url) && (
        <div className="flex flex-wrap items-center gap-3">
          {wish.priceEstimate !== undefined && (
            <span className="font-semibold">{formatPrice(wish.priceEstimate)}</span>
          )}
          {wish.url && (
            <a
              href={wish.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-semibold text-accent underline underline-offset-4"
            >
              Voir sur {urlDomain(wish.url)} ↗<span className="sr-only"> (nouvel onglet)</span>
            </a>
          )}
        </div>
      )}

      <section aria-labelledby="claimers-title" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 id="claimers-title" className="font-semibold">
            Qui l’a pris ?
          </h3>
          <StatusChip status={aggregateStatus(claims)} count={claims.length} />
        </div>
        {claims.length === 0 ? (
          <p className="text-ink-muted">Personne pour l’instant.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {claims.map((c) => {
              const member = members.find((m) => m.id === c.claimedBy)
              return (
                <li
                  key={c.id}
                  className="flex min-h-12 items-center gap-3 rounded-2xl bg-surface-muted px-2"
                >
                  {member && (
                    <Avatar
                      name={member.name}
                      color={member.color}
                      emoji={member.emoji}
                      size="sm"
                    />
                  )}
                  <span className="flex-1 font-semibold">
                    {c.claimedBy === meId ? 'Toi' : nameOf(c.claimedBy)}
                  </span>
                  <StatusChip status={c.status} />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {mine && changedSinceClaim(wish, mine) && (
        <p className="rounded-xl bg-reserved-bg p-3 text-sm font-semibold text-reserved">
          Modifié depuis que tu l’as pris : vérifie le titre et le lien.
        </p>
      )}

      {error && (
        <p role="alert" className="text-center font-semibold text-danger">
          {error}
        </p>
      )}

      {!mine && (
        <>
          {others.length > 0 && (
            <p
              role="status"
              className={
                othersPurchased.length > 0
                  ? 'rounded-xl bg-danger/10 p-3 font-semibold text-danger'
                  : 'rounded-xl bg-reserved-bg p-3 text-reserved'
              }
            >
              {othersPurchased.length > 0
                ? `Attention : ${othersPurchased.map((c) => nameOf(c.claimedBy)).join(', ')} l’a déjà acheté. Tu le prends quand même ?`
                : `${others.map((c) => nameOf(c.claimedBy)).join(', ')} l’a déjà réservé, tu le prends quand même ?`}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            disabled={busy}
            onClick={() => void run(onReserve, true)}
          >
            {others.length > 0 ? 'Oui, je le prends aussi' : 'Je le prends'}
          </Button>
        </>
      )}

      {mine && (
        <>
          <Button
            variant={mine.status === 'purchased' ? 'secondary' : 'primary'}
            size="lg"
            disabled={busy}
            onClick={() => void run(() => onSetPurchased(mine.status !== 'purchased'))}
          >
            {mine.status === 'purchased' ? 'Pas encore acheté finalement' : 'Je l’ai acheté ✓'}
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (!confirmCancel) return setConfirmCancel(true)
              void run(onCancel, true)
            }}
          >
            {confirmCancel ? 'Oui, je ne le prends plus' : 'Annuler ma réservation'}
          </Button>
        </>
      )}
    </div>
  )
}
