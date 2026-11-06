/**
 * Tests des règles Firestore, exécutés contre l'émulateur :
 *   npm run test:rules   (lance l'émulateur, nécessite Java 21+)
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PROJECT_ID = 'demo-derriere-la-liste'
const CODE = 'K7M2QX4P'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
})

/** Le SDK de test renvoie une instance « compat », compatible avec l'API modulaire. */
const asDevice = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore
const asAnonymous = () => env.unauthenticatedContext().firestore() as unknown as Firestore

const member = (name: string) => ({
  name,
  color: '#b8322a',
  emoji: '🦊',
  archived: false,
  createdAt: serverTimestamp(),
})

/** Crée un groupe et un membre sans passer par les règles. */
async function seedGroup() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore
    await setDoc(doc(db, 'groups', CODE), { name: 'Famille', createdAt: new Date() })
    await setDoc(doc(db, 'groups', CODE, 'members', 'lea'), {
      name: 'Léa',
      color: '#b8322a',
      archived: false,
      createdAt: new Date(),
    })
  })
}

describe('groups', () => {
  it('crée un groupe et ses membres en une écriture (A3)', async () => {
    const db = asDevice('alice')
    const batch = writeBatch(db)
    batch.set(doc(db, 'groups', CODE), { name: 'Famille', createdAt: serverTimestamp() })
    batch.set(doc(collection(db, 'groups', CODE, 'members')), member('Léa'))
    batch.set(doc(collection(db, 'groups', CODE, 'members')), member('Tom'))
    await assertSucceeds(batch.commit())
  })

  it('refuse un appareil non connecté', async () => {
    await seedGroup()
    await assertFails(getDoc(doc(asAnonymous(), 'groups', CODE)))
    await assertFails(
      setDoc(doc(asAnonymous(), 'groups', 'ABCDEFGH'), {
        name: 'X',
        createdAt: serverTimestamp(),
      }),
    )
  })

  it('autorise la lecture par code mais jamais la liste des groupes', async () => {
    await seedGroup()
    const db = asDevice('bob')
    await assertSucceeds(getDoc(doc(db, 'groups', CODE)))
    await assertFails(getDocs(collection(db, 'groups')))
  })

  it("refuse un identifiant qui n'est pas un code valide", async () => {
    const db = asDevice('alice')
    for (const id of ['K7M2QX4O', 'k7m2qx4p', 'K7M2QX4', 'leamartin']) {
      await assertFails(setDoc(doc(db, 'groups', id), { name: 'X', createdAt: serverTimestamp() }))
    }
  })

  it('refuse un groupe mal formé', async () => {
    const db = asDevice('alice')
    const ref = doc(db, 'groups', CODE)
    await assertFails(setDoc(ref, { name: '', createdAt: serverTimestamp() }))
    await assertFails(setDoc(ref, { name: 'x'.repeat(61), createdAt: serverTimestamp() }))
    await assertFails(setDoc(ref, { name: 'Famille', createdAt: new Date(2000, 0, 1) }))
    await assertFails(setDoc(ref, { name: 'Famille', createdAt: serverTimestamp(), admin: true }))
  })

  it("n'écrase jamais un groupe existant et ne le supprime pas", async () => {
    await seedGroup()
    const db = asDevice('mallory')
    await assertFails(
      setDoc(doc(db, 'groups', CODE), { name: 'Piraté', createdAt: serverTimestamp() }),
    )
    await assertFails(deleteDoc(doc(db, 'groups', CODE)))
  })

  it('permet de renommer le groupe', async () => {
    await seedGroup()
    await assertSucceeds(updateDoc(doc(asDevice('bob'), 'groups', CODE), { name: 'Les Martin' }))
  })
})

describe('members', () => {
  it('lit et ajoute des membres dans un groupe existant (B1)', async () => {
    await seedGroup()
    const db = asDevice('bob')
    await assertSucceeds(getDocs(collection(db, 'groups', CODE, 'members')))
    await assertSucceeds(setDoc(doc(db, 'groups', CODE, 'members', 'tom'), member('Tom')))
  })

  it("refuse d'ajouter un membre à un groupe inexistant", async () => {
    const db = asDevice('bob')
    await assertFails(setDoc(doc(db, 'groups', 'ABCDEFGH', 'members', 'tom'), member('Tom')))
  })

  it('valide le schéma du membre', async () => {
    await seedGroup()
    const db = asDevice('bob')
    const ref = doc(db, 'groups', CODE, 'members', 'tom')
    await assertFails(setDoc(ref, { ...member('Tom'), name: '' }))
    await assertFails(setDoc(ref, { ...member('Tom'), name: 'x'.repeat(31) }))
    await assertFails(setDoc(ref, { ...member('Tom'), color: 'red' }))
    await assertFails(setDoc(ref, { ...member('Tom'), archived: true }))
    await assertFails(setDoc(ref, { ...member('Tom'), isAdmin: true }))
    const withoutEmoji = {
      name: 'Tom',
      color: '#2f6b4f',
      archived: false,
      createdAt: serverTimestamp(),
    }
    await assertSucceeds(setDoc(ref, withoutEmoji))
  })

  it('renomme, change couleur et emoji, archive puis désarchive (B1, B2)', async () => {
    await seedGroup()
    const ref = doc(asDevice('bob'), 'groups', CODE, 'members', 'lea')
    await assertSucceeds(updateDoc(ref, { name: 'Léa M.', color: '#1d4ed8', emoji: '🐼' }))
    await assertSucceeds(updateDoc(ref, { emoji: deleteField() }))
    await assertSucceeds(updateDoc(ref, { archived: true }))
    await assertSucceeds(updateDoc(ref, { archived: false }))
  })

  it('refuse de modifier la date de création ou de supprimer un membre', async () => {
    await seedGroup()
    const ref = doc(asDevice('bob'), 'groups', CODE, 'members', 'lea')
    await assertFails(updateDoc(ref, { createdAt: serverTimestamp() }))
    await assertFails(deleteDoc(ref))
  })
})
