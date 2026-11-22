import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { estEnvie, listeNoel, type Cadeau, type ListeNoel, type Option } from '../data/noel'
import { getFirebase, missingFirebaseEnv, queued } from './firebase'

/**
 * Liste de la vitrine `/#/noel`, stockée en entier dans `vitrines/noel`.
 * Lecture publique ; écriture réservée aux appareils listés dans firestore.rules.
 * Tant que rien n'est en ligne (ou si Firebase est injoignable), on montre la liste
 * de départ de src/data/noel.ts.
 */

export const LIMITES = {
  cadeaux: 60,
  options: 12,
  precisions: 10,
  prenom: 40,
  texte: 600,
  champ: 200,
  url: 1000,
  prixMax: 100_000,
} as const

export type EtatListe =
  { statut: 'chargement' } | { statut: 'pret'; liste: ListeNoel; enLigne: boolean }

// ── Lecture défensive : les données viennent du réseau ─────────────────────

function texte(valeur: unknown, max: number = LIMITES.champ): string | undefined {
  if (typeof valeur !== 'string') return undefined
  const propre = valeur.trim().slice(0, max)
  return propre || undefined
}

/** N'accepte que des liens web (jamais `javascript:` ou autre). */
export function urlSure(valeur: unknown): string | undefined {
  const brut = texte(valeur, LIMITES.url)
  return brut && /^https?:\/\//i.test(brut) ? brut : undefined
}

function lireOption(brut: unknown): Option | null {
  if (!brut || typeof brut !== 'object') return null
  const o = brut as Record<string, unknown>
  const nom = texte(o.nom)
  const lien = urlSure(o.lien)
  if (!nom || !lien) return null
  return { nom, lien, auteur: texte(o.auteur), image: urlSure(o.image) }
}

function lireCadeau(brut: unknown): Cadeau | null {
  if (!brut || typeof brut !== 'object') return null
  const c = brut as Record<string, unknown>
  const id = texte(c.id, 80)
  const nom = texte(c.nom)
  if (!id || !nom) return null
  const prix =
    typeof c.prix === 'number' && c.prix >= 0 && c.prix <= LIMITES.prixMax ? c.prix : undefined
  const precisions = Array.isArray(c.precisions)
    ? c.precisions
        .map((p) => texte(p))
        .filter((p): p is string => !!p)
        .slice(0, LIMITES.precisions)
    : []
  const options = Array.isArray(c.options)
    ? c.options
        .map(lireOption)
        .filter((o): o is Option => !!o)
        .slice(0, LIMITES.options)
    : []
  return {
    id,
    nom,
    prix,
    devise: c.devise === 'USD' ? 'USD' : 'EUR',
    prixPar: texte(c.prixPar, 40),
    quantite: texte(c.quantite, 60),
    lien: urlSure(c.lien),
    boutique: texte(c.boutique, 60),
    image: urlSure(c.image),
    envie: estEnvie(c.envie) ? c.envie : 'plaisir',
    precisions: precisions.length > 0 ? precisions : undefined,
    mot: texte(c.mot, LIMITES.texte),
    options: options.length > 0 ? options : undefined,
  }
}

/** Liste lue dans Firestore, ou `null` si le document n'en contient pas encore. */
export function lireListe(data: unknown): ListeNoel | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (!Array.isArray(d.cadeaux)) return null
  return {
    prenom: texte(d.prenom, LIMITES.prenom) ?? listeNoel.prenom,
    intro: texte(d.intro, LIMITES.texte) ?? '',
    outro: texte(d.outro, LIMITES.texte),
    cadeaux: d.cadeaux
      .map(lireCadeau)
      .filter((c): c is Cadeau => !!c)
      .slice(0, LIMITES.cadeaux),
  }
}

// ── Abonnement et écriture ─────────────────────────────────────────────────

function vitrineRef() {
  return doc(getFirebase().db, 'vitrines', 'noel')
}

const DEPART: EtatListe = { statut: 'pret', liste: listeNoel, enLigne: false }

export function useListeNoel(): EtatListe {
  const disponible = missingFirebaseEnv.length === 0
  const [etat, setEtat] = useState<EtatListe>(() =>
    disponible ? { statut: 'chargement' } : DEPART,
  )

  useEffect(() => {
    if (!disponible) return
    return onSnapshot(
      vitrineRef(),
      (snap) => {
        const liste = lireListe(snap.data())
        setEtat(liste ? { statut: 'pret', liste, enLigne: true } : DEPART)
      },
      (error) => {
        console.warn('Liste de la vitrine indisponible', error)
        setEtat(DEPART)
      },
    )
  }, [disponible])

  return etat
}

/**
 * Nettoie un brouillon de l'éditeur (lignes vides, espaces, champs vides) avant écriture.
 * Firestore refuse les valeurs `undefined` : on passe par la même lecture défensive.
 */
export function nettoyerListe(liste: ListeNoel): ListeNoel {
  return lireListe(liste) ?? { ...liste, cadeaux: [] }
}

/** Remplace toute la liste d'un coup (le document reste petit). */
export function enregistrerListe(liste: ListeNoel): Promise<void> {
  const propre = JSON.parse(JSON.stringify(nettoyerListe(liste))) as ListeNoel
  return queued(setDoc(vitrineRef(), { ...propre, updatedAt: serverTimestamp() }))
}
