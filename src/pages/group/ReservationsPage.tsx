import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { GiftIcon } from '../../components/icons'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { StatusChip } from '../../components/ui/StatusChip'
import {
  cancelClaim,
  changedSinceClaim,
  setClaimStatus,
  useMyClaims,
  type Claim,
} from '../../lib/claims'
import { eventTypeInfo, useMyEvents, type GroupEvent } from '../../lib/events'
import { useMe } from '../../lib/groupContext'
import type { Member } from '../../lib/groups'
import { formatPrice, urlDomain } from '../../lib/wishFormat'
import { useEventWishes, type Wish } from '../../lib/wishes'
import { GroupScreen } from './GroupScreen'

interface Summary {
  count: number
  total: number
}

/**
 * « Mes réservations » (E4) : mes cadeaux regroupés par évènement puis par personne,
 * avec statut, lien et total estimé. Lecture évènement par évènement
 * (`claimedBy == moi`) : pas d'index de groupe de collections.
 */
export function ReservationsPage() {
  const { code, me } = useMe()
  const events = useMyEvents(code, me.id)
  const [summaries, setSummaries] = useState<Record<string, Summary>>({})

  const report = useCallback((eventId: string, summary: Summary) => {
    setSummaries((s) =>
      s[eventId]?.count === summary.count && s[eventId]?.total === summary.total
        ? s
        : { ...s, [eventId]: summary },
    )
  }, [])

  const all = Object.values(summaries)
  const count = all.reduce((n, s) => n + s.count, 0)
  const total = all.reduce((n, s) => n + s.total, 0)
  const loaded = events.status === 'ready' && all.length >= events.data.length

  return (
    <GroupScreen title="Mes cadeaux">
      {loaded && count > 0 && (
        <Card className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">Total estimé</p>
            <p className="text-2xl font-bold">{formatPrice(total)}</p>
          </div>
          <p className="text-right text-ink-muted">
            {count} cadeau{count > 1 ? 'x' : ''}
          </p>
        </Card>
      )}

      {events.status === 'loading' && (
        <p role="status" className="py-8 text-center text-ink-muted">
          Chargement…
        </p>
      )}
      {events.status === 'error' && (
        <Card className="text-center">
          <p className="font-semibold">Impossible de charger tes cadeaux.</p>
          <p className="text-ink-muted">Tu es peut-être hors ligne.</p>
        </Card>
      )}

      {events.status === 'ready' &&
        events.data.map((event) => (
          <EventReservations key={event.id} event={event} onSummary={report} />
        ))}

      {loaded && count === 0 && (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <GiftIcon className="size-10 text-ink-muted" />
          <h2 className="text-lg font-semibold">Rien de réservé pour l’instant</h2>
          <p className="text-ink-muted">
            Ouvre la liste de quelqu’un et touche « Je le prends » : le cadeau apparaîtra ici.
          </p>
        </Card>
      )}
    </GroupScreen>
  )
}

function EventReservations({
  event,
  onSummary,
}: {
  event: GroupEvent
  onSummary: (eventId: string, summary: Summary) => void
}) {
  const { code, me, members, basePath } = useMe()
  const claims = useMyClaims(code, event.id, me.id)
  const wishes = useEventWishes(code, event.id, { includeDeleted: true })

  const ready = claims.status === 'ready' && wishes.status === 'ready'
  const rows = ready
    ? claims.data
        .map((claim) => ({ claim, wish: wishes.data.find((w) => w.id === claim.wishId) }))
        .sort((a, b) => a.claim.claimedAt.getTime() - b.claim.claimedAt.getTime())
    : []
  const count = rows.filter((r) => r.wish && !r.wish.deleted).length
  const total = rows.reduce(
    (sum, r) => sum + (r.wish && !r.wish.deleted ? (r.wish.priceEstimate ?? 0) : 0),
    0,
  )

  useEffect(() => {
    if (ready) onSummary(event.id, { count, total })
  }, [ready, count, total, event.id, onSummary])

  if (rows.length === 0) return null

  const byPerson = new Map<string, typeof rows>()
  for (const row of rows) {
    const list = byPerson.get(row.claim.beneficiaryId) ?? []
    list.push(row)
    byPerson.set(row.claim.beneficiaryId, list)
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby={`resa-${event.id}`}>
      <h2 id={`resa-${event.id}`} className="flex items-center gap-2 px-1 text-lg font-semibold">
        <span aria-hidden="true">{eventTypeInfo(event.type).emoji}</span>
        <Link
          to={`${basePath}/e/${event.id}`}
          className="truncate underline-offset-4 hover:underline"
        >
          {event.title}
        </Link>
      </h2>
      {[...byPerson.entries()].map(([beneficiaryId, personRows]) => {
        const person = members.find((m) => m.id === beneficiaryId)
        return (
          <Card key={beneficiaryId} className="flex flex-col gap-1 p-3">
            <PersonHeader person={person} />
            <ul className="flex flex-col divide-y divide-line">
              {personRows.map(({ claim, wish }) => (
                <li key={claim.id} className="py-2">
                  <ReservationRow code={code} eventId={event.id} claim={claim} wish={wish} />
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </section>
  )
}

function PersonHeader({ person }: { person: Member | undefined }) {
  if (!person) return <p className="px-1 font-semibold">Pour quelqu’un</p>
  return (
    <div className="flex items-center gap-2 px-1 pb-1">
      <Avatar name={person.name} color={person.color} emoji={person.emoji} size="sm" />
      <p className="font-semibold">Pour {person.name}</p>
    </div>
  )
}

function ReservationRow({
  code,
  eventId,
  claim,
  wish,
}: {
  code: string
  eventId: string
  claim: Claim
  wish: Wish | undefined
}) {
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [error, setError] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(false)
    try {
      await action()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  // Cas limite : le bénéficiaire a supprimé le souhait après ma réservation.
  if (!wish || wish.deleted) {
    return (
      <div className="flex flex-wrap items-center gap-2 px-1">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-muted line-through">{wish?.title ?? 'Souhait'}</p>
          <p className="text-sm font-semibold text-danger">Souhait supprimé de la liste</p>
        </div>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => void run(() => cancelClaim(code, eventId, claim.id))}
        >
          Libérer
        </Button>
      </div>
    )
  }

  const purchased = claim.status === 'purchased'
  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-[60%] flex-1">
          <p className="font-semibold break-words">{wish.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 text-sm">
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
                {urlDomain(wish.url)} ↗<span className="sr-only"> (nouvel onglet)</span>
              </a>
            )}
            {changedSinceClaim(wish, claim) && (
              <span className="rounded-full bg-reserved-bg px-2 py-0.5 text-xs font-bold text-reserved">
                Modifié
              </span>
            )}
          </div>
        </div>
        <StatusChip status={claim.status} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={purchased ? 'secondary' : 'primary'}
          disabled={busy}
          onClick={() =>
            void run(() =>
              setClaimStatus(code, eventId, claim.id, purchased ? 'reserved' : 'purchased'),
            )
          }
        >
          {purchased ? 'Pas encore acheté' : 'Je l’ai acheté ✓'}
          <span className="sr-only"> : « {wish.title} »</span>
        </Button>
        <Button
          variant={confirmCancel ? 'danger' : 'secondary'}
          disabled={busy}
          onClick={() => {
            if (!confirmCancel) return setConfirmCancel(true)
            void run(() => cancelClaim(code, eventId, claim.id))
          }}
        >
          {confirmCancel ? 'Oui, je ne le prends plus' : 'Je ne le prends plus'}
          <span className="sr-only"> : « {wish.title} »</span>
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          Action impossible. Vérifie ta connexion.
        </p>
      )}
    </div>
  )
}
