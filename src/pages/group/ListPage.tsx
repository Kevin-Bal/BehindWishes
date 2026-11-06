import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Screen } from '../../components/Screen'
import { WishCard } from '../../components/WishCard'
import { WishSheet } from '../../components/WishSheet'
import { GlassButton } from '../../components/glass'
import { ChevronLeftIcon, GiftIcon, PlusIcon } from '../../components/icons'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { StateMessage } from '../../components/ui/StateMessage'
import { useEvent } from '../../lib/events'
import { useMe } from '../../lib/groupContext'
import { useEventTheme } from '../../lib/useEventTheme'
import { addWish, deleteWish, updateWish, useEventWishes, type Wish } from '../../lib/wishes'

type SheetState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; wish: Wish }

/**
 * Liste d'une personne dans un évènement. Ma liste = mode édition (D2, D3),
 * sans aucune trace de réservation. Liste d'un autre = consultation (statuts au lot 4).
 */
export function ListPage() {
  const { code, me, members, basePath } = useMe()
  const { eventId = '', memberId = '' } = useParams()
  const event = useEvent(code, eventId)
  const wishes = useEventWishes(code, eventId)
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

  return (
    <Screen
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
              <WishCard
                wish={wish}
                onEdit={isMine ? () => setSheet({ mode: 'edit', wish }) : undefined}
              />
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
              ? updateWish(code, eventId, editing.id, draft)
              : addWish(code, eventId, me.id, draft)
          }
          onDelete={editing ? () => deleteWish(code, eventId, editing.id) : undefined}
        />
      )}
    </Screen>
  )
}
