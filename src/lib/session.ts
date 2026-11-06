import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirebase, queued } from './firebase'

/**
 * Niveau 2 de confidentialité (lot 6) : lie cet appareil (uid anonyme) au membre choisi,
 * dans `groups/{code}/sessions/{uid}`. Les règles Firestore s'en servent pour refuser
 * à l'appareil du bénéficiaire la lecture des réservations de sa propre liste, et pour
 * réserver à chacun l'annulation de ses réservations.
 */
export async function bindDevice(code: string, memberId: string): Promise<void> {
  const { auth, db } = getFirebase()
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Appareil non connecté')
  await queued(
    setDoc(doc(db, 'groups', code, 'sessions', uid), {
      memberId,
      updatedAt: serverTimestamp(),
    }),
  )
}
