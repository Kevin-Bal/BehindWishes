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
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
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

/** Appareil lié à un membre (niveau 2) : sa session est créée sans passer par les règles. */
async function asMember(memberId: string): Promise<Firestore> {
  const uid = `tel-${memberId}`
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore
    await setDoc(doc(db, 'groups', CODE, 'sessions', uid), { memberId, updatedAt: new Date() })
  })
  return asDevice(uid)
}

const member = (name: string) => ({
  name,
  color: '#b8322a',
  emoji: '🦊',
  archived: false,
  createdAt: serverTimestamp(),
})

/** Crée un groupe et ses membres (Léa, Tom, Mamie) sans passer par les règles. */
async function seedGroup() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore
    await setDoc(doc(db, 'groups', CODE), { name: 'Famille', createdAt: new Date() })
    for (const [id, name] of [
      ['lea', 'Léa'],
      ['tom', 'Tom'],
      ['mamie', 'Mamie'],
    ]) {
      await setDoc(doc(db, 'groups', CODE, 'members', id!), {
        name,
        color: '#b8322a',
        archived: false,
        createdAt: new Date(),
      })
    }
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
    await assertSucceeds(setDoc(doc(db, 'groups', CODE, 'members', 'papy'), member('Tom')))
  })

  it("refuse d'ajouter un membre à un groupe inexistant", async () => {
    const db = asDevice('bob')
    await assertFails(setDoc(doc(db, 'groups', 'ABCDEFGH', 'members', 'papy'), member('Tom')))
  })

  it('valide le schéma du membre', async () => {
    await seedGroup()
    const db = asDevice('bob')
    const ref = doc(db, 'groups', CODE, 'members', 'papy')
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

describe('sessions (niveau 2)', () => {
  it('un appareil se lie à un membre existant, et seulement pour lui-même', async () => {
    await seedGroup()
    const db = asDevice('tel-tom')
    const ref = doc(db, 'groups', CODE, 'sessions', 'tel-tom')
    await assertSucceeds(setDoc(ref, { memberId: 'tom', updatedAt: serverTimestamp() }))
    // « Ce n'est pas moi » : changer d'identité met à jour la session.
    await assertSucceeds(setDoc(ref, { memberId: 'lea', updatedAt: serverTimestamp() }))
    await assertSucceeds(getDoc(ref))
    await assertFails(setDoc(ref, { memberId: 'inconnu', updatedAt: serverTimestamp() }))
    await assertFails(
      setDoc(doc(db, 'groups', CODE, 'sessions', 'tel-lea'), {
        memberId: 'lea',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('ne lit ni ne liste les sessions des autres', async () => {
    await seedGroup()
    await asMember('lea')
    const db = asDevice('tel-tom')
    await assertFails(getDoc(doc(db, 'groups', CODE, 'sessions', 'tel-lea')))
    await assertFails(getDocs(collection(db, 'groups', CODE, 'sessions')))
  })
})

describe('events', () => {
  const event = (overrides: Record<string, unknown> = {}) => ({
    title: 'Noël 2026',
    type: 'noel',
    date: Timestamp.fromDate(new Date(2026, 11, 25, 12)),
    beneficiaryIds: ['lea'],
    participantIds: ['lea', 'tom'],
    archived: false,
    createdBy: 'lea',
    createdAt: serverTimestamp(),
    ...overrides,
  })

  it('crée un évènement avec ou sans date (C2)', async () => {
    await seedGroup()
    const db = asDevice('bob')
    await assertSucceeds(setDoc(doc(db, 'groups', CODE, 'events', 'noel'), event()))
    await assertSucceeds(
      setDoc(doc(db, 'groups', CODE, 'events', 'pot'), event({ type: 'autre', date: null })),
    )
  })

  it('exige au moins un bénéficiaire, lui-même participant', async () => {
    await seedGroup()
    const ref = doc(asDevice('bob'), 'groups', CODE, 'events', 'e1')
    await assertFails(setDoc(ref, event({ beneficiaryIds: [] })))
    await assertFails(setDoc(ref, event({ beneficiaryIds: ['lea'], participantIds: ['tom'] })))
  })

  it('valide le schéma et le créateur', async () => {
    await seedGroup()
    const ref = doc(asDevice('bob'), 'groups', CODE, 'events', 'e1')
    await assertFails(setDoc(ref, event({ title: '' })))
    await assertFails(setDoc(ref, event({ title: 'x'.repeat(81) })))
    await assertFails(setDoc(ref, event({ type: 'mariage' })))
    await assertFails(setDoc(ref, event({ date: '2026-12-25' })))
    await assertFails(setDoc(ref, event({ archived: true })))
    await assertFails(setDoc(ref, event({ createdBy: 'inconnu' })))
    await assertFails(setDoc(ref, event({ secret: true })))
  })

  it('modifie et archive, sans toucher au créateur (C3)', async () => {
    await seedGroup()
    const db = asDevice('bob')
    const ref = doc(db, 'groups', CODE, 'events', 'e1')
    await assertSucceeds(setDoc(ref, event()))
    await assertSucceeds(updateDoc(ref, { title: 'Noël chez Mamie', date: null }))
    await assertSucceeds(updateDoc(ref, { archived: true }))
    await assertFails(updateDoc(ref, { createdBy: 'tom' }))
    await assertFails(updateDoc(ref, { beneficiaryIds: [] }))
  })

  it('lit les évènements par participant ; seul le créateur supprime (C3, niveau 2)', async () => {
    await seedGroup()
    const lea = await asMember('lea')
    const tom = await asMember('tom')
    await assertSucceeds(setDoc(doc(lea, 'groups', CODE, 'events', 'e1'), event()))
    await assertSucceeds(
      getDocs(
        query(
          collection(tom, 'groups', CODE, 'events'),
          where('participantIds', 'array-contains', 'tom'),
        ),
      ),
    )
    await assertFails(deleteDoc(doc(tom, 'groups', CODE, 'events', 'e1')))
    await assertFails(deleteDoc(doc(asDevice('sans-session'), 'groups', CODE, 'events', 'e1')))
    await assertSucceeds(deleteDoc(doc(lea, 'groups', CODE, 'events', 'e1')))
    await assertFails(getDoc(doc(asAnonymous(), 'groups', CODE, 'events', 'e1')))
  })
})

/** Évènement « noel » : Léa et Tom bénéficiaires ; Léa, Tom et Mamie participants. */
async function seedEvent() {
  await seedGroup()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore
    await setDoc(doc(db, 'groups', CODE, 'events', 'noel'), {
      title: 'Noël',
      type: 'noel',
      date: null,
      beneficiaryIds: ['lea', 'tom'],
      participantIds: ['lea', 'tom', 'mamie'],
      archived: false,
      createdBy: 'lea',
      createdAt: new Date(),
    })
  })
}

describe('wishes', () => {
  const wishPath = ['groups', CODE, 'events', 'noel', 'wishes'] as const

  const wish = (overrides: Record<string, unknown> = {}) => ({
    beneficiaryId: 'lea',
    title: 'Un livre',
    url: 'https://www.exemple.fr/livre',
    description: 'Le tome 2',
    priceEstimate: 19.9,
    priority: 3,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  })

  it('le bénéficiaire ajoute un souhait complet ou avec le seul titre (D2)', async () => {
    await seedEvent()
    const lea = await asMember('lea')
    await assertSucceeds(setDoc(doc(lea, ...wishPath, 'w1'), wish()))
    await assertSucceeds(
      setDoc(doc(lea, ...wishPath, 'w2'), {
        beneficiaryId: 'lea',
        title: 'Une surprise',
        deleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it("personne d'autre n'écrit sur la liste de Léa (niveau 2)", async () => {
    await seedEvent()
    const tom = await asMember('tom')
    await assertFails(setDoc(doc(tom, ...wishPath, 'w1'), wish()))
    await assertFails(setDoc(doc(asDevice('sans-session'), ...wishPath, 'w1'), wish()))
    const lea = await asMember('lea')
    await assertSucceeds(setDoc(doc(lea, ...wishPath, 'w1'), wish()))
    await assertFails(
      updateDoc(doc(tom, ...wishPath, 'w1'), { title: 'Piraté', updatedAt: serverTimestamp() }),
    )
  })

  it("refuse un souhait pour quelqu'un qui n'est pas bénéficiaire", async () => {
    await seedEvent()
    const mamie = await asMember('mamie')
    await assertFails(setDoc(doc(mamie, ...wishPath, 'w1'), wish({ beneficiaryId: 'mamie' })))
  })

  it('valide le schéma : longueurs, lien http(s), prix, priorité', async () => {
    await seedEvent()
    const ref = doc(await asMember('lea'), ...wishPath, 'w1')
    await assertFails(setDoc(ref, wish({ title: '' })))
    await assertFails(setDoc(ref, wish({ title: 'x'.repeat(121) })))
    await assertFails(setDoc(ref, wish({ url: 'javascript:alert(1)' })))
    await assertFails(setDoc(ref, wish({ url: `https://a.fr/${'x'.repeat(500)}` })))
    await assertFails(setDoc(ref, wish({ description: 'x'.repeat(501) })))
    await assertFails(setDoc(ref, wish({ priceEstimate: -1 })))
    await assertFails(setDoc(ref, wish({ priceEstimate: '20' })))
    await assertFails(setDoc(ref, wish({ priority: 4 })))
    await assertFails(setDoc(ref, wish({ deleted: true })))
    // Aucune information de réservation dans un souhait.
    await assertFails(setDoc(ref, wish({ claimedBy: 'tom' })))
  })

  it('modifie puis supprime logiquement, jamais physiquement (D3)', async () => {
    await seedEvent()
    const ref = doc(await asMember('lea'), ...wishPath, 'w1')
    await assertSucceeds(setDoc(ref, wish()))
    await assertSucceeds(
      updateDoc(ref, {
        title: 'Un autre livre',
        priority: deleteField(),
        contentUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(updateDoc(ref, { title: 'Sans horodatage' }))
    await assertFails(
      updateDoc(ref, { contentUpdatedAt: new Date(2000, 0, 1), updatedAt: serverTimestamp() }),
    )
    await assertFails(updateDoc(ref, { beneficiaryId: 'tom', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() }))
    await assertFails(deleteDoc(ref))
  })

  it('tout participant lit les souhaits non supprimés', async () => {
    await seedEvent()
    const tom = await asMember('tom')
    await assertSucceeds(
      getDocs(query(collection(tom, ...wishPath), where('deleted', '==', false))),
    )
  })
})

describe('claims', () => {
  const eventPath = ['groups', CODE, 'events', 'noel'] as const

  async function seedWish({ deleted = false } = {}) {
    await seedEvent()
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore
      await setDoc(doc(db, ...eventPath, 'wishes', 'w1'), {
        beneficiaryId: 'lea',
        title: 'Un livre',
        deleted,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })
  }

  const claim = (claimedBy: string, overrides: Record<string, unknown> = {}) => ({
    wishId: 'w1',
    beneficiaryId: 'lea',
    claimedBy,
    status: 'reserved',
    claimedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  })

  const claimRef = (db: Firestore, id: string) => doc(db, ...eventPath, 'claims', id)

  it('plusieurs participants réservent le même souhait (E2)', async () => {
    await seedWish()
    await assertSucceeds(setDoc(claimRef(await asMember('tom'), 'w1_tom'), claim('tom')))
    await assertSucceeds(setDoc(claimRef(await asMember('mamie'), 'w1_mamie'), claim('mamie')))
  })

  it('une seule réservation par personne et par souhait, à son propre nom', async () => {
    await seedWish()
    const tom = await asMember('tom')
    await assertSucceeds(setDoc(claimRef(tom, 'w1_tom'), claim('tom')))
    await assertFails(setDoc(claimRef(tom, 'w1_tom'), claim('tom')))
    await assertFails(setDoc(claimRef(tom, 'autre_id'), claim('tom')))
    // Niveau 2 : on ne réserve pas au nom de quelqu'un d'autre.
    await assertFails(setDoc(claimRef(tom, 'w1_mamie'), claim('mamie')))
  })

  it('jamais sur sa propre liste, seulement par un participant (règle 4)', async () => {
    await seedWish()
    await assertFails(setDoc(claimRef(await asMember('lea'), 'w1_lea'), claim('lea')))
    await assertFails(setDoc(claimRef(await asMember('papy'), 'w1_papy'), claim('papy')))
  })

  it('bénéficiaire cohérent avec le souhait, souhait non supprimé', async () => {
    await seedWish()
    const mamie = await asMember('mamie')
    await assertFails(setDoc(claimRef(mamie, 'w1_mamie'), claim('mamie', { beneficiaryId: 'tom' })))
    await assertFails(setDoc(claimRef(mamie, 'w1_mamie'), claim('mamie', { status: 'purchased' })))
    await assertFails(setDoc(claimRef(mamie, 'w1_mamie'), claim('mamie', { note: 'x' })))
  })

  it('refuse de réserver un souhait supprimé', async () => {
    await seedWish({ deleted: true })
    await assertFails(setDoc(claimRef(await asMember('tom'), 'w1_tom'), claim('tom')))
  })

  it('seul le réservant passe à Acheté ou annule (E3, niveau 2)', async () => {
    await seedWish()
    const tom = await asMember('tom')
    const mamie = await asMember('mamie')
    await assertSucceeds(setDoc(claimRef(tom, 'w1_tom'), claim('tom')))
    await assertFails(
      updateDoc(claimRef(mamie, 'w1_tom'), { status: 'purchased', updatedAt: serverTimestamp() }),
    )
    await assertFails(deleteDoc(claimRef(mamie, 'w1_tom')))
    await assertSucceeds(
      updateDoc(claimRef(tom, 'w1_tom'), { status: 'purchased', updatedAt: serverTimestamp() }),
    )
    await assertFails(
      updateDoc(claimRef(tom, 'w1_tom'), { status: 'offert', updatedAt: serverTimestamp() }),
    )
    await assertFails(
      updateDoc(claimRef(tom, 'w1_tom'), { claimedBy: 'mamie', updatedAt: serverTimestamp() }),
    )
    await assertSucceeds(deleteDoc(claimRef(tom, 'w1_tom')))
  })

  it('les participants lisent les réservations des autres listes (E1, E4)', async () => {
    await seedWish()
    const tom = await asMember('tom')
    await assertSucceeds(setDoc(claimRef(tom, 'w1_tom'), claim('tom')))
    const claims = (db: Firestore) => collection(db, ...eventPath, 'claims')
    await assertSucceeds(getDocs(query(claims(tom), where('claimedBy', '==', 'tom'))))
    const mamie = await asMember('mamie')
    await assertSucceeds(getDocs(query(claims(mamie), where('beneficiaryId', '==', 'lea'))))
    await assertSucceeds(getDoc(claimRef(mamie, 'w1_tom')))
  })

  it("l'appareil de Léa ne lit jamais les réservations de sa liste (E5, niveau 2)", async () => {
    await seedWish()
    await assertSucceeds(setDoc(claimRef(await asMember('tom'), 'w1_tom'), claim('tom')))
    const lea = await asMember('lea')
    const claims = collection(lea, ...eventPath, 'claims')
    await assertFails(getDocs(query(claims, where('beneficiaryId', '==', 'lea'))))
    await assertFails(getDocs(claims))
    await assertFails(getDoc(claimRef(lea, 'w1_tom')))
    // Un appareil sans session ne lit rien non plus.
    await assertFails(getDoc(claimRef(asDevice('sans-session'), 'w1_tom')))
  })
})
