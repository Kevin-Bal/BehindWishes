import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { compareEventDates } from './dates'
import { getFirebase } from './firebase'
import type { Loadable, Member } from './groups'

/** Limites partagées avec firestore.rules. */
export const EVENT_LIMITS = {
  title: 80,
  members: 100,
} as const

export type EventType = 'noel' | 'anniversaire' | 'autre'

export const EVENT_TYPES: ReadonlyArray<{ value: EventType; label: string; emoji: string }> = [
  { value: 'noel', label: 'Noël', emoji: '🎄' },
  { value: 'anniversaire', label: 'Anniversaire', emoji: '🎂' },
  { value: 'autre', label: 'Autre', emoji: '🎁' },
]

export function eventTypeInfo(type: EventType) {
  return EVENT_TYPES.find((t) => t.value === type) ?? EVENT_TYPES[2]!
}

export interface GroupEvent {
  id: string
  title: string
  type: EventType
  date: Date | null
  beneficiaryIds: string[]
  participantIds: string[]
  archived: boolean
  /** Membre qui a créé l'évènement : seul lui peut le supprimer (C3). */
  createdBy: string
}

export interface EventDraft {
  title: string
  type: EventType
  date: Date | null
  beneficiaryIds: string[]
  participantIds: string[]
}

/**
 * Préréglages par type (C2). Noël : tout le monde dans les deux listes.
 * Anniversaire : tout le monde participe, bénéficiaire à choisir. Autre : au choix.
 */
export function presetFor(
  type: EventType,
  activeMembers: Member[],
  meId: string,
): Pick<EventDraft, 'beneficiaryIds' | 'participantIds'> {
  const everyone = activeMembers.map((m) => m.id)
  switch (type) {
    case 'noel':
      return { beneficiaryIds: everyone, participantIds: everyone }
    case 'anniversaire':
      return { beneficiaryIds: [], participantIds: everyone }
    case 'autre':
      return { beneficiaryIds: [], participantIds: everyone.includes(meId) ? [meId] : [] }
  }
}

/** Tout bénéficiaire est aussi participant (C2). */
export function withBeneficiariesAsParticipants(draft: EventDraft): EventDraft {
  const participants = new Set(draft.participantIds)
  for (const id of draft.beneficiaryIds) participants.add(id)
  return { ...draft, participantIds: [...participants] }
}

const eventsRef = (code: string) => collection(getFirebase().db, 'groups', code, 'events')

function toPayload(draft: EventDraft) {
  const clean = withBeneficiariesAsParticipants(draft)
  return {
    title: clean.title.trim(),
    type: clean.type,
    date: clean.date ? Timestamp.fromDate(clean.date) : null,
    beneficiaryIds: clean.beneficiaryIds,
    participantIds: clean.participantIds,
  }
}

export async function createEvent(code: string, draft: EventDraft, createdBy: string) {
  const ref = await addDoc(eventsRef(code), {
    ...toPayload(draft),
    archived: false,
    createdBy,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateEvent(code: string, eventId: string, draft: EventDraft) {
  await updateDoc(doc(eventsRef(code), eventId), toPayload(draft))
}

export async function setEventArchived(code: string, eventId: string, archived: boolean) {
  await updateDoc(doc(eventsRef(code), eventId), { archived })
}

export async function deleteEvent(code: string, eventId: string) {
  await deleteDoc(doc(eventsRef(code), eventId))
}

function fromSnapshot(snap: DocumentSnapshot): GroupEvent {
  const date = snap.get('date') as Timestamp | null | undefined
  const type = snap.get('type') as EventType
  return {
    id: snap.id,
    title: String(snap.get('title') ?? ''),
    type: EVENT_TYPES.some((t) => t.value === type) ? type : 'autre',
    date: date ? date.toDate() : null,
    beneficiaryIds: (snap.get('beneficiaryIds') as string[] | undefined) ?? [],
    participantIds: (snap.get('participantIds') as string[] | undefined) ?? [],
    archived: snap.get('archived') === true,
    createdBy: String(snap.get('createdBy') ?? ''),
  }
}

/**
 * Évènements où je suis participant (C1), triés par date (sans date à la fin).
 * Le filtre « archivé » est fait côté client : pas d'index composite à maintenir.
 */
export function useMyEvents(code: string, meId: string): Loadable<GroupEvent[]> {
  const [state, setState] = useState<Loadable<GroupEvent[]>>({ status: 'loading' })
  useEffect(
    () =>
      onSnapshot(
        query(eventsRef(code), where('participantIds', 'array-contains', meId)),
        (snap) =>
          setState({
            status: 'ready',
            data: snap.docs.map(fromSnapshot).sort((a, b) => compareEventDates(a.date, b.date)),
          }),
        (error) => setState({ status: 'error', error }),
      ),
    [code, meId],
  )
  return state
}

/** Un évènement en temps réel. `null` = introuvable (supprimé). */
export function useEvent(code: string, eventId: string): Loadable<GroupEvent | null> {
  const [state, setState] = useState<Loadable<GroupEvent | null>>({ status: 'loading' })
  useEffect(
    () =>
      onSnapshot(
        doc(eventsRef(code), eventId),
        (snap) => setState({ status: 'ready', data: snap.exists() ? fromSnapshot(snap) : null }),
        (error) => setState({ status: 'error', error }),
      ),
    [code, eventId],
  )
  return state
}
