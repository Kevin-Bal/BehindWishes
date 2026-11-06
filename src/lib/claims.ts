import {
  collection,
  deleteDoc,
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
import type { WishStatus } from '../components/ui/StatusChip'
import { getFirebase, queued } from './firebase'
import type { Loadable } from './groups'
import type { Wish } from './wishes'

/**
 * Réservations (E1 à E5). Elles vivent dans `claims`, à part des souhaits :
 * le client d'un bénéficiaire ne s'abonne JAMAIS aux réservations de sa propre liste.
 */
export type ClaimStatus = 'reserved' | 'purchased'

export interface Claim {
  /** `${wishId}_${claimedBy}` : une réservation par personne et par souhait. */
  id: string
  wishId: string
  beneficiaryId: string
  claimedBy: string
  status: ClaimStatus
  claimedAt: Date
}

const claimsRef = (code: string, eventId: string) =>
  collection(getFirebase().db, 'groups', code, 'events', eventId, 'claims')

export const claimId = (wishId: string, memberId: string) => `${wishId}_${memberId}`

/** Je prends ce souhait (E2). Plusieurs personnes peuvent prendre le même. */
export async function reserveWish(code: string, eventId: string, wish: Wish, meId: string) {
  if (wish.beneficiaryId === meId) throw new Error('On ne réserve pas sur sa propre liste.')
  await queued(
    setDoc(doc(claimsRef(code, eventId), claimId(wish.id, meId)), {
      wishId: wish.id,
      beneficiaryId: wish.beneficiaryId,
      claimedBy: meId,
      status: 'reserved',
      claimedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  )
}

/** Réservé ↔ Acheté (E3). */
export async function setClaimStatus(
  code: string,
  eventId: string,
  id: string,
  status: ClaimStatus,
) {
  await queued(
    updateDoc(doc(claimsRef(code, eventId), id), { status, updatedAt: serverTimestamp() }),
  )
}

/** Annuler ma réservation (E3), ou la libérer si le souhait a été supprimé. */
export async function cancelClaim(code: string, eventId: string, id: string) {
  await queued(deleteDoc(doc(claimsRef(code, eventId), id)))
}

function fromSnapshot(snap: DocumentSnapshot): Claim {
  const claimedAt = snap.get('claimedAt', { serverTimestamps: 'estimate' })
  return {
    id: snap.id,
    wishId: String(snap.get('wishId') ?? ''),
    beneficiaryId: String(snap.get('beneficiaryId') ?? ''),
    claimedBy: String(snap.get('claimedBy') ?? ''),
    status: snap.get('status') === 'purchased' ? 'purchased' : 'reserved',
    claimedAt: claimedAt?.toDate?.() ?? new Date(),
  }
}

function useClaimsQuery(
  code: string,
  eventId: string,
  field: 'beneficiaryId' | 'claimedBy',
  value: string,
  enabled: boolean,
): Loadable<Claim[]> {
  const [state, setState] = useState<Loadable<Claim[]>>({ status: 'loading' })
  useEffect(() => {
    if (!enabled) return
    return onSnapshot(
      query(claimsRef(code, eventId), where(field, '==', value)),
      (snap) => setState({ status: 'ready', data: snap.docs.map(fromSnapshot) }),
      (error) => setState({ status: 'error', error }),
    )
  }, [code, eventId, field, value, enabled])
  return enabled ? state : { status: 'ready', data: [] }
}

/**
 * Réservations sur la liste d'un AUTRE (E1). Garde-fou de confidentialité (E5) :
 * si on demande les réservations de sa propre liste, rien n'est lu.
 */
export function useClaimsOnListOf(
  code: string,
  eventId: string,
  beneficiaryId: string,
  meId: string,
): Loadable<Claim[]> {
  return useClaimsQuery(code, eventId, 'beneficiaryId', beneficiaryId, beneficiaryId !== meId)
}

/** Mes réservations dans un évènement (E4). */
export function useMyClaims(code: string, eventId: string, meId: string): Loadable<Claim[]> {
  return useClaimsQuery(code, eventId, 'claimedBy', meId, true)
}

/** Statut affiché d'un souhait : Acheté si quelqu'un l'a acheté, sinon Réservé, sinon Libre. */
export function aggregateStatus(claims: Claim[]): WishStatus {
  if (claims.some((c) => c.status === 'purchased')) return 'purchased'
  return claims.length > 0 ? 'reserved' : 'free'
}

/** « Modifié » : le titre ou le lien a changé après ma réservation. */
export function changedSinceClaim(wish: Wish, claim: Claim): boolean {
  return Boolean(wish.contentUpdatedAt && wish.contentUpdatedAt > claim.claimedAt)
}
