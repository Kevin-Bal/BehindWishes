import { Link, useParams } from 'react-router'
import { Screen } from '../../components/Screen'
import { ChevronLeftIcon } from '../../components/icons'
import { Avatar } from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'
import { StateMessage } from '../../components/ui/StateMessage'
import { countdownLabel, formatLongDate } from '../../lib/dates'
import { eventTypeInfo, useEvent } from '../../lib/events'
import { useMe } from '../../lib/groupContext'
import type { Member } from '../../lib/groups'
import { useEventTheme } from '../../lib/useEventTheme'
import { useEventWishes } from '../../lib/wishes'

/** Page d'un évènement : la liste de chaque bénéficiaire, la mienne en premier (D1). */
export function EventPage() {
  const { code, me, members, basePath } = useMe()
  const { eventId = '' } = useParams()
  const event = useEvent(code, eventId)
  const wishes = useEventWishes(code, eventId)
  useEventTheme(event.status === 'ready' ? event.data?.type : undefined)

  if (event.status === 'loading') return <StateMessage title="Chargement…" busy />
  if (event.status === 'error' || !event.data) {
    return (
      <StateMessage title="Évènement introuvable">
        <p className="text-ink-muted">Il a peut-être été supprimé.</p>
        <Link to={basePath} className="font-semibold text-accent underline underline-offset-4">
          Retour aux évènements
        </Link>
      </StateMessage>
    )
  }

  const e = event.data
  // Membre non participant : l'évènement lui est invisible.
  if (!e.participantIds.includes(me.id)) {
    return (
      <StateMessage title="Évènement réservé aux participants">
        <Link to={basePath} className="font-semibold text-accent underline underline-offset-4">
          Retour aux évènements
        </Link>
      </StateMessage>
    )
  }

  const info = eventTypeInfo(e.type)
  const beneficiaries = e.beneficiaryIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m))
    .sort((a, b) => (a.id === me.id ? -1 : b.id === me.id ? 1 : 0))

  return (
    <Screen
      title={e.title}
      leading={
        <Link
          to={basePath}
          aria-label="Retour aux évènements"
          className="-ml-2 flex size-11 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
      }
    >
      <Card className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-4xl leading-none">
            {info.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-muted">{info.label}</p>
            <p className="font-semibold first-letter:uppercase">
              {e.date ? formatLongDate(e.date) : 'Date à définir'}
            </p>
          </div>
          {e.date && (
            <span className="rounded-full bg-accent px-3 py-1 font-bold text-on-accent">
              {countdownLabel(e.date)}
            </span>
          )}
        </div>
        {e.archived && (
          <p className="mt-2 rounded-xl bg-surface-muted p-2 text-sm text-ink-muted">
            Cet évènement est archivé.
          </p>
        )}
        <Link
          to={`${basePath}/e/${e.id}/modifier`}
          className="mt-2 self-start text-sm font-semibold text-accent underline underline-offset-4"
        >
          Modifier l’évènement
        </Link>
      </Card>

      <h2 className="px-1 text-lg font-semibold">Les listes</h2>
      <ul className="flex flex-col gap-3">
        {beneficiaries.map((m) => {
          const isMine = m.id === me.id
          const count =
            wishes.status === 'ready'
              ? wishes.data.filter((w) => w.beneficiaryId === m.id).length
              : null
          return (
            <li key={m.id}>
              <Link
                to={`${basePath}/e/${e.id}/l/${m.id}`}
                className="flex items-center gap-3 rounded-[20px] border border-line bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-200 active:scale-[0.98]"
              >
                <Avatar name={m.name} color={m.color} emoji={m.emoji} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">
                    {isMine ? 'Ma liste' : `Liste de ${m.name}`}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {count === null
                      ? '…'
                      : count === 0
                        ? isMine
                          ? 'Vide : ajoute ta première idée'
                          : 'Pas encore de souhait'
                        : `${count} souhait${count > 1 ? 's' : ''}`}
                  </p>
                </div>
                <span aria-hidden="true" className="text-2xl text-ink-muted">
                  ›
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}
