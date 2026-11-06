import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  addDoc,
  deleteField,
  type FirestoreError,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { defaultAppearance } from './appearance'
import { generateCode } from './code'
import { getFirebase } from './firebase'

/** Limites partagées avec firestore.rules. */
export const LIMITS = {
  groupName: 60,
  memberName: 30,
} as const

export interface Group {
  code: string
  name: string
}

export interface Member {
  id: string
  name: string
  color: string
  emoji?: string
  archived: boolean
}

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: FirestoreError | Error }

const groupRef = (code: string) => doc(getFirebase().db, 'groups', code)
const membersRef = (code: string) => collection(getFirebase().db, 'groups', code, 'members')

/** Le groupe existe-t-il ? (A1) — `get` sur un identifiant précis, jamais de liste. */
export async function groupExists(code: string): Promise<boolean> {
  const snap = await getDoc(groupRef(code))
  return snap.exists()
}

/**
 * Crée le groupe et ses membres en une seule écriture atomique (A3).
 * Si le code tiré existe déjà, la règle `create` refuse (c'est une mise à jour) : on retire un code.
 */
export async function createGroup(name: string, memberNames: string[]): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    if (await groupExists(code)) continue
    const batch = writeBatch(getFirebase().db)
    batch.set(groupRef(code), { name: name.trim(), createdAt: serverTimestamp() })
    memberNames.forEach((memberName, index) => {
      batch.set(doc(membersRef(code)), {
        name: memberName.trim(),
        ...defaultAppearance(index),
        archived: false,
        createdAt: serverTimestamp(),
      })
    })
    await batch.commit()
    return code
  }
  throw new Error('Impossible de générer un code libre, réessaie.')
}

export async function addMember(
  code: string,
  input: { name: string; color: string; emoji?: string },
): Promise<string> {
  const ref = await addDoc(membersRef(code), {
    name: input.name.trim(),
    color: input.color,
    ...(input.emoji ? { emoji: input.emoji } : {}),
    archived: false,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateMember(
  code: string,
  memberId: string,
  changes: Partial<Pick<Member, 'name' | 'color' | 'emoji' | 'archived'>>,
): Promise<void> {
  const data: Record<string, unknown> = { ...changes }
  if (typeof changes.name === 'string') data.name = changes.name.trim()
  // `emoji: undefined` explicite = retirer l'emoji (on revient à l'initiale).
  if ('emoji' in changes && !changes.emoji) data.emoji = deleteField()
  await updateDoc(doc(membersRef(code), memberId), data)
}

const byName = new Intl.Collator('fr-FR', { sensitivity: 'base' })

/** Écoute en temps réel le document du groupe. `null` = code inconnu. */
export function useGroupDoc(code: string): Loadable<Group | null> {
  const [state, setState] = useState<Loadable<Group | null>>({ status: 'loading' })
  useEffect(
    () =>
      onSnapshot(
        groupRef(code),
        (snap) =>
          setState({
            status: 'ready',
            data: snap.exists() ? { code, name: String(snap.get('name') ?? '') } : null,
          }),
        (error) => setState({ status: 'error', error }),
      ),
    [code],
  )
  return state
}

/** Écoute en temps réel les membres, triés par prénom (on retrouve le sien plus vite). */
export function useMembers(code: string): Loadable<Member[]> {
  const [state, setState] = useState<Loadable<Member[]>>({ status: 'loading' })
  useEffect(
    () =>
      onSnapshot(
        membersRef(code),
        (snap) =>
          setState({
            status: 'ready',
            data: snap.docs
              .map((d) => {
                const emoji = d.get('emoji') as string | undefined
                return {
                  id: d.id,
                  name: String(d.get('name') ?? ''),
                  color: String(d.get('color') ?? '#475569'),
                  ...(emoji ? { emoji } : {}),
                  archived: d.get('archived') === true,
                }
              })
              .sort((a, b) => byName.compare(a.name, b.name)),
          }),
        (error) => setState({ status: 'error', error }),
      ),
    [code],
  )
  return state
}
