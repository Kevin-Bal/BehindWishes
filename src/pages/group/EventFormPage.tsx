import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MemberPicker } from '../../components/MemberPicker'
import { Screen } from '../../components/Screen'
import { SegmentedControl } from '../../components/glass'
import { ChevronLeftIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { StateMessage } from '../../components/ui/StateMessage'
import { TextField } from '../../components/ui/TextField'
import { fromDateInputValue, toDateInputValue } from '../../lib/dates'
import {
  createEvent,
  deleteEvent,
  EVENT_LIMITS,
  EVENT_TYPES,
  presetFor,
  setEventArchived,
  updateEvent,
  useEvent,
  type EventDraft,
  type EventType,
  type GroupEvent,
} from '../../lib/events'
import { useMe } from '../../lib/groupContext'
import type { Member } from '../../lib/groups'
import { useEventTheme } from '../../lib/useEventTheme'

/** Création (C2) ou modification (C3) d'un évènement. */
export function EventFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { code } = useMe()
  const { eventId = '' } = useParams()
  if (mode === 'create') return <EventForm />
  return <EditLoader code={code} eventId={eventId} />
}

function EditLoader({ code, eventId }: { code: string; eventId: string }) {
  const event = useEvent(code, eventId)
  if (event.status === 'loading') return <StateMessage title="Chargement…" busy />
  if (event.status === 'error' || !event.data) {
    return <StateMessage title="Évènement introuvable" />
  }
  return <EventForm key={event.data.id} existing={event.data} />
}

/** Prochain Noël : cette année, ou l'an prochain si le 25 décembre est passé. */
function nextChristmas(now = new Date()): Date {
  const thisYear = new Date(now.getFullYear(), 11, 25, 12)
  return now.getTime() > new Date(now.getFullYear(), 11, 26).getTime()
    ? new Date(now.getFullYear() + 1, 11, 25, 12)
    : thisYear
}

function suggestedTitle(type: EventType, beneficiaries: Member[]): string {
  if (type === 'noel') return `Noël ${nextChristmas().getFullYear()}`
  if (type === 'anniversaire' && beneficiaries.length === 1) {
    return `Anniversaire de ${beneficiaries[0]?.name}`
  }
  return ''
}

function EventForm({ existing }: { existing?: GroupEvent }) {
  const { code, me, members, basePath } = useMe()
  const navigate = useNavigate()
  const active = members.filter((m) => !m.archived)

  const [draft, setDraft] = useState<EventDraft>(() =>
    existing
      ? {
          title: existing.title,
          type: existing.type,
          date: existing.date,
          beneficiaryIds: existing.beneficiaryIds,
          participantIds: existing.participantIds,
        }
      : {
          title: suggestedTitle('noel', []),
          type: 'noel',
          date: nextChristmas(),
          ...presetFor('noel', active, me.id),
        },
  )
  // Tant que le titre n'a pas été retouché, on le propose d'après le type et le bénéficiaire.
  const [titleTouched, setTitleTouched] = useState(Boolean(existing))
  const [errors, setErrors] = useState<{ title?: string; beneficiaries?: string; submit?: string }>(
    {},
  )
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<'none' | 'save' | 'archive' | 'delete'>('none')

  useEventTheme(draft.type)

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? '?'
  const removedBeneficiaries = existing
    ? existing.beneficiaryIds.filter((id) => !draft.beneficiaryIds.includes(id))
    : []
  const participantIds = [...new Set([...draft.participantIds, ...draft.beneficiaryIds])]
  const meIncluded = participantIds.includes(me.id)

  function update(changes: Partial<EventDraft>) {
    setDraft((d) => {
      const next = { ...d, ...changes }
      if (!titleTouched) {
        const beneficiaries = active.filter((m) => next.beneficiaryIds.includes(m.id))
        next.title = suggestedTitle(next.type, beneficiaries) || (existing ? next.title : '')
      }
      return next
    })
    setConfirm('none')
  }

  function changeType(type: EventType) {
    // Préréglage seulement à la création : on ne casse pas un évènement existant.
    if (existing) return update({ type })
    update({
      type,
      date: type === 'noel' ? nextChristmas() : draft.type === 'noel' ? null : draft.date,
      ...presetFor(type, active, me.id),
    })
  }

  async function run(action: () => Promise<unknown>, after: () => void) {
    setBusy(true)
    try {
      await action()
      after()
    } catch {
      setErrors({ submit: 'Enregistrement impossible. Vérifie ta connexion et réessaie.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!draft.title.trim()) nextErrors.title = 'Donne un titre, par exemple « Noël 2026 ».'
    if (draft.beneficiaryIds.length === 0) {
      nextErrors.beneficiaries = 'Choisis au moins une personne qui fait une liste.'
    }
    setErrors(nextErrors)
    if (nextErrors.title || nextErrors.beneficiaries) return

    // Retirer un bénéficiaire masque sa liste : on demande confirmation (C3).
    if (removedBeneficiaries.length > 0 && confirm !== 'save') return setConfirm('save')

    if (existing) {
      await run(
        () => updateEvent(code, existing.id, draft),
        () => navigate(`${basePath}/e/${existing.id}`, { replace: true }),
      )
    } else {
      let id = ''
      await run(
        async () => {
          id = await createEvent(code, draft, me.id)
        },
        () => navigate(`${basePath}/e/${id}`, { replace: true }),
      )
    }
  }

  const backTo = existing ? `${basePath}/e/${existing.id}` : basePath

  return (
    <Screen
      title={existing ? 'Modifier l’évènement' : 'Nouvel évènement'}
      leading={
        <Link
          to={backTo}
          aria-label="Retour"
          className="-ml-2 flex size-11 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-semibold" id="event-type-label">
              Type
            </span>
            <SegmentedControl
              label="Type d’évènement"
              value={draft.type}
              onChange={changeType}
              options={EVENT_TYPES.map((t) => ({ value: t.value, label: `${t.emoji} ${t.label}` }))}
            />
            {!existing && draft.type === 'autre' && (
              <p className="text-sm text-ink-muted">Naissance, mariage, pot de départ…</p>
            )}
          </div>
          <TextField
            label="Titre"
            value={draft.title}
            maxLength={EVENT_LIMITS.title}
            placeholder={draft.type === 'autre' ? 'Naissance de Jules' : 'Noël 2026'}
            onChange={(e) => {
              setTitleTouched(true)
              setDraft((d) => ({ ...d, title: e.target.value }))
              setErrors((x) => ({ ...x, title: undefined }))
            }}
            error={errors.title}
            autoComplete="off"
          />
          <TextField
            label="Date (facultative)"
            type="date"
            value={toDateInputValue(draft.date)}
            onChange={(e) => update({ date: fromDateInputValue(e.target.value) })}
          />
        </Card>

        <Card>
          <MemberPicker
            legend="Qui fait une liste ?"
            hint="Les bénéficiaires ne verront jamais ce qui est réservé sur leur liste."
            members={active}
            selected={draft.beneficiaryIds}
            onChange={(ids) => {
              update({ beneficiaryIds: ids })
              setErrors((x) => ({ ...x, beneficiaries: undefined }))
            }}
            error={errors.beneficiaries}
          />
        </Card>

        <Card className="flex flex-col gap-2">
          <MemberPicker
            legend="Qui participe ?"
            hint="Les participants voient les listes et peuvent réserver."
            members={active}
            selected={draft.participantIds}
            onChange={(ids) => update({ participantIds: ids })}
            locked={{ ids: draft.beneficiaryIds, reason: 'a une liste' }}
          />
          {!meIncluded && (
            <p role="status" className="rounded-xl bg-reserved-bg p-3 text-sm text-reserved">
              Tu n’es pas participant : cet évènement n’apparaîtra pas chez toi.
            </p>
          )}
        </Card>

        {confirm === 'save' && (
          <Card role="alert" className="border-danger/40">
            <p className="font-semibold">
              Retirer {removedBeneficiaries.map(nameOf).join(', ')} des listes ?
            </p>
            <p className="text-sm text-ink-muted">
              Sa liste sera masquée dans cet évènement. Ses souhaits sont conservés et
              réapparaîtront si tu le remets.
            </p>
          </Card>
        )}

        {errors.submit && (
          <p role="alert" className="text-center font-semibold text-danger">
            {errors.submit}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={busy}>
          {busy
            ? 'Enregistrement…'
            : confirm === 'save'
              ? 'Oui, enregistrer'
              : existing
                ? 'Enregistrer'
                : 'Créer l’évènement'}
        </Button>

        {existing && (
          <Card className="flex flex-col gap-2">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                if (!existing.archived && confirm !== 'archive') return setConfirm('archive')
                void run(
                  () => setEventArchived(code, existing.id, !existing.archived),
                  () => navigate(basePath, { replace: true }),
                )
              }}
            >
              {existing.archived
                ? 'Désarchiver l’évènement'
                : confirm === 'archive'
                  ? 'Oui, archiver'
                  : 'Archiver l’évènement'}
            </Button>
            {confirm === 'archive' && (
              <p role="status" className="text-center text-sm text-ink-muted">
                Il disparaît de l’accueil mais reste consultable dans « Évènements archivés ».
              </p>
            )}
            {existing.createdBy === me.id && (
              <>
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => {
                    if (confirm !== 'delete') return setConfirm('delete')
                    void run(
                      () => deleteEvent(code, existing.id),
                      () => navigate(basePath, { replace: true }),
                    )
                  }}
                >
                  {confirm === 'delete' ? 'Oui, supprimer définitivement' : 'Supprimer l’évènement'}
                </Button>
                {confirm === 'delete' && (
                  <p role="status" className="text-center text-sm text-ink-muted">
                    Cette action est définitive. Préfère l’archivage pour garder l’historique.
                  </p>
                )}
              </>
            )}
          </Card>
        )}
      </form>
    </Screen>
  )
}
