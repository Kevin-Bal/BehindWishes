import {
  collection,
  deleteField,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { getFirebase, queued } from './firebase'
import type { Loadable } from './groups'
import { compareWishes, type Priority } from './wishFormat'

export interface Wish {
  id: string
  beneficiaryId: string
  title: string
  url?: string
  description?: string
  priceEstimate?: number
  priority?: Priority
  /** Image du produit (https), trouvée par la saisie intelligente du lien. */
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
  /** Dernière modification du titre ou du lien : sert à l'étiquette « Modifié » (réservant). */
  contentUpdatedAt?: Date
  deleted: boolean
}

export interface WishDraft {
  title: string
  url?: string
  description?: string
  priceEstimate?: number
  priority?: Priority
  imageUrl?: string
}

const wishesRef = (code: string, eventId: string) =>
  collection(getFirebase().db, 'groups', code, 'events', eventId, 'wishes')

/** Champs facultatifs : absents du document plutôt qu'à `null`. */
function optionalFields(draft: WishDraft) {
  return {
    ...(draft.url ? { url: draft.url } : {}),
    ...(draft.description?.trim() ? { description: draft.description.trim() } : {}),
    ...(draft.priceEstimate !== undefined ? { priceEstimate: draft.priceEstimate } : {}),
    ...(draft.priority ? { priority: draft.priority } : {}),
    ...(draft.imageUrl ? { imageUrl: draft.imageUrl } : {}),
  }
}

export async function addWish(
  code: string,
  eventId: string,
  beneficiaryId: string,
  draft: WishDraft,
) {
  await queued(
    setDoc(doc(wishesRef(code, eventId)), {
      beneficiaryId,
      title: draft.title.trim(),
      ...optionalFields(draft),
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  )
}

export async function updateWish(code: string, eventId: string, previous: Wish, draft: WishDraft) {
  const optional = optionalFields(draft)
  // Titre ou lien changé : le réservant verra « Modifié » (cas limite de la spec).
  const contentChanged =
    draft.title.trim() !== previous.title || (optional.url ?? '') !== (previous.url ?? '')
  await queued(
    updateDoc(doc(wishesRef(code, eventId), previous.id), {
      ...(contentChanged ? { contentUpdatedAt: serverTimestamp() } : {}),
      title: draft.title.trim(),
      url: optional.url ?? deleteField(),
      description: optional.description ?? deleteField(),
      priceEstimate: optional.priceEstimate ?? deleteField(),
      priority: optional.priority ?? deleteField(),
      imageUrl: optional.imageUrl ?? deleteField(),
      updatedAt: serverTimestamp(),
    }),
  )
}

/**
 * Suppression logique (D3) : le souhait disparaît de la liste, mais un éventuel
 * réservant pourra être prévenu (« Souhait supprimé », lot 4).
 */
export async function deleteWish(code: string, eventId: string, wishId: string) {
  await queued(
    updateDoc(doc(wishesRef(code, eventId), wishId), {
      deleted: true,
      updatedAt: serverTimestamp(),
    }),
  )
}

function fromSnapshot(snap: DocumentSnapshot): Wish {
  // Écriture locale en attente : l'horodatage serveur est estimé.
  const opts = { serverTimestamps: 'estimate' } as const
  const priority = snap.get('priority') as number | undefined
  const createdAt = snap.get('createdAt', opts)?.toDate?.() ?? new Date()
  return {
    id: snap.id,
    beneficiaryId: String(snap.get('beneficiaryId') ?? ''),
    title: String(snap.get('title') ?? ''),
    ...(snap.get('url') ? { url: String(snap.get('url')) } : {}),
    ...(snap.get('description') ? { description: String(snap.get('description')) } : {}),
    ...(typeof snap.get('priceEstimate') === 'number'
      ? { priceEstimate: snap.get('priceEstimate') as number }
      : {}),
    ...(priority === 1 || priority === 2 || priority === 3 ? { priority } : {}),
    ...(typeof snap.get('imageUrl') === 'string'
      ? { imageUrl: snap.get('imageUrl') as string }
      : {}),
    createdAt,
    updatedAt: snap.get('updatedAt', opts)?.toDate?.() ?? createdAt,
    ...(snap.get('contentUpdatedAt')
      ? { contentUpdatedAt: snap.get('contentUpdatedAt', opts).toDate() as Date }
      : {}),
    deleted: snap.get('deleted') === true,
  }
}

/**
 * Souhaits visibles d'un évènement (non supprimés), triés (D4).
 * Le regroupement par bénéficiaire se fait côté client.
 * `includeDeleted` : pour « Mes réservations », qui doit signaler un souhait supprimé.
 */
export function useEventWishes(
  code: string,
  eventId: string,
  { includeDeleted = false }: { includeDeleted?: boolean } = {},
): Loadable<Wish[]> {
  const [state, setState] = useState<Loadable<Wish[]>>({ status: 'loading' })
  useEffect(
    () =>
      onSnapshot(
        includeDeleted
          ? wishesRef(code, eventId)
          : query(wishesRef(code, eventId), where('deleted', '==', false)),
        (snap) =>
          setState({
            status: 'ready',
            data: snap.docs.map(fromSnapshot).sort(compareWishes),
          }),
        (error) => setState({ status: 'error', error }),
      ),
    [code, eventId, includeDeleted],
  )
  return state
}
