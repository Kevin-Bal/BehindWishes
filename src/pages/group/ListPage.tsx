import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ClaimSheet } from '../../components/ClaimSheet'
import { WishCard } from '../../components/WishCard'
import { WishSheet } from '../../components/WishSheet'
import { GlassButton } from '../../components/glass'
import { ChevronLeftIcon, GiftIcon, PlusIcon } from '../../components/icons'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusChip } from '../../components/ui/StatusChip'
import {
  aggregateStatus,
  cancelClaim,
  changedSinceClaim,
  claimId,
  reserveWish,
  setClaimStatus,
  useClaimsOnListOf,
  type Claim,
} from '../../lib/claims'
import { useEvent } from '../../lib/events'
import { useMe } from '../../lib/groupContext'
import { useEventTheme } from '../../lib/useEventTheme'
import { addWish, deleteWish, updateWish, useEventWishes, type Wish } from '../../lib/wishes'
import { GroupScreen } from './GroupScreen'

type SheetState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; wish: Wish }
  | { mode: 'claim'; wishId: string }

/**
 * Liste d'une personne dans un évènement.
 * - Ma liste : mode édition (D2, D3), AUCUNE trace de réservation (E5) : les
 *   réservations de ma liste ne sont même pas lues.
 * - Liste d'un autre : statuts Libre / Réservé / Acheté, prénoms au tap, réservation (E1-E3).
 */
export function ListPage() {
  const { code, me, members, basePath } = useMe()
  const { eventId = '', memberId = '' } = useParams()
  const event = useEvent(code, eventId)
  const wishes = useEventWishes(code, eventId)
  // Confidentialité (E5) : désactivé quand memberId === me.id, rien n'est lu.
  const claims = useClaimsOnListOf(code, eventId, memberId, me.id)
  const [busyWish, setBusyWish] = useState<string>()
  const [sheet, setSheet] = useState<SheetState>({ mode: 'closed' })
  useEventTheme(event.status === 'ready' ? event.data?.type : undefined)

  const eventPath = `${basePath}/e/${eventId}`
  const back = (
    <Link
      to={eventPath}
      aria-label="Retour à l’évènement"
      className="-ml-2 flex size-11 items-center justify-center rounded-full"
    >
      <ChevronLeftIcon className="size-6" />
    </Link>
  )

  if (event.status === 'loading') return <StateMessage title="Chargement…" busy />
  if (event.status === 'error' || !event.data || !event.data.participantIds.includes(me.id)) {
    return (
      <StateMessage title="Liste introuvable">
        <Link to={basePath} className="font-semibold text-accent underline underline-offset-4">
          Retour aux évènements
        </Link>
      </StateMessage>
    )
  }

  const owner = members.find((m) => m.id === memberId)
  const isMine = memberId === me.id
  // Bénéficiaire retiré de l'évènement (C3) : sa liste est masquée, ses souhaits conservés.
  if (!owner || !event.data.beneficiaryIds.includes(memberId)) {
    return (
      <StateMessage title="Cette liste n’est plus affichée">
        <Link to={eventPath} className="font-semibold text-accent underline underline-offset-4">
          Retour à l’évènement
        </Link>
      </StateMessage>
    )
  }

  const list =
    wishes.status === 'ready' ? wishes.data.filter((w) => w.beneficiaryId === memberId) : []
  const editing = sheet.mode === 'edit' ? list.find((w) => w.id === sheet.wish.id) : undefined
  const claimsOf = (wishId: string): Claim[] =>
    !isMine && claims.status === 'ready' ? claims.data.filter((c) => c.wishId === wishId) : []
  const claimWish = sheet.mode === 'claim' ? list.find((w) => w.id === sheet.wishId) : undefined
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? 'Quelqu’un'
  const myClaimId = claimWish ? claimId(claimWish.id, me.id) : ''

  /** Un tap (E2) ; si quelqu'un l'a déjà pris, on passe par la confirmation douce. */
  async function quickReserve(wish: Wish) {
    if (claimsOf(wish.id).length > 0) return setSheet({ mode: 'claim', wishId: wish.id })
    setBusyWish(wish.id)
    try {
      await reserveWish(code, eventId, wish, me.id)
    } catch {
      setSheet({ mode: 'claim', wishId: wish.id })
    } finally {
      setBusyWish(undefined)
    }
  }

  return (
    <GroupScreen
      title={isMine ? 'Ma liste' : `Liste de ${owner.name}`}
      leading={back}
      fab={
        isMine ? (
          <GlassButton
            variant="tint"
            shape="fab"
            aria-label="Ajouter un souhait"
            onClick={() => setSheet({ mode: 'add' })}
          >
            <PlusIcon className="size-7" />
          </GlassButton>
        ) : undefined
      }
    >
      <div className="flex items-center gap-3 px-1">
        <Avatar name={owner.name} color={owner.color} emoji={owner.emoji} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{event.data.title}</p>
          <p className="text-sm text-ink-muted">
            {list.length === 0
              ? 'Aucun souhait'
              : `${list.length} souhait${list.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {wishes.status === 'loading' && (
        <p role="status" className="py-8 text-center text-ink-muted">
          Chargement des souhaits…
        </p>
      )}
      {wishes.status === 'error' && (
        <Card className="text-center">
          <p className="font-semibold">Impossible de charger la liste.</p>
          <p className="text-ink-muted">Tu es peut-être hors ligne.</p>
        </Card>
      )}

      {wishes.status === 'ready' && list.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <GiftIcon className="size-10 text-ink-muted" />
          {isMine ? (
            <>
              <h2 className="text-lg font-semibold">Ta liste est vide</h2>
              <p className="text-ink-muted">Ajoute ta première idée, même toute simple.</p>
              <Button variant="primary" onClick={() => setSheet({ mode: 'add' })}>
                Ajouter un souhait
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">{owner.name} n’a encore rien demandé</h2>
              <p className="text-ink-muted">Repasse un peu plus tard.</p>
            </>
          )}
        </Card>
      )}

      {list.length > 0 && (
        <ul className="flex flex-col gap-3">
          {list.map((wish) => (
            <li key={wish.id}>
              {isMine ? (
                <WishCard wish={wish} onOpen={() => setSheet({ mode: 'edit', wish })} />
              ) : (
                <WishCard
                  wish={wish}
                  openLabel="Voir qui l’a pris"
                  onOpen={() => setSheet({ mode: 'claim', wishId: wish.id })}
                  footer={
                    <ClaimFooter
                      claims={claimsOf(wish.id)}
                      wish={wish}
                      meId={me.id}
                      nameOf={nameOf}
                      busy={busyWish === wish.id || claims.status !== 'ready'}
                      onReserve={() => void quickReserve(wish)}
                      onOpen={() => setSheet({ mode: 'claim', wishId: wish.id })}
                    />
                  }
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {isMine && (
        <WishSheet
          open={sheet.mode === 'add' || Boolean(editing)}
          onClose={() => setSheet({ mode: 'closed' })}
          wish={editing}
          onSubmit={(draft) =>
            editing
              ? updateWish(code, eventId, editing, draft)
              : addWish(code, eventId, me.id, draft)
          }
          onDelete={editing ? () => deleteWish(code, eventId, editing.id) : undefined}
        />
      )}

      {!isMine && (
        <ClaimSheet
          open={Boolean(claimWish)}
          onClose={() => setSheet({ mode: 'closed' })}
          wish={claimWish}
          claims={claimWish ? claimsOf(claimWish.id) : []}
          meId={me.id}
          members={members}
          onReserve={async () => {
            if (claimWish) await reserveWish(code, eventId, claimWish, me.id)
          }}
          onSetPurchased={(purchased) =>
            setClaimStatus(code, eventId, myClaimId, purchased ? 'purchased' : 'reserved')
          }
          onCancel={() => cancelClaim(code, eventId, myClaimId)}
        />
      )}
    </GroupScreen>
  )
}

/** Pied de carte sur la liste d'un autre : statut, prénoms, et mon action. */
function ClaimFooter({
  claims,
  wish,
  meId,
  nameOf,
  busy,
  onReserve,
  onOpen,
}: {
  claims: Claim[]
  wish: Wish
  meId: string
  nameOf: (id: string) => string
  busy: boolean
  onReserve: () => void
  onOpen: () => void
}) {
  const mine = claims.find((c) => c.claimedBy === meId)
  const names = claims.map((c) => (c.claimedBy === meId ? 'toi' : nameOf(c.claimedBy))).join(', ')
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
        aria-label={`${claims.length === 0 ? 'Libre' : `Pris par ${names}`}. Détail de « ${wish.title} »`}
      >
        <StatusChip status={aggregateStatus(claims)} count={claims.length} />
        {claims.length > 0 && <span className="truncate text-sm text-ink-muted">{names}</span>}
      </button>
      {mine && changedSinceClaim(wish, mine) && (
        <span className="rounded-full bg-reserved-bg px-2 py-0.5 text-xs font-bold text-reserved">
          Modifié
        </span>
      )}
      {mine ? (
        <Button onClick={onOpen}>
          {mine.status === 'purchased' ? 'Acheté ✓' : 'Ton cadeau'}
          <span className="sr-only"> : « {wish.title} »</span>
        </Button>
      ) : (
        <Button variant="primary" onClick={onReserve} disabled={busy}>
          Je le prends
          <span className="sr-only"> : « {wish.title} »</span>
        </Button>
      )}
    </div>
  )
}
