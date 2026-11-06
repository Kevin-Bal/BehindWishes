import { useState } from 'react'
import { useNavigate } from 'react-router'
import { EventCard } from '../../components/EventCard'
import { InviteCard } from '../../components/InviteCard'
import { GlassButton } from '../../components/glass'
import { CalendarIcon, PlusIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useMyEvents } from '../../lib/events'
import { useMe } from '../../lib/groupContext'
import { GroupScreen } from './GroupScreen'

/** Accueil du groupe : mes évènements, triés par date (C1). */
export function GroupHomePage() {
  const { group, code, me, members, basePath } = useMe()
  const navigate = useNavigate()
  const events = useMyEvents(code, me.id)
  const [showArchived, setShowArchived] = useState(false)

  const active = events.status === 'ready' ? events.data.filter((e) => !e.archived) : []
  const archived = events.status === 'ready' ? events.data.filter((e) => e.archived) : []
  const newEvent = () => navigate(`${basePath}/e/nouveau`)

  return (
    <GroupScreen
      title={group.name}
      fab={
        <GlassButton variant="tint" shape="fab" aria-label="Nouvel évènement" onClick={newEvent}>
          <PlusIcon className="size-7" />
        </GlassButton>
      }
    >
      {events.status === 'loading' && (
        <p role="status" className="py-8 text-center text-ink-muted">
          Chargement des évènements…
        </p>
      )}
      {events.status === 'error' && (
        <Card className="text-center">
          <p className="font-semibold">Impossible de charger les évènements.</p>
          <p className="text-ink-muted">Tu es peut-être hors ligne.</p>
        </Card>
      )}

      {events.status === 'ready' && active.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <CalendarIcon className="size-10 text-ink-muted" />
          <h2 className="text-lg font-semibold">Aucun évènement pour l’instant</h2>
          <p className="text-ink-muted">Crée « Noël 2026 » ou un anniversaire pour commencer.</p>
          <Button variant="primary" onClick={newEvent}>
            Créer un évènement
          </Button>
        </Card>
      )}

      {active.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="Mes évènements">
          {active.map((event) => (
            <li key={event.id}>
              <EventCard event={event} members={members} to={`${basePath}/e/${event.id}`} />
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
            className="flex min-h-11 items-center justify-between rounded-2xl px-1 font-semibold text-ink-muted"
          >
            Évènements archivés ({archived.length})
            <span aria-hidden="true">{showArchived ? '−' : '+'}</span>
          </button>
          {showArchived && (
            <ul className="flex flex-col gap-3">
              {archived.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} members={members} to={`${basePath}/e/${event.id}`} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {events.status === 'ready' && active.length === 0 && (
        <InviteCard code={code} groupName={group.name} />
      )}
    </GroupScreen>
  )
}
